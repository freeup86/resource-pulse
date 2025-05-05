// forecastController.js
const { poolPromise, sql } = require('../db/config');
const axios = require('axios');

// Get utilization forecast
const getUtilizationForecast = async (req, res) => {
  try {
    const { startDate, endDate, resourceIds } = req.query;
    const months = req.query.months ? parseInt(req.query.months) : 6;
    
    const pool = await poolPromise;
    
    // Calculate date range if not provided
    const today = new Date();
    const forecastStartDate = startDate ? new Date(startDate) : today;
    
    // Default to N months from start date
    let forecastEndDate;
    if (endDate) {
      forecastEndDate = new Date(endDate);
    } else {
      forecastEndDate = new Date(forecastStartDate);
      forecastEndDate.setMonth(forecastEndDate.getMonth() + months);
    }
    
    // Parse resource IDs if provided
    const resourceFilter = resourceIds ? resourceIds.split(',').map(id => parseInt(id.trim())) : [];
    
    // Get resource list with their allocations
    let resourceQuery = `
      SELECT r.ResourceID, r.Name, r.Role
      FROM Resources r
    `;
    
    if (resourceFilter.length > 0) {
      resourceQuery += `WHERE r.ResourceID IN (${resourceFilter.join(',')})`;
    }
    
    const resourcesResult = await pool.request().query(resourceQuery);
    
    // Get allocations for these resources
    const allocationsQuery = `
      SELECT 
        a.ResourceID,
        a.ProjectID,
        p.Name as ProjectName,
        a.StartDate,
        a.EndDate,
        a.Utilization
      FROM Allocations a
      INNER JOIN Projects p ON a.ProjectID = p.ProjectID
      WHERE 
        a.EndDate >= @startDate
        AND a.StartDate <= @endDate
        ${resourceFilter.length > 0 ? `AND a.ResourceID IN (${resourceFilter.join(',')})` : ''}
    `;
    
    const allocationsResult = await pool.request()
      .input('startDate', sql.Date, forecastStartDate)
      .input('endDate', sql.Date, forecastEndDate)
      .query(allocationsQuery);
    
    // Get resource capacity data
    const capacityQuery = `
      SELECT 
        rc.ResourceID,
        rc.Year,
        rc.Month,
        rc.AvailableCapacity,
        rc.PlannedTimeOff
      FROM ResourceCapacity rc
      WHERE 
        (rc.Year > @startYear OR (rc.Year = @startYear AND rc.Month >= @startMonth))
        AND (rc.Year < @endYear OR (rc.Year = @endYear AND rc.Month <= @endMonth))
        ${resourceFilter.length > 0 ? `AND rc.ResourceID IN (${resourceFilter.join(',')})` : ''}
    `;
    
    const startYear = forecastStartDate.getFullYear();
    const startMonth = forecastStartDate.getMonth() + 1;
    const endYear = forecastEndDate.getFullYear();
    const endMonth = forecastEndDate.getMonth() + 1;
    
    const capacityResult = await pool.request()
      .input('startYear', sql.Int, startYear)
      .input('startMonth', sql.Int, startMonth)
      .input('endYear', sql.Int, endYear)
      .input('endMonth', sql.Int, endMonth)
      .query(capacityQuery);
    
    // Generate months for the forecast period
    const forecastMonths = [];
    let currentDate = new Date(forecastStartDate);
    while (currentDate <= forecastEndDate) {
      forecastMonths.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        label: currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Build the utilization forecast model
    const utilizationForecast = resourcesResult.recordset.map(resource => {
      const resourceId = resource.ResourceID;
      
      // Get all allocations for this resource
      const resourceAllocations = allocationsResult.recordset
        .filter(a => a.ResourceID === resourceId);
      
      // Get capacity data for this resource
      const resourceCapacity = capacityResult.recordset
        .filter(c => c.ResourceID === resourceId);
      
      // Calculate monthly utilization
      const monthlyData = forecastMonths.map(month => {
        const monthDate = new Date(month.year, month.month - 1, 15); // Middle of month
        
        // Find allocations active in this month
        const activeAllocations = resourceAllocations.filter(allocation => {
          const startDate = new Date(allocation.StartDate);
          const endDate = new Date(allocation.EndDate);
          return startDate <= monthDate && endDate >= monthDate;
        });
        
        // Calculate total utilization for the month
        const totalUtilization = activeAllocations.reduce((sum, allocation) => {
          return sum + allocation.Utilization;
        }, 0);
        
        // Find capacity settings for this month
        const capacitySetting = resourceCapacity.find(c => 
          c.Year === month.year && c.Month === month.month
        );
        
        const availableCapacity = capacitySetting ? capacitySetting.AvailableCapacity : 100;
        const plannedTimeOff = capacitySetting ? capacitySetting.PlannedTimeOff : 0;
        
        // Calculate available capacity
        const effectiveCapacity = availableCapacity - plannedTimeOff;
        const remainingCapacity = Math.max(0, effectiveCapacity - totalUtilization);
        const overallocated = totalUtilization > effectiveCapacity;
        
        return {
          year: month.year,
          month: month.month,
          label: month.label,
          totalUtilization,
          availableCapacity,
          plannedTimeOff,
          effectiveCapacity,
          remainingCapacity,
          overallocated,
          allocations: activeAllocations.map(a => ({
            projectId: a.ProjectID,
            projectName: a.ProjectName,
            utilization: a.Utilization
          }))
        };
      });
      
      // Calculate average utilization
      const avgUtilization = monthlyData.reduce((sum, month) => sum + month.totalUtilization, 0) / monthlyData.length;
      
      // AI-based trend prediction
      const utilizationTrend = monthlyData.map(month => month.totalUtilization);
      const trendDirection = getTrendDirection(utilizationTrend);
      
      return {
        resourceId,
        name: resource.Name,
        role: resource.Role,
        avgUtilization,
        trendDirection,
        forecastStatus: getResourceForecastStatus(avgUtilization, trendDirection),
        months: monthlyData
      };
    });
    
    // Team-level aggregation
    const teamMonthlyUtilization = forecastMonths.map((month, index) => {
      const monthUtilization = utilizationForecast.reduce((sum, resource) => {
        return sum + resource.months[index].totalUtilization;
      }, 0);
      
      const monthCapacity = utilizationForecast.reduce((sum, resource) => {
        return sum + resource.months[index].effectiveCapacity;
      }, 0);
      
      const utilizationRate = monthCapacity > 0 ? (monthUtilization / monthCapacity) * 100 : 0;
      
      return {
        year: month.year,
        month: month.month,
        label: month.label,
        totalUtilization: monthUtilization,
        totalCapacity: monthCapacity,
        utilizationRate: Math.min(utilizationRate, 100),
        overallocated: utilizationRate > 100
      };
    });
    
    // AI-enhanced forecast response
    res.json({
      startDate: forecastStartDate,
      endDate: forecastEndDate,
      months: forecastMonths.map(m => m.label),
      team: {
        monthlyUtilization: teamMonthlyUtilization,
        avgUtilizationRate: teamMonthlyUtilization.reduce((sum, m) => sum + m.utilizationRate, 0) / teamMonthlyUtilization.length,
        trendDirection: getTrendDirection(teamMonthlyUtilization.map(m => m.utilizationRate)),
        forecast: generateTeamForecast(teamMonthlyUtilization)
      },
      resources: utilizationForecast
    });
    
  } catch (err) {
    console.error('Error getting utilization forecast:', err);
    res.status(500).json({
      message: 'Error generating utilization forecast',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get bottlenecks detection
const getBottlenecks = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const months = req.query.months ? parseInt(req.query.months) : 6;
    
    const pool = await poolPromise;
    
    // Calculate date range if not provided
    const today = new Date();
    const forecastStartDate = startDate ? new Date(startDate) : today;
    
    // Default to N months from start date
    let forecastEndDate;
    if (endDate) {
      forecastEndDate = new Date(endDate);
    } else {
      forecastEndDate = new Date(forecastStartDate);
      forecastEndDate.setMonth(forecastEndDate.getMonth() + months);
    }
    
    // Get all resources and their allocations
    const resourcesQuery = `
      SELECT r.ResourceID, r.Name, r.Role, ro.Name as RoleName
      FROM Resources r
      LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
    `;
    
    const resourcesResult = await pool.request().query(resourcesQuery);
    
    // Get allocations
    const allocationsQuery = `
      SELECT 
        a.ResourceID,
        a.ProjectID,
        p.Name as ProjectName,
        a.StartDate,
        a.EndDate,
        a.Utilization
      FROM Allocations a
      INNER JOIN Projects p ON a.ProjectID = p.ProjectID
      WHERE 
        a.EndDate >= @startDate
        AND a.StartDate <= @endDate
    `;
    
    const allocationsResult = await pool.request()
      .input('startDate', sql.Date, forecastStartDate)
      .input('endDate', sql.Date, forecastEndDate)
      .query(allocationsQuery);
    
    // Get resource capacity data
    const capacityQuery = `
      SELECT 
        rc.ResourceID,
        rc.Year,
        rc.Month,
        rc.AvailableCapacity,
        rc.PlannedTimeOff
      FROM ResourceCapacity rc
      WHERE 
        (rc.Year > @startYear OR (rc.Year = @startYear AND rc.Month >= @startMonth))
        AND (rc.Year < @endYear OR (rc.Year = @endYear AND rc.Month <= @endMonth))
    `;
    
    const startYear = forecastStartDate.getFullYear();
    const startMonth = forecastStartDate.getMonth() + 1;
    const endYear = forecastEndDate.getFullYear();
    const endMonth = forecastEndDate.getMonth() + 1;
    
    const capacityResult = await pool.request()
      .input('startYear', sql.Int, startYear)
      .input('startMonth', sql.Int, startMonth)
      .input('endYear', sql.Int, endYear)
      .input('endMonth', sql.Int, endMonth)
      .query(capacityQuery);
    
    // Generate months for the forecast period
    const forecastMonths = [];
    let currentDate = new Date(forecastStartDate);
    while (currentDate <= forecastEndDate) {
      forecastMonths.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        label: currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Detect bottlenecks by resource
    const resourceBottlenecks = resourcesResult.recordset.map(resource => {
      const resourceId = resource.ResourceID;
      
      // Get allocations for this resource
      const resourceAllocations = allocationsResult.recordset
        .filter(a => a.ResourceID === resourceId);
      
      // Get capacity for this resource
      const resourceCapacity = capacityResult.recordset
        .filter(c => c.ResourceID === resourceId);
      
      // Check each month for overallocation
      const overallocatedMonths = forecastMonths.map(month => {
        const monthDate = new Date(month.year, month.month - 1, 15);
        
        // Find allocations active in this month
        const activeAllocations = resourceAllocations.filter(allocation => {
          const startDate = new Date(allocation.StartDate);
          const endDate = new Date(allocation.EndDate);
          return startDate <= monthDate && endDate >= monthDate;
        });
        
        // Calculate total utilization
        const totalUtilization = activeAllocations.reduce((sum, allocation) => {
          return sum + allocation.Utilization;
        }, 0);
        
        // Find capacity for this month
        const capacitySetting = resourceCapacity.find(c => 
          c.Year === month.year && c.Month === month.month
        );
        
        const availableCapacity = capacitySetting ? capacitySetting.AvailableCapacity : 100;
        const plannedTimeOff = capacitySetting ? capacitySetting.PlannedTimeOff : 0;
        const effectiveCapacity = availableCapacity - plannedTimeOff;
        
        return {
          month: month.label,
          totalUtilization,
          effectiveCapacity,
          overallocated: totalUtilization > effectiveCapacity,
          overallocationAmount: Math.max(0, totalUtilization - effectiveCapacity),
          projects: activeAllocations.map(a => ({
            id: a.ProjectID,
            name: a.ProjectName,
            utilization: a.Utilization
          }))
        };
      }).filter(month => month.overallocated);
      
      return {
        resourceId,
        name: resource.Name,
        role: resource.RoleName || resource.Role,
        overallocatedMonths,
        isBottleneck: overallocatedMonths.length > 0,
        bottleneckSeverity: calculateBottleneckSeverity(overallocatedMonths)
      };
    }).filter(resource => resource.isBottleneck);
    
    // Detect bottlenecks by role
    const roleUtilization = {};
    const roleCapacity = {};
    
    // Aggregate by role
    resourcesResult.recordset.forEach(resource => {
      const role = resource.RoleName || resource.Role;
      const resourceId = resource.ResourceID;
      
      if (!roleUtilization[role]) {
        roleUtilization[role] = {};
        roleCapacity[role] = {};
      }
      
      // Get allocations for this resource
      const resourceAllocations = allocationsResult.recordset
        .filter(a => a.ResourceID === resourceId);
      
      // Get capacity for this resource
      const resourceCapacity = capacityResult.recordset
        .filter(c => c.ResourceID === resourceId);
      
      // Calculate utilization for each month
      forecastMonths.forEach(month => {
        const monthDate = new Date(month.year, month.month - 1, 15);
        const monthLabel = month.label;
        
        if (!roleUtilization[role][monthLabel]) {
          roleUtilization[role][monthLabel] = 0;
        }
        
        if (!roleCapacity[role][monthLabel]) {
          roleCapacity[role][monthLabel] = 0;
        }
        
        // Find allocations active in this month
        const activeAllocations = resourceAllocations.filter(allocation => {
          const startDate = new Date(allocation.StartDate);
          const endDate = new Date(allocation.EndDate);
          return startDate <= monthDate && endDate >= monthDate;
        });
        
        // Calculate total utilization
        const totalUtilization = activeAllocations.reduce((sum, allocation) => {
          return sum + allocation.Utilization;
        }, 0);
        
        // Find capacity for this month
        const capacitySetting = resourceCapacity.find(c => 
          c.Year === month.year && c.Month === month.month
        );
        
        const availableCapacity = capacitySetting ? capacitySetting.AvailableCapacity : 100;
        const plannedTimeOff = capacitySetting ? capacitySetting.PlannedTimeOff : 0;
        const effectiveCapacity = availableCapacity - plannedTimeOff;
        
        roleUtilization[role][monthLabel] += totalUtilization;
        roleCapacity[role][monthLabel] += effectiveCapacity;
      });
    });
    
    // Detect role bottlenecks
    const roleBottlenecks = Object.keys(roleUtilization).map(role => {
      const overallocatedMonths = [];
      
      forecastMonths.forEach(month => {
        const monthLabel = month.label;
        const totalUtilization = roleUtilization[role][monthLabel] || 0;
        const totalCapacity = roleCapacity[role][monthLabel] || 0;
        
        if (totalUtilization > totalCapacity) {
          overallocatedMonths.push({
            month: monthLabel,
            totalUtilization,
            totalCapacity,
            overallocationAmount: totalUtilization - totalCapacity,
            utilizationRate: totalCapacity > 0 ? (totalUtilization / totalCapacity) * 100 : 0
          });
        }
      });
      
      return {
        role,
        overallocatedMonths,
        isBottleneck: overallocatedMonths.length > 0,
        bottleneckSeverity: calculateBottleneckSeverity(overallocatedMonths),
        // Get resources with this role
        resources: resourcesResult.recordset
          .filter(r => (r.RoleName || r.Role) === role)
          .map(r => ({
            id: r.ResourceID,
            name: r.Name
          }))
      };
    }).filter(role => role.isBottleneck);
    
    // Project bottlenecks
    const projectUtilization = {};
    
    // Aggregate by project
    allocationsResult.recordset.forEach(allocation => {
      const projectId = allocation.ProjectID;
      const projectName = allocation.ProjectName;
      
      if (!projectUtilization[projectId]) {
        projectUtilization[projectId] = {
          id: projectId,
          name: projectName,
          months: {}
        };
      }
      
      // Calculate allocation for each month
      forecastMonths.forEach(month => {
        const monthDate = new Date(month.year, month.month - 1, 15);
        const monthLabel = month.label;
        
        if (!projectUtilization[projectId].months[monthLabel]) {
          projectUtilization[projectId].months[monthLabel] = {
            resourceCount: 0,
            allocations: []
          };
        }
        
        // Check if allocation is active for this month
        const startDate = new Date(allocation.StartDate);
        const endDate = new Date(allocation.EndDate);
        
        if (startDate <= monthDate && endDate >= monthDate) {
          projectUtilization[projectId].months[monthLabel].resourceCount++;
          projectUtilization[projectId].months[monthLabel].allocations.push({
            resourceId: allocation.ResourceID,
            utilization: allocation.Utilization
          });
        }
      });
    });
    
    // Find projects with potential bottlenecks
    const projectBottlenecks = Object.values(projectUtilization)
      .map(project => {
        // Find months with high resource allocation
        const criticalMonths = Object.entries(project.months)
          .filter(([month, data]) => data.resourceCount >= 3)
          .map(([month, data]) => ({
            month,
            resourceCount: data.resourceCount,
            totalUtilization: data.allocations.reduce((sum, a) => sum + a.utilization, 0)
          }))
          .sort((a, b) => b.resourceCount - a.resourceCount);
        
        return {
          projectId: project.id,
          projectName: project.name,
          criticalMonths,
          isBottleneck: criticalMonths.length > 0,
          bottleneckRisk: criticalMonths.length > 0 ? 
            calculateProjectBottleneckRisk(criticalMonths) : 'none'
        };
      })
      .filter(project => project.isBottleneck)
      .sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1, none: 0 };
        return riskOrder[b.bottleneckRisk] - riskOrder[a.bottleneckRisk];
      });
    
    // AI-enhanced bottleneck analysis
    const bottleneckAnalysis = {
      resourceBottlenecks: resourceBottlenecks.sort((a, b) => b.bottleneckSeverity - a.bottleneckSeverity),
      roleBottlenecks: roleBottlenecks.sort((a, b) => b.bottleneckSeverity - a.bottleneckSeverity),
      projectBottlenecks: projectBottlenecks,
      aiRecommendations: generateBottleneckRecommendations(
        resourceBottlenecks, 
        roleBottlenecks, 
        projectBottlenecks
      )
    };
    
    res.json(bottleneckAnalysis);
    
  } catch (err) {
    console.error('Error detecting bottlenecks:', err);
    res.status(500).json({
      message: 'Error detecting resource bottlenecks',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Get workload balancing recommendations
const getWorkloadBalancing = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const months = req.query.months ? parseInt(req.query.months) : 6;
    
    const pool = await poolPromise;
    
    // Calculate date range if not provided
    const today = new Date();
    const forecastStartDate = startDate ? new Date(startDate) : today;
    
    // Default to N months from start date
    let forecastEndDate;
    if (endDate) {
      forecastEndDate = new Date(endDate);
    } else {
      forecastEndDate = new Date(forecastStartDate);
      forecastEndDate.setMonth(forecastEndDate.getMonth() + months);
    }
    
    // Get all resources with their skills and capacity
    const resourcesQuery = `
      SELECT 
        r.ResourceID, 
        r.Name, 
        r.Role, 
        ro.Name as RoleName,
        r.RoleID
      FROM Resources r
      LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
    `;
    
    const resourcesResult = await pool.request().query(resourcesQuery);
    
    // Get skills for each resource
    const resourceSkills = {};
    
    for (const resource of resourcesResult.recordset) {
      const skillsQuery = `
        SELECT s.SkillID, s.Name
        FROM Skills s
        INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
        WHERE rs.ResourceID = @resourceId
      `;
      
      const skillsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(skillsQuery);
      
      resourceSkills[resource.ResourceID] = skillsResult.recordset.map(s => s.Name);
    }
    
    // Get allocations
    const allocationsQuery = `
      SELECT 
        a.ResourceID,
        a.ProjectID,
        p.Name as ProjectName,
        a.StartDate,
        a.EndDate,
        a.Utilization
      FROM Allocations a
      INNER JOIN Projects p ON a.ProjectID = p.ProjectID
      WHERE 
        a.EndDate >= @startDate
        AND a.StartDate <= @endDate
    `;
    
    const allocationsResult = await pool.request()
      .input('startDate', sql.Date, forecastStartDate)
      .input('endDate', sql.Date, forecastEndDate)
      .query(allocationsQuery);
    
    // Calculate monthly utilization by resource
    const resourceUtilization = {};
    
    // Generate months for the forecast period
    const forecastMonths = [];
    let currentDate = new Date(forecastStartDate);
    while (currentDate <= forecastEndDate) {
      forecastMonths.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        label: currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    resourcesResult.recordset.forEach(resource => {
      const resourceId = resource.ResourceID;
      
      // Get allocations for this resource
      const resourceAllocations = allocationsResult.recordset
        .filter(a => a.ResourceID === resourceId);
      
      resourceUtilization[resourceId] = {
        id: resourceId,
        name: resource.Name,
        role: resource.RoleName || resource.Role,
        roleId: resource.RoleID,
        skills: resourceSkills[resourceId] || [],
        monthlyUtilization: {}
      };
      
      // Calculate utilization for each month
      forecastMonths.forEach(month => {
        const monthDate = new Date(month.year, month.month - 1, 15);
        const monthLabel = month.label;
        
        // Find allocations active in this month
        const activeAllocations = resourceAllocations.filter(allocation => {
          const startDate = new Date(allocation.StartDate);
          const endDate = new Date(allocation.EndDate);
          return startDate <= monthDate && endDate >= monthDate;
        });
        
        // Calculate total utilization
        const totalUtilization = activeAllocations.reduce((sum, allocation) => {
          return sum + allocation.Utilization;
        }, 0);
        
        resourceUtilization[resourceId].monthlyUtilization[monthLabel] = {
          utilization: totalUtilization,
          allocations: activeAllocations.map(a => ({
            projectId: a.ProjectID,
            projectName: a.ProjectName,
            utilization: a.Utilization
          }))
        };
      });
      
      // Calculate average utilization
      resourceUtilization[resourceId].avgUtilization = 
        Object.values(resourceUtilization[resourceId].monthlyUtilization)
          .reduce((sum, month) => sum + month.utilization, 0) / 
        Object.values(resourceUtilization[resourceId].monthlyUtilization).length;
    });
    
    // Find overallocated and underallocated resources
    const overallocatedResources = [];
    const underallocatedResources = [];
    
    Object.values(resourceUtilization).forEach(resource => {
      // Check monthly utilization
      let isOverallocated = false;
      let isUnderallocated = true;
      
      Object.entries(resource.monthlyUtilization).forEach(([month, data]) => {
        if (data.utilization > 100) {
          isOverallocated = true;
        }
        if (data.utilization >= 70) {
          isUnderallocated = false;
        }
      });
      
      if (isOverallocated) {
        overallocatedResources.push(resource);
      } else if (isUnderallocated && resource.avgUtilization < 70) {
        underallocatedResources.push(resource);
      }
    });
    
    // Find skill and role compatibility for potential transfers
    const balancingRecommendations = [];
    
    overallocatedResources.forEach(overallocated => {
      // Find critical months
      const criticalMonths = Object.entries(overallocated.monthlyUtilization)
        .filter(([month, data]) => data.utilization > 100)
        .map(([month, data]) => ({
          month,
          utilization: data.utilization,
          overallocationAmount: data.utilization - 100,
          allocations: data.allocations
        }))
        .sort((a, b) => b.overallocationAmount - a.overallocationAmount);
      
      if (criticalMonths.length === 0) return;
      
      // Find potential resources to transfer work to
      const potentialTransfers = underallocatedResources
        .filter(underallocated => {
          // Check skill compatibility (at least 1 matching skill)
          const skillsMatch = underallocated.skills.some(skill => 
            overallocated.skills.includes(skill)
          );
          
          // Check role compatibility (same role is ideal)
          const roleMatch = underallocated.roleId === overallocated.roleId;
          
          // Check capacity during critical months
          const hasCapacity = criticalMonths.every(critical => {
            const underallocatedUtilization = 
              underallocated.monthlyUtilization[critical.month]?.utilization || 0;
            return underallocatedUtilization < 90; // Has some room for more work
          });
          
          return (skillsMatch || roleMatch) && hasCapacity;
        })
        .map(underallocated => {
          // Calculate compatibility score
          const skillsMatchCount = underallocated.skills.filter(skill => 
            overallocated.skills.includes(skill)
          ).length;
          
          const skillCompatibilityScore = overallocated.skills.length > 0 ?
            (skillsMatchCount / overallocated.skills.length) * 60 : 0;
          
          const roleCompatibilityScore = underallocated.roleId === overallocated.roleId ? 40 : 0;
          
          const totalCompatibilityScore = skillCompatibilityScore + roleCompatibilityScore;
          
          // Calculate available capacity during critical months
          const availableCapacity = criticalMonths.map(critical => {
            const currentUtilization = 
              underallocated.monthlyUtilization[critical.month]?.utilization || 0;
            return {
              month: critical.month,
              availableCapacity: Math.max(0, 90 - currentUtilization) // Cap at 90% max utilization
            };
          });
          
          return {
            resource: {
              id: underallocated.id,
              name: underallocated.name,
              role: underallocated.role
            },
            compatibilityScore: totalCompatibilityScore,
            skillsMatchCount,
            roleMatch: underallocated.roleId === overallocated.roleId,
            availableCapacity
          };
        })
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      
      // Generate transfer recommendations
      const recommendations = [];
      
      criticalMonths.forEach(critical => {
        // Find the allocations that can potentially be transferred
        const transferableAllocations = critical.allocations
          .filter(allocation => allocation.utilization <= 50) // Only consider smaller allocations
          .sort((a, b) => a.utilization - b.utilization); // Start with smallest allocations
        
        transferableAllocations.forEach(allocation => {
          potentialTransfers.forEach(transfer => {
            const availableCapacity = transfer.availableCapacity.find(cap => 
              cap.month === critical.month
            )?.availableCapacity || 0;
            
            if (availableCapacity >= allocation.utilization) {
              recommendations.push({
                project: {
                  id: allocation.projectId,
                  name: allocation.projectName
                },
                utilization: allocation.utilization,
                month: critical.month,
                fromResource: {
                  id: overallocated.id,
                  name: overallocated.name
                },
                toResource: transfer.resource,
                compatibilityScore: transfer.compatibilityScore,
                skillsMatch: transfer.skillsMatchCount > 0,
                roleMatch: transfer.roleMatch
              });
            }
          });
        });
      });
      
      if (recommendations.length > 0) {
        balancingRecommendations.push({
          overallocatedResource: {
            id: overallocated.id,
            name: overallocated.name,
            role: overallocated.role
          },
          criticalMonths,
          recommendations: recommendations.slice(0, 3) // Limit to top 3 recommendations
        });
      }
    });
    
    // Generate workload balancing response
    const workloadBalancing = {
      overallocatedResources: overallocatedResources.map(resource => ({
        id: resource.id,
        name: resource.name,
        role: resource.role,
        avgUtilization: resource.avgUtilization,
        monthlyUtilization: Object.entries(resource.monthlyUtilization).map(([month, data]) => ({
          month,
          utilization: data.utilization,
          allocations: data.allocations
        }))
      })),
      underallocatedResources: underallocatedResources.map(resource => ({
        id: resource.id,
        name: resource.name,
        role: resource.role,
        avgUtilization: resource.avgUtilization,
        monthlyUtilization: Object.entries(resource.monthlyUtilization).map(([month, data]) => ({
          month,
          utilization: data.utilization,
          allocations: data.allocations
        }))
      })),
      balancingRecommendations,
      summary: generateWorkloadBalancingSummary(
        overallocatedResources, 
        underallocatedResources,
        balancingRecommendations
      )
    };
    
    res.json(workloadBalancing);
    
  } catch (err) {
    console.error('Error getting workload balancing recommendations:', err);
    res.status(500).json({
      message: 'Error generating workload balancing recommendations',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

// Helper to calculate trend direction
function getTrendDirection(values) {
  if (values.length < 2) return 'stable';
  
  // Simple linear regression
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  for (let i = 0; i < values.length; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  const n = values.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  if (slope > 0.5) return 'increasing';
  if (slope < -0.5) return 'decreasing';
  return 'stable';
}

// Helper to determine resource forecast status
function getResourceForecastStatus(avgUtilization, trendDirection) {
  if (avgUtilization > 100) return 'overallocated';
  if (avgUtilization > 90) {
    if (trendDirection === 'increasing') return 'at-risk';
    return 'busy';
  }
  if (avgUtilization > 70) return 'healthy';
  if (avgUtilization > 40) return 'available';
  return 'underutilized';
}

// Helper to generate team level forecast
function generateTeamForecast(teamUtilization) {
  const avgUtilizationRate = teamUtilization.reduce((sum, m) => sum + m.utilizationRate, 0) / teamUtilization.length;
  const trendDirection = getTrendDirection(teamUtilization.map(m => m.utilizationRate));
  
  // Find potential bottleneck months
  const bottleneckMonths = teamUtilization.filter(m => m.utilizationRate > 90).map(m => m.label);
  
  // Generate forecast text
  let forecastText = '';
  
  if (avgUtilizationRate > 95) {
    forecastText = 'The team is critically overallocated. Immediate workload balancing is recommended.';
  } else if (avgUtilizationRate > 90) {
    forecastText = 'The team is operating near maximum capacity with minimal flexibility for unexpected work.';
  } else if (avgUtilizationRate > 80) {
    forecastText = 'The team is well-utilized but has little buffer for additional work.';
  } else if (avgUtilizationRate > 70) {
    forecastText = 'The team has a healthy utilization rate with some capacity for additional work.';
  } else {
    forecastText = 'The team has significant available capacity for additional projects.';
  }
  
  // Add trend information
  if (trendDirection === 'increasing') {
    forecastText += ' Utilization is trending upward, which may lead to capacity issues.';
  } else if (trendDirection === 'decreasing') {
    forecastText += ' Utilization is trending downward, which will create additional capacity.';
  }
  
  // Add bottleneck information
  if (bottleneckMonths.length > 0) {
    forecastText += ` Potential capacity issues identified in: ${bottleneckMonths.join(', ')}.`;
  }
  
  return {
    utilizationCategory: getTeamUtilizationCategory(avgUtilizationRate),
    bottleneckMonths,
    forecastText
  };
}

// Helper to categorize team utilization
function getTeamUtilizationCategory(avgUtilizationRate) {
  if (avgUtilizationRate > 95) return 'critical';
  if (avgUtilizationRate > 90) return 'high';
  if (avgUtilizationRate > 80) return 'balanced';
  if (avgUtilizationRate > 70) return 'moderate';
  return 'low';
}

// Helper to calculate bottleneck severity
function calculateBottleneckSeverity(overallocatedMonths) {
  if (overallocatedMonths.length === 0) return 0;
  
  // Calculate average overallocation amount
  const avgOverallocation = overallocatedMonths.reduce((sum, month) => {
    return sum + (month.overallocationAmount || 0);
  }, 0) / overallocatedMonths.length;
  
  // Calculate duration factor (more months = more severe)
  const durationFactor = Math.min(overallocatedMonths.length / 3, 1);
  
  // Combine factors
  return (avgOverallocation / 10) * (1 + durationFactor);
}

// Helper to calculate project bottleneck risk
function calculateProjectBottleneckRisk(criticalMonths) {
  if (criticalMonths.length === 0) return 'none';
  
  // Calculate the highest resource count
  const maxResourceCount = Math.max(...criticalMonths.map(m => m.resourceCount));
  
  // Calculate total utilization
  const maxUtilization = Math.max(...criticalMonths.map(m => m.totalUtilization));
  
  // Determine risk based on factors
  if (maxResourceCount >= 5 || maxUtilization >= 400) {
    return 'high';
  }
  
  if (maxResourceCount >= 4 || maxUtilization >= 300) {
    return 'medium';
  }
  
  return 'low';
}

// Helper to generate bottleneck recommendations
function generateBottleneckRecommendations(resourceBottlenecks, roleBottlenecks, projectBottlenecks) {
  const recommendations = [];
  
  // Resource-level recommendations
  if (resourceBottlenecks.length > 0) {
    const criticalResources = resourceBottlenecks
      .filter(r => r.bottleneckSeverity > 5)
      .map(r => r.name);
    
    if (criticalResources.length > 0) {
      recommendations.push(
        `Critical resource bottlenecks detected for: ${criticalResources.join(', ')}. ` +
        `Immediate workload rebalancing is recommended.`
      );
    }
    
    const highestSeverity = resourceBottlenecks[0];
    if (highestSeverity) {
      const monthsList = highestSeverity.overallocatedMonths
        .map(m => m.month)
        .join(', ');
      
      recommendations.push(
        `${highestSeverity.name} is the most overallocated resource with critical periods in ${monthsList}. ` +
        `Consider reassigning some of their work.`
      );
    }
  }
  
  // Role-level recommendations
  if (roleBottlenecks.length > 0) {
    const criticalRoles = roleBottlenecks
      .filter(r => r.bottleneckSeverity > 5)
      .map(r => r.role);
    
    if (criticalRoles.length > 0) {
      recommendations.push(
        `Capacity shortage detected for role(s): ${criticalRoles.join(', ')}. ` +
        `Consider hiring additional resources or cross-training existing team members.`
      );
    }
  }
  
  // Project-level recommendations
  if (projectBottlenecks.length > 0) {
    const highRiskProjects = projectBottlenecks
      .filter(p => p.bottleneckRisk === 'high')
      .map(p => p.projectName);
    
    if (highRiskProjects.length > 0) {
      recommendations.push(
        `High bottleneck risk identified for project(s): ${highRiskProjects.join(', ')}. ` +
        `Consider staggering timelines or reducing concurrent work streams.`
      );
    }
  }
  
  // General recommendations
  if (resourceBottlenecks.length > 3) {
    recommendations.push(
      `Multiple resource bottlenecks indicate systemic overallocation. ` +
      `Review project priorities and consider delaying or reducing scope of lower-priority initiatives.`
    );
  }
  
  return recommendations;
}

// Helper to generate workload balancing summary
function generateWorkloadBalancingSummary(overallocatedResources, underallocatedResources, balancingRecommendations) {
  const summary = {
    overallocatedCount: overallocatedResources.length,
    underallocatedCount: underallocatedResources.length,
    recommendationCount: balancingRecommendations.length,
    balancingOpportunityLevel: 'none',
    summaryText: ''
  };
  
  // Calculate potential balancing opportunity
  if (underallocatedResources.length === 0 || overallocatedResources.length === 0) {
    summary.balancingOpportunityLevel = 'none';
    
    if (overallocatedResources.length > 0) {
      summary.summaryText = 
        `${overallocatedResources.length} overallocated resources identified, but no available resources for workload transfer. ` +
        `Consider hiring additional team members or adjusting project timelines.`;
    } else if (underallocatedResources.length > 0) {
      summary.summaryText = 
        `${underallocatedResources.length} resources have low utilization. ` +
        `Consider bringing in new projects or reassigning them to support other teams.`;
    } else {
      summary.summaryText = `Team workload appears to be well-balanced.`;
    }
  } else {
    const recommendationRatio = balancingRecommendations.length / overallocatedResources.length;
    
    if (recommendationRatio > 0.7) {
      summary.balancingOpportunityLevel = 'high';
      summary.summaryText = 
        `Significant workload balancing opportunities identified. ` +
        `${balancingRecommendations.length} recommendations available to address ${overallocatedResources.length} overallocated resources.`;
    } else if (recommendationRatio > 0.3) {
      summary.balancingOpportunityLevel = 'medium';
      summary.summaryText = 
        `Some workload balancing opportunities identified, but skill or role mismatches limit options. ` +
        `${balancingRecommendations.length} recommendations available for ${overallocatedResources.length} overallocated resources.`;
    } else {
      summary.balancingOpportunityLevel = 'low';
      summary.summaryText = 
        `Limited workload balancing opportunities identified due to significant skill or role mismatches. ` +
        `Consider cross-training initiatives to improve future flexibility.`;
    }
  }
  
  return summary;
}

module.exports = {
  getUtilizationForecast,
  getBottlenecks,
  getWorkloadBalancing
};
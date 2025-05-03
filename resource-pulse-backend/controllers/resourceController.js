const { poolPromise, sql } = require('../db/config');

// Get all resources
exports.getAllResources = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query resources with financial info
    const result = await pool.request()
      .query(`
        SELECT 
          r.ResourceID, 
          r.Name, 
          r.Role, 
          r.Email, 
          r.Phone,
          r.HourlyRate,
          r.BillableRate,
          r.Currency,
          r.CostCenter
        FROM Resources r
        ORDER BY r.Name
      `);
    
    // For each resource, get their skills and allocations
    const resources = await Promise.all(result.recordset.map(async resource => {
      // Get skills
      const skillsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      // Get allocations - Modified to get ALL allocations with financial data
      const allocationsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT 
            a.AllocationID,
            a.ProjectID,
            p.Name AS ProjectName,
            a.StartDate,
            a.EndDate,
            a.Utilization,
            a.HourlyRate,
            a.BillableRate,
            a.TotalHours,
            a.TotalCost,
            a.BillableAmount,
            a.IsBillable,
            a.BillingType
          FROM Allocations a
          INNER JOIN Projects p ON a.ProjectID = p.ProjectID
          WHERE a.ResourceID = @resourceId
          AND a.EndDate >= GETDATE()
          ORDER BY a.EndDate ASC
        `);
      
      // Format the response
      const formattedResource = {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        email: resource.Email,
        phone: resource.Phone,
        hourlyRate: resource.HourlyRate,
        billableRate: resource.BillableRate,
        currency: resource.Currency || 'USD',
        costCenter: resource.CostCenter,
        skills: skillsResult.recordset.map(skill => skill.Name),
        // Include ALL allocations as an array with financial data
        allocations: allocationsResult.recordset.map(alloc => ({
          id: alloc.AllocationID,
          projectId: alloc.ProjectID,
          project: {
            id: alloc.ProjectID,
            name: alloc.ProjectName
          },
          startDate: alloc.StartDate,
          endDate: alloc.EndDate,
          utilization: alloc.Utilization,
          hourlyRate: alloc.HourlyRate || resource.HourlyRate,
          billableRate: alloc.BillableRate || resource.BillableRate,
          totalHours: alloc.TotalHours,
          totalCost: alloc.TotalCost,
          billableAmount: alloc.BillableAmount,
          isBillable: alloc.IsBillable !== 0,
          billingType: alloc.BillingType || 'Hourly'
        }))
      };
      
      // For backwards compatibility - include the first allocation as 'allocation'
      if (allocationsResult.recordset.length > 0) {
        const primaryAlloc = allocationsResult.recordset[0];
        formattedResource.allocation = {
          projectId: primaryAlloc.ProjectID,
          project: {
            id: primaryAlloc.ProjectID,
            name: primaryAlloc.ProjectName
          },
          startDate: primaryAlloc.StartDate,
          endDate: primaryAlloc.EndDate,
          utilization: primaryAlloc.Utilization,
          hourlyRate: primaryAlloc.HourlyRate || resource.HourlyRate,
          billableRate: primaryAlloc.BillableRate || resource.BillableRate
        };
      } else {
        formattedResource.allocation = null;
      }
      
      return formattedResource;
    }));
    
    res.json(resources);
  } catch (err) {
    console.error('Error getting resources:', err);
    res.status(500).json({
      message: 'Error retrieving resources',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get a single resource by ID
exports.getResourceById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Query resource with financial info
    const result = await pool.request()
      .input('resourceId', sql.Int, id)
      .query(`
        SELECT 
          r.ResourceID, 
          r.Name, 
          r.Role, 
          r.Email, 
          r.Phone,
          r.HourlyRate,
          r.BillableRate,
          r.Currency,
          r.CostCenter
        FROM Resources r
        WHERE r.ResourceID = @resourceId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    const resource = result.recordset[0];
    
    // Get skills
    const skillsResult = await pool.request()
      .input('resourceId', sql.Int, resource.ResourceID)
      .query(`
        SELECT s.SkillID, s.Name
        FROM Skills s
        INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
        WHERE rs.ResourceID = @resourceId
      `);
    
    // Get allocations with financial data
    const allocationsResult = await pool.request()
      .input('resourceId', sql.Int, resource.ResourceID)
      .query(`
        SELECT 
          a.AllocationID,
          a.ProjectID,
          p.Name AS ProjectName,
          a.StartDate,
          a.EndDate,
          a.Utilization,
          a.HourlyRate,
          a.BillableRate,
          a.TotalHours,
          a.TotalCost,
          a.BillableAmount,
          a.IsBillable,
          a.BillingType
        FROM Allocations a
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.ResourceID = @resourceId
        AND a.EndDate >= GETDATE()
        ORDER BY a.EndDate ASC
      `);
    
    // Try to get time entries if the table exists
    let timeEntriesResult = { recordset: [] };
    try {
      timeEntriesResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT 
            t.EntryID AS TimeEntryID,
            t.ProjectID,
            p.Name AS ProjectName,
            t.EntryDate,
            t.Hours,
            t.Description,
            t.IsBillable,
            'Approved' AS Status
          FROM TimeEntries t
          INNER JOIN Projects p ON t.ProjectID = p.ProjectID
          WHERE t.ResourceID = @resourceId
          ORDER BY t.EntryDate DESC
        `);
    } catch (err) {
      console.log('Time entries table not available or error:', err.message);
    }
    
    // Format the response
    const formattedResource = {
      id: resource.ResourceID,
      name: resource.Name,
      role: resource.Role,
      email: resource.Email,
      phone: resource.Phone,
      hourlyRate: resource.HourlyRate,
      billableRate: resource.BillableRate,
      currency: resource.Currency || 'USD',
      costCenter: resource.CostCenter,
      skills: skillsResult.recordset.map(skill => skill.Name),
      // Include ALL allocations as an array with financial data
      allocations: allocationsResult.recordset.map(alloc => ({
        id: alloc.AllocationID,
        projectId: alloc.ProjectID,
        project: {
          id: alloc.ProjectID,
          name: alloc.ProjectName
        },
        startDate: alloc.StartDate,
        endDate: alloc.EndDate,
        utilization: alloc.Utilization,
        hourlyRate: alloc.HourlyRate || resource.HourlyRate,
        billableRate: alloc.BillableRate || resource.BillableRate,
        totalHours: alloc.TotalHours,
        totalCost: alloc.TotalCost,
        billableAmount: alloc.BillableAmount,
        isBillable: alloc.IsBillable !== 0,
        billingType: alloc.BillingType || 'Hourly'
      })),
      // Add time entries
      timeEntries: timeEntriesResult.recordset.map(entry => ({
        id: entry.TimeEntryID,
        projectId: entry.ProjectID,
        projectName: entry.ProjectName,
        date: entry.EntryDate,
        hours: entry.Hours,
        description: entry.Description,
        isBillable: entry.IsBillable !== 0,
        status: entry.Status
      }))
    };
    
    // For backwards compatibility - include the first allocation as 'allocation'
    if (allocationsResult.recordset.length > 0) {
      const primaryAlloc = allocationsResult.recordset[0];
      formattedResource.allocation = {
        projectId: primaryAlloc.ProjectID,
        project: {
          id: primaryAlloc.ProjectID,
          name: primaryAlloc.ProjectName
        },
        startDate: primaryAlloc.StartDate,
        endDate: primaryAlloc.EndDate,
        utilization: primaryAlloc.Utilization,
        hourlyRate: primaryAlloc.HourlyRate || resource.HourlyRate,
        billableRate: primaryAlloc.BillableRate || resource.BillableRate
      };
    } else {
      formattedResource.allocation = null;
    }
    
    // Add financial summary
    const financialSummaryResult = await pool.request()
      .input('resourceId', sql.Int, resource.ResourceID)
      .query(`
        SELECT 
          SUM(a.TotalHours) AS TotalAllocatedHours,
          SUM(a.TotalCost) AS TotalCost,
          SUM(CASE WHEN a.IsBillable = 1 THEN a.BillableAmount ELSE 0 END) AS TotalBillableAmount,
          SUM(CASE WHEN a.IsBillable = 1 THEN a.BillableAmount ELSE 0 END) - SUM(a.TotalCost) AS TotalProfit,
          CASE 
            WHEN SUM(CASE WHEN a.IsBillable = 1 THEN a.BillableAmount ELSE 0 END) > 0 
            THEN (SUM(CASE WHEN a.IsBillable = 1 THEN a.BillableAmount ELSE 0 END) - SUM(a.TotalCost)) / SUM(CASE WHEN a.IsBillable = 1 THEN a.BillableAmount ELSE 0 END) * 100
            ELSE 0
          END AS ProfitMargin
        FROM Allocations a
        WHERE a.ResourceID = @resourceId
      `);
    
    if (financialSummaryResult.recordset.length > 0) {
      formattedResource.financialSummary = {
        totalAllocatedHours: financialSummaryResult.recordset[0].TotalAllocatedHours || 0,
        totalCost: financialSummaryResult.recordset[0].TotalCost || 0,
        totalBillableAmount: financialSummaryResult.recordset[0].TotalBillableAmount || 0,
        totalProfit: financialSummaryResult.recordset[0].TotalProfit || 0,
        profitMargin: financialSummaryResult.recordset[0].ProfitMargin || 0
      };
    }
    
    res.json(formattedResource);
  } catch (err) {
    console.error('Error getting resource:', err);
    res.status(500).json({
      message: 'Error retrieving resource',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};


// Create a new resource
exports.createResource = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { 
      name, 
      roleId, 
      email, 
      phone, 
      skills, 
      hourlyRate, 
      billableRate, 
      currency, 
      costCenter 
    } = req.body;
    
    // Validate required fields
    if (!name || !roleId) {
      return res.status(400).json({ message: 'Name and role are required' });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Insert resource with financial data
      const resourceResult = await transaction.request()
        .input('name', sql.NVarChar, name)
        .input('roleId', sql.Int, roleId)
        .input('email', sql.NVarChar, email || null)
        .input('phone', sql.NVarChar, phone || null)
        .input('hourlyRate', sql.Decimal(10, 2), hourlyRate || null)
        .input('billableRate', sql.Decimal(10, 2), billableRate || null)
        .input('currency', sql.NVarChar, currency || 'USD')
        .input('costCenter', sql.NVarChar, costCenter || null)
        .query(`
          INSERT INTO Resources (Name, RoleID, Email, Phone, HourlyRate, BillableRate, Currency, CostCenter)
          OUTPUT INSERTED.ResourceID
          VALUES (@name, @roleId, @email, @phone, @hourlyRate, @billableRate, @currency, @costCenter)
        `);
      
      const resourceId = resourceResult.recordset[0].ResourceID;
      
      // Get the role name for the Role column (for backward compatibility)
      const roleResult = await transaction.request()
        .input('roleId', sql.Int, roleId)
        .query(`
          SELECT Name
          FROM Roles
          WHERE RoleID = @roleId
        `);
      
      const roleName = roleResult.recordset[0]?.Name || '';
      
      // Update the Role text column to maintain compatibility
      await transaction.request()
        .input('resourceId', sql.Int, resourceId)
        .input('roleName', sql.NVarChar, roleName)
        .query(`
          UPDATE Resources
          SET Role = @roleName
          WHERE ResourceID = @resourceId
        `);
      
      // Process skills as before
      if (skills && skills.length > 0) {
        // Your existing skill processing code
        for (const skillName of skills) {
          // Check if skill exists
          const skillResult = await transaction.request()
            .input('skillName', sql.NVarChar, skillName)
            .query(`
              SELECT SkillID FROM Skills WHERE Name = @skillName
            `);
          
          let skillId;
          
          if (skillResult.recordset.length === 0) {
            // Create new skill
            const newSkillResult = await transaction.request()
              .input('skillName', sql.NVarChar, skillName)
              .query(`
                INSERT INTO Skills (Name)
                OUTPUT INSERTED.SkillID
                VALUES (@skillName)
              `);
            
            skillId = newSkillResult.recordset[0].SkillID;
          } else {
            skillId = skillResult.recordset[0].SkillID;
          }
          
          // Link skill to resource
          await transaction.request()
            .input('resourceId', sql.Int, resourceId)
            .input('skillId', sql.Int, skillId)
            .query(`
              INSERT INTO ResourceSkills (ResourceID, SkillID)
              VALUES (@resourceId, @skillId)
            `);
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Return the created resource with the role info and financial data
      const result = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT 
            r.ResourceID, 
            r.Name, 
            r.Role, 
            r.RoleID,
            ro.Name as RoleName,
            r.Email, 
            r.Phone,
            r.HourlyRate,
            r.BillableRate,
            r.Currency,
            r.CostCenter
          FROM Resources r
          LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
          WHERE r.ResourceID = @resourceId
        `);
      
      // Get skills
      const skillsResult = await pool.request()
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      // Format the response
      const resource = result.recordset[0];
      const formattedResource = {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        roleId: resource.RoleID,
        roleName: resource.RoleName,
        email: resource.Email,
        phone: resource.Phone,
        hourlyRate: resource.HourlyRate,
        billableRate: resource.BillableRate,
        currency: resource.Currency,
        costCenter: resource.CostCenter,
        skills: skillsResult.recordset.map(skill => skill.Name),
        allocation: null
      };
      
      res.status(201).json(formattedResource);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error creating resource:', err);
    res.status(500).json({
      message: 'Error creating resource',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Update a resource
exports.updateResource = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { 
      name, 
      roleId, 
      email, 
      phone, 
      skills, 
      hourlyRate, 
      billableRate, 
      currency, 
      costCenter 
    } = req.body;
    
    // Validate required fields
    if (!name || !roleId) {
      return res.status(400).json({ message: 'Name and role are required' });
    }
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Check if resource exists
      const checkResource = await transaction.request()
        .input('resourceId', sql.Int, id)
        .query(`
          SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
        `);
      
      if (checkResource.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      // Get the role name for the Role column (for backward compatibility)
      const roleResult = await transaction.request()
        .input('roleId', sql.Int, roleId)
        .query(`
          SELECT Name
          FROM Roles
          WHERE RoleID = @roleId
        `);
      
      const roleName = roleResult.recordset[0]?.Name || '';
      
      // Update resource with roleId, role text, and financial data
      await transaction.request()
        .input('resourceId', sql.Int, id)
        .input('name', sql.NVarChar, name)
        .input('roleId', sql.Int, roleId)
        .input('roleName', sql.NVarChar, roleName)
        .input('email', sql.NVarChar, email || null)
        .input('phone', sql.NVarChar, phone || null)
        .input('hourlyRate', sql.Decimal(10, 2), hourlyRate || null)
        .input('billableRate', sql.Decimal(10, 2), billableRate || null)
        .input('currency', sql.NVarChar, currency || 'USD')
        .input('costCenter', sql.NVarChar, costCenter || null)
        .input('updatedAt', sql.DateTime2, new Date())
        .query(`
          UPDATE Resources
          SET Name = @name,
              RoleID = @roleId,
              Role = @roleName,
              Email = @email,
              Phone = @phone,
              HourlyRate = @hourlyRate,
              BillableRate = @billableRate,
              Currency = @currency,
              CostCenter = @costCenter,
              UpdatedAt = @updatedAt
          WHERE ResourceID = @resourceId
        `);
      
      // Process skills if provided
      if (skills !== undefined) {
        // Remove all existing skills
        await transaction.request()
          .input('resourceId', sql.Int, id)
          .query(`
            DELETE FROM ResourceSkills
            WHERE ResourceID = @resourceId
          `);
        
        // Add new skills
        if (skills && skills.length > 0) {
          for (const skillName of skills) {
            // Check if skill exists
            const skillResult = await transaction.request()
              .input('skillName', sql.NVarChar, skillName)
              .query(`
                SELECT SkillID FROM Skills WHERE Name = @skillName
              `);
            
            let skillId;
            
            if (skillResult.recordset.length === 0) {
              // Create new skill
              const newSkillResult = await transaction.request()
                .input('skillName', sql.NVarChar, skillName)
                .query(`
                  INSERT INTO Skills (Name)
                  OUTPUT INSERTED.SkillID
                  VALUES (@skillName)
                `);
              
              skillId = newSkillResult.recordset[0].SkillID;
            } else {
              skillId = skillResult.recordset[0].SkillID;
            }
            
            // Link skill to resource
            await transaction.request()
              .input('resourceId', sql.Int, id)
              .input('skillId', sql.Int, skillId)
              .query(`
                INSERT INTO ResourceSkills (ResourceID, SkillID)
                VALUES (@resourceId, @skillId)
              `);
          }
        }
      }
      
      // Update allocations with new resource rates if applicable
      if (hourlyRate !== undefined || billableRate !== undefined) {
        await transaction.request()
          .input('resourceId', sql.Int, id)
          .input('hourlyRate', sql.Decimal(10, 2), hourlyRate || null)
          .input('billableRate', sql.Decimal(10, 2), billableRate || null)
          .query(`
            UPDATE Allocations
            SET 
              HourlyRate = COALESCE(HourlyRate, @hourlyRate),
              BillableRate = COALESCE(BillableRate, @billableRate),
              TotalCost = COALESCE(TotalHours, 0) * COALESCE(HourlyRate, @hourlyRate),
              BillableAmount = CASE WHEN IsBillable = 1 THEN COALESCE(TotalHours, 0) * COALESCE(BillableRate, @billableRate) ELSE 0 END
            WHERE 
              ResourceID = @resourceId
              AND (HourlyRate IS NULL OR BillableRate IS NULL)
          `);
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Return the updated resource
      const result = await pool.request()
        .input('resourceId', sql.Int, id)
        .query(`
          SELECT 
            r.ResourceID, 
            r.Name, 
            r.Role, 
            r.RoleID,
            ro.Name as RoleName,
            r.Email, 
            r.Phone,
            r.HourlyRate,
            r.BillableRate,
            r.Currency,
            r.CostCenter
          FROM Resources r
          LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
          WHERE r.ResourceID = @resourceId
        `);
      
      // Get skills
      const skillsResult = await pool.request()
        .input('resourceId', sql.Int, id)
        .query(`
          SELECT s.SkillID, s.Name
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      // Get allocation
      const allocationResult = await pool.request()
        .input('resourceId', sql.Int, id)
        .query(`
          SELECT 
            a.AllocationID,
            a.ProjectID,
            p.Name AS ProjectName,
            a.StartDate,
            a.EndDate,
            a.Utilization,
            a.HourlyRate,
            a.BillableRate,
            a.TotalHours,
            a.TotalCost,
            a.BillableAmount,
            a.IsBillable,
            a.BillingType
          FROM Allocations a
          INNER JOIN Projects p ON a.ProjectID = p.ProjectID
          WHERE a.ResourceID = @resourceId
          AND a.EndDate >= GETDATE()
          ORDER BY a.EndDate ASC
        `);
      
      // Format the response
      const resource = result.recordset[0];
      const formattedResource = {
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        roleId: resource.RoleID,
        roleName: resource.RoleName,
        email: resource.Email,
        phone: resource.Phone,
        hourlyRate: resource.HourlyRate,
        billableRate: resource.BillableRate,
        currency: resource.Currency,
        costCenter: resource.CostCenter,
        skills: skillsResult.recordset.map(skill => skill.Name),
        allocation: allocationResult.recordset.length > 0 ? {
          projectId: allocationResult.recordset[0].ProjectID,
          projectName: allocationResult.recordset[0].ProjectName,
          startDate: allocationResult.recordset[0].StartDate,
          endDate: allocationResult.recordset[0].EndDate,
          utilization: allocationResult.recordset[0].Utilization,
          hourlyRate: allocationResult.recordset[0].HourlyRate,
          billableRate: allocationResult.recordset[0].BillableRate
        } : null,
        allocations: allocationResult.recordset.map(alloc => ({
          id: alloc.AllocationID,
          projectId: alloc.ProjectID,
          projectName: alloc.ProjectName,
          startDate: alloc.StartDate,
          endDate: alloc.EndDate,
          utilization: alloc.Utilization,
          hourlyRate: alloc.HourlyRate,
          billableRate: alloc.BillableRate,
          totalHours: alloc.TotalHours,
          totalCost: alloc.TotalCost,
          billableAmount: alloc.BillableAmount,
          isBillable: alloc.IsBillable !== 0,
          billingType: alloc.BillingType || 'Hourly'
        }))
      };
      
      res.json(formattedResource);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating resource:', err);
    res.status(500).json({
      message: 'Error updating resource',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Check if resource exists
    const checkResource = await pool.request()
      .input('resourceId', sql.Int, id)
      .query(`
        SELECT ResourceID FROM Resources WHERE ResourceID = @resourceId
      `);
    
    if (checkResource.recordset.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Delete resource (cascade will handle related records)
    await pool.request()
      .input('resourceId', sql.Int, id)
      .query(`
        DELETE FROM Resources
        WHERE ResourceID = @resourceId
      `);
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('Error deleting resource:', err);
    res.status(500).json({
      message: 'Error deleting resource',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Bulk create resources
exports.bulkCreateResources = async (req, res) => {
  try {
    const { resources } = req.body;
    if (!Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({ message: 'Valid resources array is required' });
    }
    
    const pool = await poolPromise;
    const createdResources = [];
    
    for (const resource of resources) {
      // Validate required fields
      if (!resource.name || !resource.roleId) {
        continue; // Skip invalid resources
      }
      
      // Create resource using existing logic but in a loop
      // ... [similar to createResource but in a loop]
    }
    
    res.status(201).json(createdResources);
  } catch (err) {
    console.error('Error bulk creating resources:', err);
    res.status(500).json({
      message: 'Error creating resources',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};
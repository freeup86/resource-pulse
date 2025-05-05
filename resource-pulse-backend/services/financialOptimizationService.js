/**
 * Financial Optimization Service
 * Provides AI-powered optimization for resource allocation based on financial considerations
 */
const db = require('../db/config');
const { Anthropic } = require('@anthropic-ai/sdk');
const telemetry = require('./aiTelemetry');

// Initialize Claude client if API key is available
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const claude = CLAUDE_API_KEY ? new Anthropic({
  apiKey: CLAUDE_API_KEY,
}) : null;

/**
 * Generate optimized allocation suggestions based on financial considerations
 * @param {Object} options - Options for optimization
 * @param {string} [options.timeRange='3months'] - Time range ('1month', '3months', '6months', '1year')
 * @param {string} [options.optimizationGoal='profit'] - Optimization goal ('profit', 'revenue', 'cost', 'utilization')
 * @param {string} [options.startDate] - Start date in ISO format (overrides timeRange)
 * @param {string} [options.endDate] - End date in ISO format (overrides timeRange)
 * @param {string} [options.departmentId] - Department ID for filtering
 * @param {Array} [options.projectConstraints=[]] - Project constraints
 * @param {Array} [options.resourceConstraints=[]] - Resource constraints
 * @param {boolean} [options.includeAIInsights=true] - Include AI insights
 * @param {boolean} [options.forceFallback=false] - Force use of fallback data
 * @returns {Promise<Object>} - Optimization results
 */
const generateOptimizedAllocations = async (options = {}) => {
  try {
    const {
      timeRange = '3months',
      optimizationGoal = 'profit', // 'profit', 'revenue', 'cost', 'utilization'
      startDate,
      endDate,
      departmentId,
      projectConstraints = [],
      resourceConstraints = [],
      includeAIInsights = true,
      forceFallback = false
    } = options;
    
    // If custom date range is provided, use it; otherwise use timeRange
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else {
      dateRange = convertTimeRangeToDateRange(timeRange);
    }
    
    // Check for force fallback flag (from query params or environment)
    const useFallback = forceFallback || process.env.FINANCE_FORCE_FALLBACK === 'true';
    
    // Use try-catch to handle any errors in the optimization process
    try {
      // Get financial data for resources and projects using date range
      // Use fallback data if requested or if database operations fail
      const financialData = useFallback 
        ? getFinancialDataFallback(dateRange.startDate, dateRange.endDate)
        : await getFinancialData(dateRange, departmentId);
      
      // Get current allocations using date range
      const currentAllocations = useFallback
        ? getAllocationsFallback(dateRange.startDate, dateRange.endDate)
        : await getAllocations(dateRange);
      
      // Get resource and project constraints
      const constraints = useFallback
        ? getConstraintsFallback(resourceConstraints, projectConstraints)
        : await getConstraints(resourceConstraints, projectConstraints);
      
      // Calculate optimized allocations based on financial considerations
      const optimization = calculateOptimizedAllocations(
        financialData,
        currentAllocations,
        constraints,
        optimizationGoal
      );
      
      // If AI is available and enabled, enhance with AI insights
      if (claude && includeAIInsights && !useFallback) {
        try {
          const aiInsights = await generateAIInsights(
            financialData,
            currentAllocations,
            optimization,
            optimizationGoal
          );
          
          if (aiInsights) {
            optimization.aiInsights = aiInsights.insights;
            optimization.recommendations = aiInsights.recommendations;
          }
        } catch (aiError) {
          console.error('Error generating AI insights:', aiError);
          // Continue without AI insights if they fail
        }
      }
      
      const result = {
        optimizationGoal,
        dateRange: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        optimizedAllocations: optimization.optimizedAllocations,
        financialImpact: optimization.financialImpact,
        recommendations: optimization.recommendations || [],
        aiInsights: optimization.aiInsights || null,
        analyzedAt: new Date().toISOString()
      };
      
      // Add fallback indicator if using fallback data
      if (useFallback || financialData.isFallbackData) {
        result.isFallbackData = true;
        result.notice = "Using sample data for demonstration purposes.";
      }
      
      return result;
    } catch (optimizationError) {
      console.error('Error in optimization process:', optimizationError);
      
      // If any part of the process fails, fall back to sample data
      console.log('Falling back to sample data due to optimization error');
      
      // Get fallback data
      const financialData = getFinancialDataFallback(dateRange.startDate, dateRange.endDate);
      const currentAllocations = getAllocationsFallback(dateRange.startDate, dateRange.endDate);
      const constraints = getConstraintsFallback(resourceConstraints, projectConstraints);
      
      // Calculate optimized allocations using fallback data
      const optimization = calculateOptimizedAllocations(
        financialData,
        currentAllocations,
        constraints,
        optimizationGoal
      );
      
      return {
        optimizationGoal,
        dateRange: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        optimizedAllocations: optimization.optimizedAllocations,
        financialImpact: optimization.financialImpact,
        recommendations: optimization.recommendations || [],
        aiInsights: null, // No AI insights in fallback mode
        analyzedAt: new Date().toISOString(),
        isFallbackData: true,
        notice: "Using sample data for demonstration purposes due to an error."
      };
    }
  } catch (error) {
    console.error('Error generating optimized allocations:', error);
    throw new Error(`Financial optimization failed: ${error.message}`);
  }
};

/**
 * Get financial data for resources and projects
 * @param {Object|string} dateInfo - Either a time range string or an object with startDate and endDate
 * @param {string} [dateInfo.startDate] - Start date in ISO format
 * @param {string} [dateInfo.endDate] - End date in ISO format
 * @param {string} departmentId - Optional department filter
 * @returns {Promise<Object>} - Financial data
 */
const getFinancialData = async (dateInfo, departmentId) => {
  try {
    // Get date range - either from object or convert from string
    let startDate, endDate;
    
    if (typeof dateInfo === 'object' && dateInfo.startDate && dateInfo.endDate) {
      startDate = dateInfo.startDate;
      endDate = dateInfo.endDate;
    } else {
      // Legacy support for timeRange string
      const converted = convertTimeRangeToDateRange(dateInfo);
      startDate = converted.startDate;
      endDate = converted.endDate;
    }
    
    // Log date range for debugging
    console.log(`Getting financial data for date range: ${startDate} to ${endDate}`);
    
    try {
      // Get resource financial data
      const resourceQuery = `
        SELECT r.id, r.name, r.role_id, ro.name AS role_name,
               rf.billing_rate, rf.cost_rate,
               rf.overhead_percentage, rf.profit_margin
        FROM resources r
        JOIN roles ro ON r.role_id = ro.id
        LEFT JOIN resource_financials rf ON r.id = rf.resource_id
        ${departmentId ? 'WHERE r.department_id = ?' : ''}
      `;
      
      const resourceParams = departmentId ? [departmentId] : [];
      const [resourceResults] = await db.promise().query(resourceQuery, resourceParams);
      
      // Get project financial data
      const projectQuery = `
        SELECT p.id, p.name, p.client_id, c.name AS client_name,
               pf.budget, pf.actual_revenue, pf.actual_cost,
               pf.billable_percentage, pf.target_margin
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN project_financials pf ON p.id = pf.project_id
        WHERE p.end_date >= ? AND p.start_date <= ?
        ${departmentId ? 'AND p.department_id = ?' : ''}
      `;
      
      const projectParams = [startDate, endDate, ...(departmentId ? [departmentId] : [])];
      const [projectResults] = await db.promise().query(projectQuery, projectParams);
      
      // Get revenue data by resource-project combo
      const revenueQuery = `
        SELECT a.resource_id, a.project_id, 
               SUM(a.percentage * rf.billing_rate * DATEDIFF(
                 LEAST(a.end_date, ?), 
                 GREATEST(a.start_date, ?)
               ) / 100) AS revenue,
               SUM(a.percentage * rf.cost_rate * DATEDIFF(
                 LEAST(a.end_date, ?), 
                 GREATEST(a.start_date, ?)
               ) / 100) AS cost
        FROM allocations a
        JOIN resources r ON a.resource_id = r.id
        JOIN resource_financials rf ON r.id = rf.resource_id
        WHERE a.end_date >= ? AND a.start_date <= ?
        GROUP BY a.resource_id, a.project_id
      `;
      
      const revenueParams = [endDate, startDate, endDate, startDate, startDate, endDate];
      const [revenueResults] = await db.promise().query(revenueQuery, revenueParams);
      
      // Process financial data
      const resources = {};
      resourceResults.forEach(resource => {
        resources[resource.id] = {
          ...resource,
          billingRate: resource.billing_rate || 0,
          costRate: resource.cost_rate || 0,
          overheadPercentage: resource.overhead_percentage || 0,
          profitMargin: resource.profit_margin || 0,
          utilization: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      });
      
      const projects = {};
      projectResults.forEach(project => {
        projects[project.id] = {
          ...project,
          budget: project.budget || 0,
          actualRevenue: project.actual_revenue || 0,
          actualCost: project.actual_cost || 0,
          billablePercentage: project.billable_percentage || 100,
          targetMargin: project.target_margin || 0,
          resources: [],
          totalRevenue: 0,
          totalCost: 0,
          profitMargin: 0
        };
      });
      
      // Combine revenue data
      revenueResults.forEach(entry => {
        if (resources[entry.resource_id]) {
          resources[entry.resource_id].revenue += entry.revenue || 0;
          resources[entry.resource_id].cost += entry.cost || 0;
          resources[entry.resource_id].profit = resources[entry.resource_id].revenue - resources[entry.resource_id].cost;
        }
        
        if (projects[entry.project_id]) {
          projects[entry.project_id].totalRevenue += entry.revenue || 0;
          projects[entry.project_id].totalCost += entry.cost || 0;
          
          if (!projects[entry.project_id].resources.includes(entry.resource_id)) {
            projects[entry.project_id].resources.push(entry.resource_id);
          }
        }
      });
      
      // Calculate project profit margins
      Object.values(projects).forEach(project => {
        project.profitMargin = project.totalRevenue > 0 
          ? ((project.totalRevenue - project.totalCost) / project.totalRevenue) * 100 
          : 0;
      });
      
      return {
        resources: Object.values(resources),
        projects: Object.values(projects)
      };
    } catch (dbError) {
      console.error('Database error in getFinancialData:', dbError);
      console.log('Using fallback sample data for financial information');
      
      // Return fallback sample data
      return getFinancialDataFallback(startDate, endDate);
    }
  } catch (error) {
    console.error('Error getting financial data:', error);
    // Even if the main function fails, try the fallback
    try {
      const fallbackData = getFinancialDataFallback();
      return fallbackData;
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
      throw error; // If fallback also fails, throw the original error
    }
  }
};

/**
 * Fallback function that returns sample financial data when database fails
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Object} - Sample financial data
 */
const getFinancialDataFallback = (startDate = '2023-01-01', endDate = '2023-12-31') => {
  console.log(`Generating fallback financial data for ${startDate} to ${endDate}`);
  
  // Sample resources with financial data
  const resources = [
    {
      id: 1,
      name: 'John Smith',
      role_id: 1,
      role_name: 'Senior Developer',
      billingRate: 150,
      costRate: 75,
      overheadPercentage: 20,
      profitMargin: 40,
      utilization: 85,
      revenue: 127500,
      cost: 63750,
      profit: 63750
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role_id: 2,
      role_name: 'Project Manager',
      billingRate: 175,
      costRate: 90,
      overheadPercentage: 15,
      profitMargin: 35,
      utilization: 90,
      revenue: 141750,
      cost: 72900,
      profit: 68850
    },
    {
      id: 3,
      name: 'Michael Chen',
      role_id: 3,
      role_name: 'UX Designer',
      billingRate: 125,
      costRate: 60,
      overheadPercentage: 25,
      profitMargin: 30,
      utilization: 75,
      revenue: 84375,
      cost: 40500,
      profit: 43875
    },
    {
      id: 4,
      name: 'Emily Davis',
      role_id: 1,
      role_name: 'Senior Developer',
      billingRate: 155,
      costRate: 80,
      overheadPercentage: 18,
      profitMargin: 38,
      utilization: 95,
      revenue: 132825,
      cost: 68400,
      profit: 64425
    },
    {
      id: 5,
      name: 'Robert Wilson',
      role_id: 4,
      role_name: 'Business Analyst',
      billingRate: 130,
      costRate: 65,
      overheadPercentage: 22,
      profitMargin: 32,
      utilization: 80,
      revenue: 93600,
      cost: 46800,
      profit: 46800
    }
  ];
  
  // Sample projects with financial data
  const projects = [
    {
      id: 101,
      name: 'E-commerce Platform Redesign',
      client_id: 1001,
      client_name: 'TechRetail Inc.',
      budget: 250000,
      actualRevenue: 230000,
      actualCost: 138000,
      billablePercentage: 95,
      targetMargin: 40,
      resources: [1, 3, 4],
      totalRevenue: 230000,
      totalCost: 138000,
      profitMargin: 40
    },
    {
      id: 102,
      name: 'Financial Dashboard Development',
      client_id: 1002,
      client_name: 'Global Banking Corp',
      budget: 180000,
      actualRevenue: 192000,
      actualCost: 124800,
      billablePercentage: 100,
      targetMargin: 35,
      resources: [1, 2, 5],
      totalRevenue: 192000,
      totalCost: 124800,
      profitMargin: 35
    },
    {
      id: 103,
      name: 'Mobile App Development',
      client_id: 1003,
      client_name: 'HealthTracker LLC',
      budget: 120000,
      actualRevenue: 115000,
      actualCost: 80500,
      billablePercentage: 90,
      targetMargin: 30,
      resources: [3, 4],
      totalRevenue: 115000,
      totalCost: 80500,
      profitMargin: 30
    },
    {
      id: 104,
      name: 'Enterprise CRM Integration',
      client_id: 1004,
      client_name: 'Manufacturing Solutions Co.',
      budget: 300000,
      actualRevenue: 285000,
      actualCost: 156750,
      billablePercentage: 97,
      targetMargin: 45,
      resources: [1, 2, 4, 5],
      totalRevenue: 285000,
      totalCost: 156750,
      profitMargin: 45
    }
  ];
  
  return {
    resources,
    projects,
    isFallbackData: true
  };
};

/**
 * Get current allocations within the specified time range
 * @param {Object|string} dateInfo - Either a time range string or an object with startDate and endDate
 * @param {string} [dateInfo.startDate] - Start date in ISO format
 * @param {string} [dateInfo.endDate] - End date in ISO format
 * @returns {Promise<Array>} - Current allocations
 */
const getAllocations = async (dateInfo) => {
  try {
    // Get date range - either from object or convert from string
    let startDate, endDate;
    
    if (typeof dateInfo === 'object' && dateInfo.startDate && dateInfo.endDate) {
      startDate = dateInfo.startDate;
      endDate = dateInfo.endDate;
    } else {
      // Legacy support for timeRange string
      const converted = convertTimeRangeToDateRange(dateInfo);
      startDate = converted.startDate;
      endDate = converted.endDate;
    }
    
    // Log date range for debugging
    console.log(`Getting allocations for date range: ${startDate} to ${endDate}`);
    
    try {
      const query = `
        SELECT a.id, a.resource_id, a.project_id, a.percentage,
              a.start_date, a.end_date, a.notes,
              r.name AS resource_name, p.name AS project_name
        FROM allocations a
        JOIN resources r ON a.resource_id = r.id
        JOIN projects p ON a.project_id = p.id
        WHERE a.end_date >= ? AND a.start_date <= ?
      `;
      
      const [results] = await db.promise().query(query, [startDate, endDate]);
      return results;
    } catch (dbError) {
      console.error('Database error in getAllocations:', dbError);
      console.log('Using fallback sample data for allocations');
      
      // Return fallback sample allocation data
      return getAllocationsFallback(startDate, endDate);
    }
  } catch (error) {
    console.error('Error getting allocations:', error);
    // Even if the main function fails, try the fallback
    try {
      const fallbackData = getAllocationsFallback();
      return fallbackData;
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
      throw error; // If fallback also fails, throw the original error
    }
  }
};

/**
 * Fallback function that returns sample allocation data when database fails
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Array} - Sample allocation data
 */
const getAllocationsFallback = (startDate = '2023-01-01', endDate = '2023-12-31') => {
  console.log(`Generating fallback allocation data for ${startDate} to ${endDate}`);
  
  // Sample allocation data to match the resource and project IDs in getFinancialDataFallback
  return [
    {
      id: 1001,
      resource_id: 1,
      project_id: 101,
      percentage: 75,
      start_date: '2023-01-15',
      end_date: '2023-06-30',
      notes: 'Backend development',
      resource_name: 'John Smith',
      project_name: 'E-commerce Platform Redesign'
    },
    {
      id: 1002,
      resource_id: 3,
      project_id: 101,
      percentage: 60,
      start_date: '2023-01-15',
      end_date: '2023-04-15',
      notes: 'UI/UX design',
      resource_name: 'Michael Chen',
      project_name: 'E-commerce Platform Redesign'
    },
    {
      id: 1003,
      resource_id: 4,
      project_id: 101,
      percentage: 50,
      start_date: '2023-03-01',
      end_date: '2023-06-30',
      notes: 'Frontend development',
      resource_name: 'Emily Davis',
      project_name: 'E-commerce Platform Redesign'
    },
    {
      id: 1004,
      resource_id: 1,
      project_id: 102,
      percentage: 25,
      start_date: '2023-01-15',
      end_date: '2023-08-30',
      notes: 'Backend architecture',
      resource_name: 'John Smith',
      project_name: 'Financial Dashboard Development'
    },
    {
      id: 1005,
      resource_id: 2,
      project_id: 102,
      percentage: 40,
      start_date: '2023-01-01',
      end_date: '2023-08-30',
      notes: 'Project management',
      resource_name: 'Sarah Johnson',
      project_name: 'Financial Dashboard Development'
    },
    {
      id: 1006,
      resource_id: 5,
      project_id: 102,
      percentage: 90,
      start_date: '2023-02-01',
      end_date: '2023-07-15',
      notes: 'Requirements gathering and analysis',
      resource_name: 'Robert Wilson',
      project_name: 'Financial Dashboard Development'
    },
    {
      id: 1007,
      resource_id: 3,
      project_id: 103,
      percentage: 40,
      start_date: '2023-04-20',
      end_date: '2023-09-30',
      notes: 'Mobile UI design',
      resource_name: 'Michael Chen',
      project_name: 'Mobile App Development'
    },
    {
      id: 1008,
      resource_id: 4,
      project_id: 103,
      percentage: 50,
      start_date: '2023-05-01',
      end_date: '2023-09-30',
      notes: 'Mobile development',
      resource_name: 'Emily Davis',
      project_name: 'Mobile App Development'
    },
    {
      id: 1009,
      resource_id: 1,
      project_id: 104,
      percentage: 25,
      start_date: '2023-06-01',
      end_date: '2023-12-31',
      notes: 'Integration architecture',
      resource_name: 'John Smith',
      project_name: 'Enterprise CRM Integration'
    },
    {
      id: 1010,
      resource_id: 2,
      project_id: 104,
      percentage: 60,
      start_date: '2023-06-01',
      end_date: '2023-12-31',
      notes: 'Project management',
      resource_name: 'Sarah Johnson',
      project_name: 'Enterprise CRM Integration'
    },
    {
      id: 1011,
      resource_id: 4,
      project_id: 104,
      percentage: 25,
      start_date: '2023-07-15',
      end_date: '2023-11-30',
      notes: 'API development',
      resource_name: 'Emily Davis',
      project_name: 'Enterprise CRM Integration'
    },
    {
      id: 1012,
      resource_id: 5,
      project_id: 104,
      percentage: 30,
      start_date: '2023-06-01',
      end_date: '2023-09-30',
      notes: 'Business process analysis',
      resource_name: 'Robert Wilson',
      project_name: 'Enterprise CRM Integration'
    }
  ];
};

/**
 * Get constraints for resources and projects
 * @param {Array} resourceConstraints - Resource constraint IDs
 * @param {Array} projectConstraints - Project constraint IDs
 * @returns {Promise<Object>} - Constraints for optimization
 */
const getConstraints = async (resourceConstraints, projectConstraints) => {
  try {
    const constraints = {
      resources: {},
      projects: {}
    };
    
    try {
      // Get resource constraints
      if (resourceConstraints && resourceConstraints.length > 0) {
        const resourceQuery = `
          SELECT id, min_utilization, max_utilization, availability_start, availability_end
          FROM resource_constraints
          WHERE resource_id IN (?)
        `;
        
        const [resourceResults] = await db.promise().query(resourceQuery, [resourceConstraints]);
        
        resourceResults.forEach(constraint => {
          constraints.resources[constraint.resource_id] = {
            minUtilization: constraint.min_utilization || 0,
            maxUtilization: constraint.max_utilization || 100,
            availabilityStart: constraint.availability_start,
            availabilityEnd: constraint.availability_end
          };
        });
      }
      
      // Get project constraints
      if (projectConstraints && projectConstraints.length > 0) {
        const projectQuery = `
          SELECT id, min_resources, max_resources, required_skills, max_budget
          FROM project_constraints
          WHERE project_id IN (?)
        `;
        
        const [projectResults] = await db.promise().query(projectQuery, [projectConstraints]);
        
        projectResults.forEach(constraint => {
          constraints.projects[constraint.project_id] = {
            minResources: constraint.min_resources || 1,
            maxResources: constraint.max_resources,
            requiredSkills: constraint.required_skills ? JSON.parse(constraint.required_skills) : [],
            maxBudget: constraint.max_budget
          };
        });
      }
      
      return constraints;
    } catch (dbError) {
      console.error('Database error in getConstraints:', dbError);
      console.log('Using fallback sample data for constraints');
      
      // Return fallback sample constraints data
      return getConstraintsFallback(resourceConstraints, projectConstraints);
    }
  } catch (error) {
    console.error('Error getting constraints:', error);
    // Even if the main function fails, try the fallback
    try {
      const fallbackData = getConstraintsFallback(resourceConstraints, projectConstraints);
      return fallbackData;
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
      throw error; // If fallback also fails, throw the original error
    }
  }
};

/**
 * Fallback function that returns sample constraints data when database fails
 * @param {Array} resourceConstraints - Resource constraint IDs
 * @param {Array} projectConstraints - Project constraint IDs
 * @returns {Object} - Sample constraints data
 */
const getConstraintsFallback = (resourceConstraints = [], projectConstraints = []) => {
  console.log(`Generating fallback constraints for resources: ${resourceConstraints} and projects: ${projectConstraints}`);
  
  // Default sample constraints
  const sampleConstraints = {
    resources: {
      1: { minUtilization: 60, maxUtilization: 95, availabilityStart: '2023-01-01', availabilityEnd: '2023-12-31' },
      2: { minUtilization: 70, maxUtilization: 90, availabilityStart: '2023-01-01', availabilityEnd: '2023-12-31' },
      3: { minUtilization: 50, maxUtilization: 85, availabilityStart: '2023-01-01', availabilityEnd: '2023-12-31' },
      4: { minUtilization: 65, maxUtilization: 100, availabilityStart: '2023-01-01', availabilityEnd: '2023-12-31' },
      5: { minUtilization: 60, maxUtilization: 90, availabilityStart: '2023-01-01', availabilityEnd: '2023-12-31' }
    },
    projects: {
      101: { minResources: 2, maxResources: 5, requiredSkills: ['frontend', 'backend', 'design'], maxBudget: 250000 },
      102: { minResources: 2, maxResources: 4, requiredSkills: ['backend', 'data', 'finance'], maxBudget: 200000 },
      103: { minResources: 1, maxResources: 3, requiredSkills: ['mobile', 'design'], maxBudget: 150000 },
      104: { minResources: 3, maxResources: 6, requiredSkills: ['backend', 'integration', 'data'], maxBudget: 300000 }
    }
  };
  
  // If specific constraints were requested, filter the sample data
  const filteredConstraints = {
    resources: {},
    projects: {}
  };
  
  if (resourceConstraints.length > 0) {
    resourceConstraints.forEach(id => {
      // Convert to number if needed
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (sampleConstraints.resources[numId]) {
        filteredConstraints.resources[numId] = sampleConstraints.resources[numId];
      }
    });
  } else {
    // If no specific constraints were requested, include all sample constraints
    filteredConstraints.resources = sampleConstraints.resources;
  }
  
  if (projectConstraints.length > 0) {
    projectConstraints.forEach(id => {
      // Convert to number if needed
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (sampleConstraints.projects[numId]) {
        filteredConstraints.projects[numId] = sampleConstraints.projects[numId];
      }
    });
  } else {
    // If no specific constraints were requested, include all sample constraints
    filteredConstraints.projects = sampleConstraints.projects;
  }
  
  return filteredConstraints;
};

/**
 * Calculate optimized allocations based on financial data
 * @param {Object} financialData - Financial data for resources and projects
 * @param {Array} currentAllocations - Current resource allocations
 * @param {Object} constraints - Resource and project constraints
 * @param {string} optimizationGoal - Goal for optimization
 * @returns {Object} - Optimized allocations and financial impact
 */
const calculateOptimizedAllocations = (financialData, currentAllocations, constraints, optimizationGoal) => {
  // This is a simplified optimization algorithm
  // In a real-world scenario, this would use linear programming or similar techniques
  
  const { resources, projects } = financialData;
  
  // Current financial metrics
  const currentFinancials = {
    totalRevenue: sumBy(resources, 'revenue'),
    totalCost: sumBy(resources, 'cost'),
    totalProfit: sumBy(resources, 'profit'),
    averageUtilization: calculateAverageUtilization(currentAllocations, resources)
  };
  
  // Create a copy of current allocations to modify
  const optimizedAllocations = [...currentAllocations];
  
  // Calculate resource utilization
  const resourceUtilization = calculateResourceUtilization(currentAllocations);
  
  // Calculate project profitability
  const projectProfitability = calculateProjectProfitability(projects);
  
  // Sort resources and projects based on optimization goal
  let sortedResources = [...resources];
  let sortedProjects = [...projects];
  
  switch (optimizationGoal) {
    case 'profit':
      // For profit optimization, prioritize high margin resources and projects
      sortedResources.sort((a, b) => (b.billingRate - b.costRate) - (a.billingRate - a.costRate));
      sortedProjects.sort((a, b) => b.profitMargin - a.profitMargin);
      break;
      
    case 'revenue':
      // For revenue optimization, prioritize high billing rate resources
      sortedResources.sort((a, b) => b.billingRate - a.billingRate);
      sortedProjects.sort((a, b) => b.totalRevenue - a.totalRevenue);
      break;
      
    case 'cost':
      // For cost optimization, prioritize low cost rate resources
      sortedResources.sort((a, b) => a.costRate - b.costRate);
      sortedProjects.sort((a, b) => a.totalCost - b.totalCost);
      break;
      
    case 'utilization':
      // For utilization optimization, prioritize underutilized resources
      sortedResources.sort((a, b) => {
        const aUtil = resourceUtilization[a.id]?.utilization || 0;
        const bUtil = resourceUtilization[b.id]?.utilization || 0;
        return aUtil - bUtil;
      });
      break;
  }
  
  // Apply optimization strategies
  const optimizationStrategies = {
    // Reallocate underutilized high-margin resources to high-margin projects
    reallocateForProfit: () => {
      const highMarginResources = sortedResources.filter(r => 
        (r.billingRate - r.costRate) > 0 && 
        (resourceUtilization[r.id]?.utilization || 0) < 80
      );
      
      const highMarginProjects = sortedProjects.filter(p => p.profitMargin > 20);
      
      // For each high margin resource with capacity
      highMarginResources.forEach(resource => {
        const currentUtil = resourceUtilization[resource.id]?.utilization || 0;
        const availableCapacity = 100 - currentUtil;
        
        if (availableCapacity >= 10) { // At least 10% capacity available
          // Find a suitable high margin project
          for (const project of highMarginProjects) {
            // Check if resource is already allocated to this project
            const existingAllocation = optimizedAllocations.find(a => 
              a.resource_id === resource.id && a.project_id === project.id
            );
            
            if (existingAllocation) {
              // Increase existing allocation if possible
              const newPercentage = Math.min(existingAllocation.percentage + availableCapacity, 100);
              existingAllocation.percentage = newPercentage;
              break;
            } else {
              // Create new allocation
              const allocationId = `new-${optimizedAllocations.length + 1}`;
              optimizedAllocations.push({
                id: allocationId,
                resource_id: resource.id,
                project_id: project.id,
                percentage: Math.min(availableCapacity, 50), // Start with 50% max
                resource_name: resource.name,
                project_name: project.name,
                start_date: new Date().toISOString().split('T')[0],
                end_date: addMonths(new Date(), 3).toISOString().split('T')[0],
                notes: 'Suggested by financial optimization'
              });
              break;
            }
          }
        }
      });
    },
    
    // Reduce allocations on low-margin projects
    reduceForProfit: () => {
      const lowMarginProjects = sortedProjects
        .filter(p => p.profitMargin < 10 && p.profitMargin >= 0)
        .reverse(); // Start with the lowest margin
      
      lowMarginProjects.forEach(project => {
        // Find allocations for this project
        const projectAllocations = optimizedAllocations.filter(a => a.project_id === project.id);
        
        // Sort by resource cost (highest first)
        projectAllocations.sort((a, b) => {
          const resourceA = resources.find(r => r.id === a.resource_id);
          const resourceB = resources.find(r => r.id === b.resource_id);
          return (resourceB?.costRate || 0) - (resourceA?.costRate || 0);
        });
        
        // Reduce allocation for highest cost resources
        for (const allocation of projectAllocations) {
          if (allocation.percentage > 25) { // Don't reduce below 25%
            allocation.percentage = Math.max(25, allocation.percentage - 25);
            allocation.notes = (allocation.notes || '') + ' (Reduced by financial optimization)';
            break; // Only reduce one allocation per low-margin project
          }
        }
      });
    },
    
    // Balance utilization across resources
    balanceUtilization: () => {
      const overutilizedResources = sortedResources.filter(r => 
        (resourceUtilization[r.id]?.utilization || 0) > 90
      );
      
      const underutilizedResources = sortedResources.filter(r => 
        (resourceUtilization[r.id]?.utilization || 0) < 50
      );
      
      // For each overutilized resource
      overutilizedResources.forEach(resource => {
        // Find allocations for this resource
        const resourceAllocations = optimizedAllocations.filter(a => a.resource_id === resource.id);
        
        // Sort by project profitability (lowest first)
        resourceAllocations.sort((a, b) => {
          const projectA = projects.find(p => p.id === a.project_id);
          const projectB = projects.find(p => p.id === b.project_id);
          return (projectA?.profitMargin || 0) - (projectB?.profitMargin || 0);
        });
        
        // Reduce allocation for lowest profitability projects
        for (const allocation of resourceAllocations) {
          if (allocation.percentage > 20) { // Don't reduce below 20%
            const reductionAmount = Math.min(allocation.percentage - 20, 20); // Reduce by 20% max
            allocation.percentage -= reductionAmount;
            allocation.notes = (allocation.notes || '') + ' (Reduced for utilization balancing)';
            
            // Find an underutilized resource with similar role
            const similarResource = underutilizedResources.find(r => r.role_id === resource.role_id);
            
            if (similarResource) {
              // Check if underutilized resource is already on this project
              const existingAllocation = optimizedAllocations.find(a => 
                a.resource_id === similarResource.id && a.project_id === allocation.project_id
              );
              
              if (existingAllocation) {
                // Increase existing allocation
                existingAllocation.percentage += reductionAmount;
                existingAllocation.notes = (existingAllocation.notes || '') + ' (Increased for utilization balancing)';
              } else {
                // Create new allocation for the underutilized resource
                const allocationId = `new-${optimizedAllocations.length + 1}`;
                optimizedAllocations.push({
                  id: allocationId,
                  resource_id: similarResource.id,
                  project_id: allocation.project_id,
                  percentage: reductionAmount,
                  resource_name: similarResource.name,
                  project_name: projects.find(p => p.id === allocation.project_id)?.name || 'Unknown Project',
                  start_date: allocation.start_date,
                  end_date: allocation.end_date,
                  notes: 'Added for utilization balancing'
                });
              }
              
              // Remove from underutilized list
              underutilizedResources.splice(underutilizedResources.indexOf(similarResource), 1);
            }
            
            break; // Only reduce one allocation per overutilized resource
          }
        }
      });
    }
  };
  
  // Apply different strategies based on optimization goal
  switch (optimizationGoal) {
    case 'profit':
      optimizationStrategies.reallocateForProfit();
      optimizationStrategies.reduceForProfit();
      break;
      
    case 'revenue':
      optimizationStrategies.reallocateForProfit();
      break;
      
    case 'cost':
      optimizationStrategies.reduceForProfit();
      break;
      
    case 'utilization':
      optimizationStrategies.balanceUtilization();
      break;
  }
  
  // Recalculate financial impact
  const optimizedUtilization = calculateResourceUtilization(optimizedAllocations);
  
  // Calculate the financial impact of the changes
  const optimizedFinancials = calculateFinancialImpact(
    resources,
    projects,
    optimizedAllocations,
    optimizedUtilization
  );
  
  // Calculate the difference
  const financialImpact = {
    revenueChange: optimizedFinancials.totalRevenue - currentFinancials.totalRevenue,
    costChange: optimizedFinancials.totalCost - currentFinancials.totalCost,
    profitChange: optimizedFinancials.totalProfit - currentFinancials.totalProfit,
    utilizationChange: optimizedFinancials.averageUtilization - currentFinancials.averageUtilization,
    current: currentFinancials,
    optimized: optimizedFinancials
  };
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    financialImpact,
    optimizedAllocations,
    currentAllocations,
    resources,
    projects,
    optimizationGoal
  );
  
  return {
    optimizedAllocations,
    financialImpact,
    recommendations
  };
};

/**
 * Calculate average utilization from allocations
 * @param {Array} allocations - Resource allocations
 * @param {Array} resources - Resources data
 * @returns {number} - Average utilization percentage
 */
const calculateAverageUtilization = (allocations, resources) => {
  const utilization = calculateResourceUtilization(allocations);
  
  let totalUtilization = 0;
  let resourceCount = 0;
  
  resources.forEach(resource => {
    if (utilization[resource.id]) {
      totalUtilization += utilization[resource.id].utilization;
      resourceCount++;
    }
  });
  
  return resourceCount > 0 ? totalUtilization / resourceCount : 0;
};

/**
 * Calculate utilization for each resource
 * @param {Array} allocations - Resource allocations
 * @returns {Object} - Utilization by resource ID
 */
const calculateResourceUtilization = (allocations) => {
  const utilization = {};
  
  // Group allocations by resource
  allocations.forEach(allocation => {
    const resourceId = allocation.resource_id;
    
    if (!utilization[resourceId]) {
      utilization[resourceId] = {
        totalPercentage: 0,
        allocations: []
      };
    }
    
    utilization[resourceId].allocations.push(allocation);
    utilization[resourceId].totalPercentage += allocation.percentage;
  });
  
  // Calculate utilization percentage
  Object.keys(utilization).forEach(resourceId => {
    utilization[resourceId].utilization = utilization[resourceId].totalPercentage;
  });
  
  return utilization;
};

/**
 * Calculate profitability metrics for each project
 * @param {Array} projects - Projects data
 * @returns {Object} - Profitability by project ID
 */
const calculateProjectProfitability = (projects) => {
  const profitability = {};
  
  projects.forEach(project => {
    profitability[project.id] = {
      revenue: project.totalRevenue,
      cost: project.totalCost,
      profit: project.totalRevenue - project.totalCost,
      margin: project.profitMargin
    };
  });
  
  return profitability;
};

/**
 * Calculate financial impact of optimized allocations
 * @param {Array} resources - Resources data
 * @param {Array} projects - Projects data
 * @param {Array} optimizedAllocations - Optimized allocations
 * @param {Object} utilization - Resource utilization
 * @returns {Object} - Financial impact metrics
 */
const calculateFinancialImpact = (resources, projects, optimizedAllocations, utilization) => {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalUtilization = 0;
  let resourceCount = 0;
  
  // Calculate revenue and cost for each allocation
  optimizedAllocations.forEach(allocation => {
    const resource = resources.find(r => r.id === allocation.resource_id);
    
    if (resource) {
      // Simple estimation for revenue and cost
      const revenuePerPoint = resource.billingRate / 100;
      const costPerPoint = resource.costRate / 100;
      
      const allocationRevenue = allocation.percentage * revenuePerPoint;
      const allocationCost = allocation.percentage * costPerPoint;
      
      totalRevenue += allocationRevenue;
      totalCost += allocationCost;
    }
  });
  
  // Calculate profit
  totalProfit = totalRevenue - totalCost;
  
  // Calculate average utilization
  Object.values(utilization).forEach(resourceUtil => {
    totalUtilization += resourceUtil.utilization;
    resourceCount++;
  });
  
  const averageUtilization = resourceCount > 0 ? totalUtilization / resourceCount : 0;
  
  return {
    totalRevenue,
    totalCost,
    totalProfit,
    averageUtilization
  };
};

/**
 * Generate recommendations based on optimized allocations
 * @param {Object} financialImpact - Financial impact metrics
 * @param {Array} optimizedAllocations - Optimized allocations
 * @param {Array} currentAllocations - Current allocations
 * @param {Array} resources - Resources data
 * @param {Array} projects - Projects data
 * @param {string} optimizationGoal - Goal for optimization
 * @returns {Array} - List of recommendations
 */
const generateRecommendations = (
  financialImpact,
  optimizedAllocations,
  currentAllocations,
  resources,
  projects,
  optimizationGoal
) => {
  const recommendations = [];
  
  // Identify changed allocations
  const changedAllocations = [];
  const newAllocations = [];
  
  optimizedAllocations.forEach(optimized => {
    // Check if this is a new allocation
    if (optimized.id.toString().startsWith('new-')) {
      newAllocations.push(optimized);
      return;
    }
    
    // Find matching current allocation
    const current = currentAllocations.find(a => a.id === optimized.id);
    
    if (current && current.percentage !== optimized.percentage) {
      changedAllocations.push({
        allocation: optimized,
        previousPercentage: current.percentage,
        newPercentage: optimized.percentage,
        change: optimized.percentage - current.percentage
      });
    }
  });
  
  // Add recommendations based on optimization goal
  switch (optimizationGoal) {
    case 'profit':
      if (financialImpact.profitChange > 0) {
        recommendations.push({
          type: 'profit',
          priority: 'high',
          description: `Implement suggested allocation changes to increase profit by ${formatCurrency(financialImpact.profitChange)}.`,
          details: `The optimized allocations would increase revenue by ${formatCurrency(financialImpact.revenueChange)} and ${
            financialImpact.costChange < 0 ? 'decrease' : 'increase'
          } costs by ${formatCurrency(Math.abs(financialImpact.costChange))}.`
        });
      }
      
      // Add specific recommendations for significant changes
      changedAllocations
        .filter(change => Math.abs(change.change) >= 20)
        .forEach(change => {
          const resource = resources.find(r => r.id === change.allocation.resource_id);
          const project = projects.find(p => p.id === change.allocation.project_id);
          
          if (resource && project) {
            const profitImpact = (change.change / 100) * (resource.billingRate - resource.costRate);
            
            recommendations.push({
              type: 'allocation',
              priority: profitImpact > 1000 ? 'high' : 'medium',
              description: `${change.change > 0 ? 'Increase' : 'Decrease'} ${resource.name}'s allocation on ${project.name} from ${change.previousPercentage}% to ${change.newPercentage}%.`,
              details: `This change is estimated to ${profitImpact > 0 ? 'increase' : 'decrease'} profit by ${formatCurrency(Math.abs(profitImpact))}.`,
              resourceId: resource.id,
              projectId: project.id
            });
          }
        });
      
      // Add recommendations for new allocations
      newAllocations.forEach(allocation => {
        const resource = resources.find(r => r.id === allocation.resource_id);
        const project = projects.find(p => p.id === allocation.project_id);
        
        if (resource && project) {
          const profitImpact = (allocation.percentage / 100) * (resource.billingRate - resource.costRate);
          
          recommendations.push({
            type: 'new_allocation',
            priority: profitImpact > 1000 ? 'high' : 'medium',
            description: `Allocate ${resource.name} to ${project.name} at ${allocation.percentage}%.`,
            details: `This new allocation is estimated to increase profit by ${formatCurrency(profitImpact)}.`,
            resourceId: resource.id,
            projectId: project.id
          });
        }
      });
      break;
      
    case 'revenue':
      if (financialImpact.revenueChange > 0) {
        recommendations.push({
          type: 'revenue',
          priority: 'high',
          description: `Implement suggested allocation changes to increase revenue by ${formatCurrency(financialImpact.revenueChange)}.`,
          details: `The optimized allocations focus on maximizing billable hours for high-rate resources.`
        });
      }
      break;
      
    case 'cost':
      if (financialImpact.costChange < 0) {
        recommendations.push({
          type: 'cost',
          priority: 'high',
          description: `Implement suggested allocation changes to reduce costs by ${formatCurrency(Math.abs(financialImpact.costChange))}.`,
          details: `The optimized allocations reduce usage of high-cost resources on low-margin projects.`
        });
      }
      break;
      
    case 'utilization':
      if (financialImpact.utilizationChange !== 0) {
        recommendations.push({
          type: 'utilization',
          priority: 'medium',
          description: `Implement suggested allocation changes to ${
            financialImpact.utilizationChange > 0 ? 'increase' : 'balance'
          } overall utilization by ${Math.abs(financialImpact.utilizationChange).toFixed(1)}%.`,
          details: `The optimized allocations better distribute work across the team, reducing overallocation and increasing utilization of bench resources.`
        });
      }
      break;
  }
  
  // Add general recommendations based on financial data
  const lowUtilResources = resources.filter(r => {
    const util = calculateResourceUtilization(currentAllocations)[r.id];
    return (!util || util.utilization < 50) && r.billingRate > 0;
  });
  
  if (lowUtilResources.length > 0) {
    recommendations.push({
      type: 'utilization',
      priority: 'medium',
      description: `Focus on finding billable work for ${lowUtilResources.length} underutilized resources.`,
      details: `${lowUtilResources.map(r => r.name).join(', ')} currently have less than 50% utilization.`,
      resourceIds: lowUtilResources.map(r => r.id)
    });
  }
  
  const lowMarginProjects = projects.filter(p => p.profitMargin < 15 && p.profitMargin >= 0);
  
  if (lowMarginProjects.length > 0) {
    recommendations.push({
      type: 'margin',
      priority: 'high',
      description: `Review staffing on ${lowMarginProjects.length} low-margin projects.`,
      details: `${lowMarginProjects.map(p => p.name).join(', ')} currently have profit margins below 15%.`,
      projectIds: lowMarginProjects.map(p => p.id)
    });
  }
  
  return recommendations;
};

/**
 * Generate AI insights for financial optimization
 * @param {Object} financialData - Financial data for resources and projects
 * @param {Array} currentAllocations - Current resource allocations
 * @param {Object} optimization - Optimization results
 * @param {string} optimizationGoal - Goal for optimization
 * @returns {Promise<Object>} - AI insights and recommendations
 */
const generateAIInsights = async (financialData, currentAllocations, optimization, optimizationGoal) => {
  if (!claude) {
    return null;
  }
  
  try {
    // Record API call in telemetry
    telemetry.recordRequest('claude_financial_optimization');
    
    // Prepare data for Claude
    const { resources, projects } = financialData;
    const { optimizedAllocations, financialImpact } = optimization;
    
    // Find changed and new allocations
    const changedAllocations = [];
    const newAllocations = [];
    
    optimizedAllocations.forEach(optimized => {
      if (optimized.id.toString().startsWith('new-')) {
        newAllocations.push(optimized);
        return;
      }
      
      const current = currentAllocations.find(a => a.id === optimized.id);
      
      if (current && current.percentage !== optimized.percentage) {
        changedAllocations.push({
          allocation: optimized,
          previousPercentage: current.percentage,
          newPercentage: optimized.percentage,
          change: optimized.percentage - current.percentage
        });
      }
    });
    
    // Prepare the prompt for Claude
    const prompt = `<instructions>
You are a financial optimization specialist for a professional services organization. Analyze the following financial data and allocation changes to provide insights and recommendations.
</instructions>

<financial_summary>
Optimization Goal: ${optimizationGoal}
Current Revenue: ${formatCurrency(financialImpact.current.totalRevenue)}
Current Cost: ${formatCurrency(financialImpact.current.totalCost)}
Current Profit: ${formatCurrency(financialImpact.current.totalProfit)}
Current Average Utilization: ${financialImpact.current.averageUtilization.toFixed(1)}%

Optimized Revenue: ${formatCurrency(financialImpact.optimized.totalRevenue)}
Optimized Cost: ${formatCurrency(financialImpact.optimized.totalCost)}
Optimized Profit: ${formatCurrency(financialImpact.optimized.totalProfit)}
Optimized Average Utilization: ${financialImpact.optimized.averageUtilization.toFixed(1)}%

Revenue Change: ${formatCurrency(financialImpact.revenueChange)} (${financialImpact.revenueChange > 0 ? '+' : ''}${((financialImpact.revenueChange / financialImpact.current.totalRevenue) * 100).toFixed(1)}%)
Cost Change: ${formatCurrency(financialImpact.costChange)} (${financialImpact.costChange > 0 ? '+' : ''}${((financialImpact.costChange / financialImpact.current.totalCost) * 100).toFixed(1)}%)
Profit Change: ${formatCurrency(financialImpact.profitChange)} (${financialImpact.profitChange > 0 ? '+' : ''}${financialImpact.current.totalProfit > 0 ? ((financialImpact.profitChange / financialImpact.current.totalProfit) * 100).toFixed(1) : 'N/A'}%)
Utilization Change: ${financialImpact.utilizationChange > 0 ? '+' : ''}${financialImpact.utilizationChange.toFixed(1)}%
</financial_summary>

<allocation_changes>
${changedAllocations.length > 0 
  ? `Modified Allocations (${changedAllocations.length}):
${changedAllocations.map(change => 
  `- ${change.allocation.resource_name} on ${change.allocation.project_name}: ${change.previousPercentage}% → ${change.newPercentage}% (${change.change > 0 ? '+' : ''}${change.change}%)`
).join('\n')}`
  : 'No allocation modifications.'
}

${newAllocations.length > 0 
  ? `New Allocations (${newAllocations.length}):
${newAllocations.map(allocation => 
  `- ${allocation.resource_name} on ${allocation.project_name}: ${allocation.percentage}%`
).join('\n')}`
  : 'No new allocations.'
}
</allocation_changes>

Based on this data, please provide:
1. 3-5 specific financial insights about the current state and the impact of the proposed optimization
2. 3-5 actionable recommendations to improve financial performance through resource allocation
3. Any risks or considerations that should be evaluated before implementing these changes

Your response should focus on practical, business-oriented advice that would be valuable to finance and resource management leaders.`;

    // Call Claude API
    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: "You are a financial optimization specialist for a professional services organization, providing concise, actionable insights and recommendations."
    });
    
    // Record successful API response
    telemetry.recordSuccess(response);
    
    // Parse insights and recommendations
    const aiContent = response.content[0].text;
    const insights = [];
    const recommendations = [];
    
    // Extract insights
    const insightsMatch = aiContent.match(/insights[:\s\n]+([\s\S]+?)(?=recommendations|actionable recommendations|$)/i);
    if (insightsMatch && insightsMatch[1]) {
      const insightText = insightsMatch[1].trim();
      insightText.split(/\d+\.|\n\s*-/).filter(Boolean).forEach(insight => {
        const trimmed = insight.trim();
        if (trimmed) {
          insights.push(trimmed);
        }
      });
    }
    
    // Extract recommendations
    const recommendationsMatch = aiContent.match(/recommendations[:\s\n]+([\s\S]+?)(?=risks|considerations|$)/i);
    if (recommendationsMatch && recommendationsMatch[1]) {
      const recText = recommendationsMatch[1].trim();
      recText.split(/\d+\.|\n\s*-/).filter(Boolean).forEach((rec, index) => {
        const trimmed = rec.trim();
        if (trimmed) {
          recommendations.push({
            type: 'ai',
            priority: index < 2 ? 'high' : 'medium',
            description: trimmed,
            details: ''
          });
        }
      });
    }
    
    return {
      insights,
      recommendations
    };
  } catch (error) {
    console.error('Error generating AI insights for financial optimization:', error);
    telemetry.recordError(error);
    return null;
  }
};

/**
 * Get optimization scenarios for comparison
 * @param {Object} options - Options for scenario generation
 * @param {string} [options.timeRange='3months'] - Time range ('1month', '3months', '6months', '1year')
 * @param {string} [options.startDate] - Start date in ISO format (overrides timeRange)
 * @param {string} [options.endDate] - End date in ISO format (overrides timeRange)
 * @param {string} [options.departmentId] - Department ID for filtering
 * @param {Array} [options.projectConstraints=[]] - Project constraints
 * @param {Array} [options.resourceConstraints=[]] - Resource constraints
 * @returns {Promise<Object>} - Optimization scenarios
 */
const getOptimizationScenarios = async (options = {}) => {
  try {
    // Define date range processing
    let dateRange;
    if (options.startDate && options.endDate) {
      dateRange = {
        startDate: options.startDate,
        endDate: options.endDate
      };
      console.log(`Using custom date range for scenarios: ${options.startDate} to ${options.endDate}`);
    } else {
      dateRange = convertTimeRangeToDateRange(options.timeRange || '3months');
      console.log(`Using time range for scenarios: ${options.timeRange || '3months'}`);
    }
    
    const scenarios = [];
    
    // Generate scenarios for different optimization goals
    const goals = ['profit', 'revenue', 'cost', 'utilization'];
    
    // Enhanced structure to include date range
    const enhancedOptions = {
      ...options,
      // If options has startDate/endDate, they'll be used in generateOptimizedAllocations
    };
    
    for (const goal of goals) {
      const scenarioOptions = {
        ...enhancedOptions,
        optimizationGoal: goal,
        includeAIInsights: false // Skip AI for bulk scenarios
      };
      
      const scenario = await generateOptimizedAllocations(scenarioOptions);
      
      scenarios.push({
        goal,
        dateRange: scenario.dateRange,
        financialImpact: scenario.financialImpact,
        recommendations: scenario.recommendations.slice(0, 3) // Just top 3 recommendations
      });
    }
    
    return {
      scenarios,
      dateRange, // Include date range in response for client reference
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating optimization scenarios:', error);
    throw new Error(`Failed to generate optimization scenarios: ${error.message}`);
  }
};

/**
 * Format currency values for display
 * @param {number} value - Value to format
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Sum values from an array of objects by property
 * @param {Array} arr - Array of objects
 * @param {string} prop - Property to sum
 * @returns {number} - Sum of property values
 */
const sumBy = (arr, prop) => {
  return arr.reduce((sum, item) => sum + (item[prop] || 0), 0);
};

/**
 * Add months to a date
 * @param {Date} date - Date to add months to
 * @param {number} months - Number of months to add
 * @returns {Date} - New date
 */
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Convert time range string to start and end dates
 * @param {string} timeRange - Time range string
 * @returns {Object} - Start and end dates
 */
const convertTimeRangeToDateRange = (timeRange) => {
  const now = new Date();
  let startDate, endDate;
  
  switch (timeRange) {
    case '1month':
      startDate = new Date(now);
      startDate.setDate(1);
      endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 1);
      endDate.setDate(0);
      break;
      
    case '3months':
      startDate = new Date(now);
      startDate.setDate(1);
      endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 3);
      endDate.setDate(0);
      break;
      
    case '6months':
      startDate = new Date(now);
      startDate.setDate(1);
      endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 6);
      endDate.setDate(0);
      break;
      
    case '1year':
      startDate = new Date(now);
      startDate.setDate(1);
      endDate = new Date(now);
      endDate.setFullYear(now.getFullYear() + 1);
      endDate.setDate(0);
      break;
      
    default:
      startDate = new Date(now);
      startDate.setDate(1);
      endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 3);
      endDate.setDate(0);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

module.exports = {
  generateOptimizedAllocations,
  getOptimizationScenarios
};
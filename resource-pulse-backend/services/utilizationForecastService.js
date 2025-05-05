// utilizationForecastService.js
const { poolPromise, sql } = require('../db/config');
const Anthropic = require('@anthropic-ai/sdk');
const aiTelemetry = require('./aiTelemetry');
require('dotenv').config();

// Get API key from environment variables
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Initialize Claude client
const claude = CLAUDE_API_KEY ? new Anthropic({
  apiKey: CLAUDE_API_KEY,
}) : null;

/**
 * Generate utilization forecast for the organization
 * @param {Object} options - Options for forecast
 * @param {Date} options.startDate - Start date for forecast period
 * @param {Date} options.endDate - End date for forecast period
 * @param {boolean} options.includeDetailed - Whether to include detailed data by week
 * @param {boolean} options.includeAIInsights - Whether to include AI-generated insights
 * @returns {Promise<Object>} - Forecast data with insights
 */
const generateOrganizationForecast = async (options = {}) => {
  try {
    const { 
      startDate = new Date(), 
      endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 
      includeDetailed = true, 
      includeAIInsights = true 
    } = options;
    
    // Get current allocations and capacity data
    const allocationData = await getAllocationData(startDate, endDate);
    const capacityData = await getCapacityData(startDate, endDate);
    
    // Generate forecast with bottleneck detection
    const forecast = calculateUtilizationForecast(allocationData, capacityData, startDate, endDate);
    
    // Add detailed weekly breakdown if requested
    if (includeDetailed) {
      forecast.weeklyBreakdown = generateWeeklyBreakdown(allocationData, capacityData, startDate, endDate);
    }
    
    // Add AI insights if requested and available
    if (includeAIInsights && CLAUDE_API_KEY && claude) {
      try {
        forecast.aiInsights = await generateAIForecastInsights(forecast);
      } catch (aiError) {
        console.error('Error generating AI insights:', aiError);
        forecast.aiInsights = {
          error: 'Failed to generate AI insights',
          message: process.env.NODE_ENV === 'production' ? 'AI service unavailable' : aiError.message
        };
      }
    }
    
    return forecast;
  } catch (error) {
    console.error('Error generating organization forecast:', error);
    throw error;
  }
};

/**
 * Generate utilization forecast for a specific resource
 * @param {number} resourceId - Resource ID
 * @param {Object} options - Options for forecast
 * @param {Date} options.startDate - Start date for forecast period
 * @param {Date} options.endDate - End date for forecast period
 * @param {boolean} options.includeDetailed - Whether to include detailed data by week
 * @param {boolean} options.includeAIInsights - Whether to include AI-generated insights
 * @returns {Promise<Object>} - Forecast data with insights
 */
const generateResourceForecast = async (resourceId, options = {}) => {
  try {
    const { 
      startDate = new Date(), 
      endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 
      includeDetailed = true, 
      includeAIInsights = true 
    } = options;
    
    // Get resource details
    const resourceDetails = await getResourceDetails(resourceId);
    
    // Get resource allocations
    const allocationData = await getResourceAllocationData(resourceId, startDate, endDate);
    
    // Get resource capacity
    const capacityData = await getResourceCapacityData(resourceId, startDate, endDate);
    
    // Calculate forecast
    const forecast = calculateResourceForecast(resourceDetails, allocationData, capacityData, startDate, endDate);
    
    // Add detailed weekly breakdown if requested
    if (includeDetailed) {
      forecast.weeklyBreakdown = generateResourceWeeklyBreakdown(
        resourceId, 
        allocationData, 
        capacityData, 
        startDate, 
        endDate
      );
    }
    
    // Add bench time prediction
    forecast.benchPrediction = predictBenchTime(resourceId, allocationData, startDate, endDate);
    
    // Add AI insights if requested and available
    if (includeAIInsights && CLAUDE_API_KEY && claude) {
      try {
        forecast.aiInsights = await generateAIResourceInsights(resourceDetails, forecast);
      } catch (aiError) {
        console.error('Error generating AI insights for resource:', aiError);
        forecast.aiInsights = {
          error: 'Failed to generate AI insights',
          message: process.env.NODE_ENV === 'production' ? 'AI service unavailable' : aiError.message
        };
      }
    }
    
    return forecast;
  } catch (error) {
    console.error(`Error generating forecast for resource ${resourceId}:`, error);
    throw error;
  }
};

/**
 * Generate suggested allocation adjustments to balance workload
 * @param {Date} startDate - Start date for adjustment period
 * @param {Date} endDate - End date for adjustment period
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Suggested allocation adjustments
 */
const generateAllocationAdjustments = async (startDate, endDate, options = {}) => {
  try {
    // Get current allocations and resources
    const allocationData = await getAllocationData(startDate, endDate);
    const resources = await getAllResources();
    const capacityData = await getCapacityData(startDate, endDate);
    
    // Identify over and under-allocated resources
    const utilization = calculateUtilizationByResource(allocationData, capacityData, startDate, endDate);
    
    const overAllocated = [];
    const underAllocated = [];
    
    for (const resourceId in utilization) {
      const resourceUtil = utilization[resourceId];
      
      if (resourceUtil.averageUtilization > 100) {
        overAllocated.push({
          resourceId: parseInt(resourceId),
          name: resourceUtil.name,
          role: resourceUtil.role,
          overagePercentage: resourceUtil.averageUtilization - 100,
          allocations: resourceUtil.allocations
        });
      } else if (resourceUtil.averageUtilization < 70) {
        underAllocated.push({
          resourceId: parseInt(resourceId),
          name: resourceUtil.name,
          role: resourceUtil.role,
          availableCapacity: 100 - resourceUtil.averageUtilization,
          allocations: resourceUtil.allocations
        });
      }
    }
    
    // If there are no over-allocated resources, no adjustments needed
    if (overAllocated.length === 0) {
      return {
        adjustmentsNeeded: false,
        message: 'No over-allocated resources found for this period.',
        overAllocated: [],
        underAllocated,
        suggestions: []
      };
    }
    
    // Generate suggestions using AI if available
    let suggestions = [];
    
    if (CLAUDE_API_KEY && claude) {
      try {
        suggestions = await generateAIAllocationSuggestions(overAllocated, underAllocated, resources);
      } catch (aiError) {
        console.error('Error generating AI allocation suggestions:', aiError);
        // Fall back to rule-based suggestions
        suggestions = generateRuleBasedSuggestions(overAllocated, underAllocated);
      }
    } else {
      // Use rule-based algorithm if AI not available
      suggestions = generateRuleBasedSuggestions(overAllocated, underAllocated);
    }
    
    return {
      adjustmentsNeeded: true,
      overAllocated,
      underAllocated,
      suggestions
    };
  } catch (error) {
    console.error('Error generating allocation adjustments:', error);
    throw error;
  }
};

/**
 * Generate bottleneck predictions
 * @param {Date} startDate - Start date for prediction period
 * @param {Date} endDate - End date for prediction period
 * @returns {Promise<Array>} - Predicted bottlenecks
 */
const predictResourceBottlenecks = async (startDate, endDate) => {
  try {
    // Get current allocations and capacity data
    const allocationData = await getAllocationData(startDate, endDate);
    const capacityData = await getCapacityData(startDate, endDate);
    
    // Calculate utilization by resource and time period
    const utilization = calculateDetailedUtilizationByResource(allocationData, capacityData, startDate, endDate);
    
    // Identify bottlenecks (periods where multiple resources are over-allocated)
    const bottlenecks = identifyBottlenecks(utilization);
    
    // Enhance with AI insights if available
    if (bottlenecks.length > 0 && CLAUDE_API_KEY && claude) {
      try {
        const enhancedBottlenecks = await enhanceBottlenecksWithAI(bottlenecks, allocationData);
        return enhancedBottlenecks;
      } catch (aiError) {
        console.error('Error enhancing bottlenecks with AI:', aiError);
        return bottlenecks;
      }
    }
    
    return bottlenecks;
  } catch (error) {
    console.error('Error predicting resource bottlenecks:', error);
    throw error;
  }
};

/**
 * Predict bench time for all resources
 * @param {Date} startDate - Start date for prediction period
 * @param {Date} endDate - End date for prediction period
 * @returns {Promise<Array>} - Predicted bench time by resource
 */
const predictOrganizationBenchTime = async (startDate, endDate) => {
  try {
    // Get all resources
    const resources = await getAllResources();
    
    // Get bench time predictions for each resource
    const benchPredictions = [];
    
    for (const resource of resources) {
      const allocationData = await getResourceAllocationData(resource.ResourceID, startDate, endDate);
      const benchTime = predictBenchTime(resource.ResourceID, allocationData, startDate, endDate);
      
      benchPredictions.push({
        resourceId: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        ...benchTime
      });
    }
    
    // Sort by bench days (descending)
    benchPredictions.sort((a, b) => b.totalBenchDays - a.totalBenchDays);
    
    // Generate preemptive action suggestions with AI if available
    if (CLAUDE_API_KEY && claude) {
      try {
        return await generatePreemptiveActionSuggestions(benchPredictions);
      } catch (aiError) {
        console.error('Error generating preemptive action suggestions:', aiError);
        return benchPredictions;
      }
    }
    
    return benchPredictions;
  } catch (error) {
    console.error('Error predicting organization bench time:', error);
    throw error;
  }
};

// --- Helper functions ---

/**
 * Get allocation data for the specified period
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Allocation data
 */
const getAllocationData = async (startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(`
        SELECT 
          a.AllocationID,
          a.ResourceID,
          r.Name AS ResourceName,
          r.Role AS ResourceRole,
          a.ProjectID,
          p.Name AS ProjectName,
          a.StartDate,
          a.EndDate,
          a.Utilization
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE 
          (a.StartDate <= @endDate AND a.EndDate >= @startDate)
          AND p.Status = 'Active'
        ORDER BY a.ResourceID, a.StartDate
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('Error getting allocation data:', error);
    throw error;
  }
};

/**
 * Get allocation data for a specific resource
 * @param {number} resourceId - Resource ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Allocation data
 */
const getResourceAllocationData = async (resourceId, startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(`
        SELECT 
          a.AllocationID,
          a.ResourceID,
          r.Name AS ResourceName,
          r.Role AS ResourceRole,
          a.ProjectID,
          p.Name AS ProjectName,
          a.StartDate,
          a.EndDate,
          a.Utilization
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE 
          a.ResourceID = @resourceId
          AND (a.StartDate <= @endDate AND a.EndDate >= @startDate)
          AND p.Status = 'Active'
        ORDER BY a.StartDate
      `);
    
    return result.recordset;
  } catch (error) {
    console.error(`Error getting allocation data for resource ${resourceId}:`, error);
    throw error;
  }
};

/**
 * Get capacity data for the specified period
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Capacity data by resource
 */
const getCapacityData = async (startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    // Convert dates to year/month format
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;
    
    const result = await pool.request()
      .input('startYear', sql.Int, startYear)
      .input('startMonth', sql.Int, startMonth)
      .input('endYear', sql.Int, endYear)
      .input('endMonth', sql.Int, endMonth)
      .query(`
        SELECT 
          rc.ResourceID,
          r.Name AS ResourceName,
          rc.Year,
          rc.Month,
          rc.AvailableCapacity,
          rc.PlannedTimeOff
        FROM ResourceCapacity rc
        INNER JOIN Resources r ON rc.ResourceID = r.ResourceID
        WHERE 
          (rc.Year * 100 + rc.Month) >= (@startYear * 100 + @startMonth)
          AND (rc.Year * 100 + rc.Month) <= (@endYear * 100 + @endMonth)
        ORDER BY rc.ResourceID, rc.Year, rc.Month
      `);
    
    // Convert to object with resourceId as key
    const capacityByResource = {};
    
    for (const row of result.recordset) {
      if (!capacityByResource[row.ResourceID]) {
        capacityByResource[row.ResourceID] = {
          resourceId: row.ResourceID,
          resourceName: row.ResourceName,
          months: {}
        };
      }
      
      const yearMonth = `${row.Year}-${row.Month.toString().padStart(2, '0')}`;
      capacityByResource[row.ResourceID].months[yearMonth] = {
        availableCapacity: row.AvailableCapacity,
        plannedTimeOff: row.PlannedTimeOff
      };
    }
    
    return capacityByResource;
  } catch (error) {
    console.error('Error getting capacity data:', error);
    throw error;
  }
};

/**
 * Get capacity data for a specific resource
 * @param {number} resourceId - Resource ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Capacity data
 */
const getResourceCapacityData = async (resourceId, startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    // Convert dates to year/month format
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;
    
    const result = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('startYear', sql.Int, startYear)
      .input('startMonth', sql.Int, startMonth)
      .input('endYear', sql.Int, endYear)
      .input('endMonth', sql.Int, endMonth)
      .query(`
        SELECT 
          rc.Year,
          rc.Month,
          rc.AvailableCapacity,
          rc.PlannedTimeOff
        FROM ResourceCapacity rc
        WHERE 
          rc.ResourceID = @resourceId
          AND (rc.Year * 100 + rc.Month) >= (@startYear * 100 + @startMonth)
          AND (rc.Year * 100 + rc.Month) <= (@endYear * 100 + @endMonth)
        ORDER BY rc.Year, rc.Month
      `);
    
    // Convert to object with yearMonth as key
    const capacity = {
      resourceId,
      months: {}
    };
    
    for (const row of result.recordset) {
      const yearMonth = `${row.Year}-${row.Month.toString().padStart(2, '0')}`;
      capacity.months[yearMonth] = {
        availableCapacity: row.AvailableCapacity,
        plannedTimeOff: row.PlannedTimeOff
      };
    }
    
    return capacity;
  } catch (error) {
    console.error(`Error getting capacity data for resource ${resourceId}:`, error);
    throw error;
  }
};

/**
 * Get resource details
 * @param {number} resourceId - Resource ID
 * @returns {Promise<Object>} - Resource details
 */
const getResourceDetails = async (resourceId) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          ResourceID,
          Name,
          Role,
          Email
        FROM Resources
        WHERE ResourceID = @resourceId
      `);
    
    if (result.recordset.length === 0) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }
    
    return result.recordset[0];
  } catch (error) {
    console.error(`Error getting resource details for ID ${resourceId}:`, error);
    throw error;
  }
};

/**
 * Get all resources
 * @returns {Promise<Array>} - Resources
 */
const getAllResources = async () => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT 
          ResourceID,
          Name,
          Role,
          Email
        FROM Resources
        ORDER BY Name
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('Error getting all resources:', error);
    throw error;
  }
};

/**
 * Calculate utilization forecast
 * @param {Array} allocations - Allocation data
 * @param {Object} capacityData - Capacity data by resource
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} - Forecast data
 */
const calculateUtilizationForecast = (allocations, capacityData, startDate, endDate) => {
  // Group allocations by resource
  const allocationsByResource = {};
  
  for (const allocation of allocations) {
    if (!allocationsByResource[allocation.ResourceID]) {
      allocationsByResource[allocation.ResourceID] = [];
    }
    allocationsByResource[allocation.ResourceID].push(allocation);
  }
  
  // Calculate utilization by resource
  const resourceUtilization = {};
  let totalResourceCount = 0;
  let overAllocatedCount = 0;
  let underAllocatedCount = 0;
  let optimallyAllocatedCount = 0;
  
  for (const resourceId in allocationsByResource) {
    totalResourceCount++;
    
    const resourceAllocations = allocationsByResource[resourceId];
    const utilization = calculateResourceUtilizationForPeriod(
      resourceAllocations, 
      capacityData[resourceId], 
      startDate, 
      endDate
    );
    
    resourceUtilization[resourceId] = utilization;
    
    // Categorize resource allocation status
    if (utilization.averageUtilization > 110) {
      overAllocatedCount++;
    } else if (utilization.averageUtilization < 70) {
      underAllocatedCount++;
    } else {
      optimallyAllocatedCount++;
    }
  }
  
  // Identify potential bottlenecks (weeks with high utilization)
  const potentialBottlenecks = identifyWeeklyBottlenecks(resourceUtilization);
  
  return {
    forecastPeriod: {
      startDate,
      endDate
    },
    summary: {
      totalResources: totalResourceCount,
      overAllocated: {
        count: overAllocatedCount,
        percentage: totalResourceCount > 0 ? (overAllocatedCount / totalResourceCount * 100) : 0
      },
      underAllocated: {
        count: underAllocatedCount,
        percentage: totalResourceCount > 0 ? (underAllocatedCount / totalResourceCount * 100) : 0
      },
      optimallyAllocated: {
        count: optimallyAllocatedCount,
        percentage: totalResourceCount > 0 ? (optimallyAllocatedCount / totalResourceCount * 100) : 0
      }
    },
    resourceUtilization,
    potentialBottlenecks
  };
};

/**
 * Calculate resource utilization for a period
 * @param {Array} allocations - Resource allocations
 * @param {Object} capacityData - Resource capacity data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} - Utilization data
 */
const calculateResourceUtilizationForPeriod = (allocations, capacityData, startDate, endDate) => {
  // If no capacity data, use default
  if (!capacityData) {
    capacityData = {
      months: {}
    };
  }
  
  // Calculate daily utilization
  const dailyUtilization = {};
  let totalUtilization = 0;
  let daysInPeriod = 0;
  
  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    const yearMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Get capacity for this month
    const monthCapacity = capacityData.months[yearMonth] || { 
      availableCapacity: 100, 
      plannedTimeOff: 0 
    };
    
    // Adjust for planned time off
    const dailyCapacity = monthCapacity.availableCapacity - monthCapacity.plannedTimeOff;
    
    // Sum utilization from all active allocations on this day
    let dailyTotal = 0;
    
    for (const allocation of allocations) {
      const allocationStart = new Date(allocation.StartDate);
      const allocationEnd = new Date(allocation.EndDate);
      
      if (currentDate >= allocationStart && currentDate <= allocationEnd) {
        dailyTotal += allocation.Utilization;
      }
    }
    
    // Calculate utilization percentage against available capacity
    const utilizationPercentage = dailyCapacity > 0 ? (dailyTotal / dailyCapacity * 100) : 0;
    
    dailyUtilization[dateStr] = {
      date: dateStr,
      capacity: dailyCapacity,
      allocated: dailyTotal,
      utilizationPercentage
    };
    
    totalUtilization += utilizationPercentage;
    daysInPeriod++;
  }
  
  const averageUtilization = daysInPeriod > 0 ? (totalUtilization / daysInPeriod) : 0;
  
  // Find peak periods (top 10% of utilization days)
  const utilizationValues = Object.values(dailyUtilization)
    .map(day => day.utilizationPercentage)
    .sort((a, b) => b - a);
  
  const peakThreshold = utilizationValues.length > 0 ? 
    utilizationValues[Math.floor(utilizationValues.length * 0.1)] : 100;
  
  const peakPeriods = [];
  let currentPeak = null;
  
  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    const dayData = dailyUtilization[dateStr];
    
    if (dayData.utilizationPercentage >= peakThreshold) {
      if (!currentPeak) {
        currentPeak = {
          startDate: dateStr,
          endDate: dateStr,
          averageUtilization: dayData.utilizationPercentage
        };
      } else {
        currentPeak.endDate = dateStr;
        // Update running average
        const days = (new Date(currentPeak.endDate) - new Date(currentPeak.startDate)) / (24 * 60 * 60 * 1000) + 1;
        currentPeak.averageUtilization = 
          ((currentPeak.averageUtilization * (days - 1)) + dayData.utilizationPercentage) / days;
      }
    } else if (currentPeak) {
      peakPeriods.push(currentPeak);
      currentPeak = null;
    }
  }
  
  // Add any final peak period
  if (currentPeak) {
    peakPeriods.push(currentPeak);
  }
  
  return {
    averageUtilization,
    peakPeriods,
    dailyUtilization
  };
};

/**
 * Generate weekly breakdown of utilization
 * @param {Array} allocations - Allocations data
 * @param {Object} capacityData - Capacity data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Weekly breakdown
 */
const generateWeeklyBreakdown = (allocations, capacityData, startDate, endDate) => {
  // Group allocations by resource
  const allocationsByResource = {};
  
  for (const allocation of allocations) {
    if (!allocationsByResource[allocation.ResourceID]) {
      allocationsByResource[allocation.ResourceID] = [];
    }
    allocationsByResource[allocation.ResourceID].push(allocation);
  }
  
  // Generate weeks in period
  const weeks = [];
  let weekStart = new Date(startDate);
  
  while (weekStart <= endDate) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (weekEnd > endDate) {
      weekEnd.setTime(endDate.getTime());
    }
    
    weeks.push({
      startDate: weekStart.toISOString().slice(0, 10),
      endDate: weekEnd.toISOString().slice(0, 10),
      resources: {}
    });
    
    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
  }
  
  // Calculate weekly utilization by resource
  for (const resourceId in allocationsByResource) {
    const resourceAllocations = allocationsByResource[resourceId];
    
    for (const week of weeks) {
      const weekStartDate = new Date(week.startDate);
      const weekEndDate = new Date(week.endDate);
      
      let totalUtilization = 0;
      let daysInWeek = 0;
      
      for (let currentDate = new Date(weekStartDate); 
           currentDate <= weekEndDate; 
           currentDate.setDate(currentDate.getDate() + 1)) {
        
        const dateStr = currentDate.toISOString().slice(0, 10);
        const yearMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Get capacity for this month
        const resourceCapacity = capacityData[resourceId] || { months: {} };
        const monthCapacity = resourceCapacity.months[yearMonth] || { 
          availableCapacity: 100, 
          plannedTimeOff: 0 
        };
        
        // Adjust for planned time off
        const dailyCapacity = monthCapacity.availableCapacity - monthCapacity.plannedTimeOff;
        
        // Sum utilization from all active allocations on this day
        let dailyTotal = 0;
        
        for (const allocation of resourceAllocations) {
          const allocationStart = new Date(allocation.StartDate);
          const allocationEnd = new Date(allocation.EndDate);
          
          if (currentDate >= allocationStart && currentDate <= allocationEnd) {
            dailyTotal += allocation.Utilization;
          }
        }
        
        // Calculate utilization percentage against available capacity
        const utilizationPercentage = dailyCapacity > 0 ? (dailyTotal / dailyCapacity * 100) : 0;
        totalUtilization += utilizationPercentage;
        daysInWeek++;
      }
      
      const averageUtilization = daysInWeek > 0 ? (totalUtilization / daysInWeek) : 0;
      
      week.resources[resourceId] = {
        resourceId: parseInt(resourceId),
        resourceName: resourceAllocations[0].ResourceName,
        utilization: averageUtilization,
        status: getUtilizationStatus(averageUtilization)
      };
    }
  }
  
  return weeks;
};

/**
 * Generate weekly breakdown for a specific resource
 * @param {number} resourceId - Resource ID
 * @param {Array} allocations - Resource allocations
 * @param {Object} capacityData - Resource capacity data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Weekly breakdown
 */
const generateResourceWeeklyBreakdown = (resourceId, allocations, capacityData, startDate, endDate) => {
  // Generate weeks in period
  const weeks = [];
  let weekStart = new Date(startDate);
  
  while (weekStart <= endDate) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (weekEnd > endDate) {
      weekEnd.setTime(endDate.getTime());
    }
    
    weeks.push({
      startDate: weekStart.toISOString().slice(0, 10),
      endDate: weekEnd.toISOString().slice(0, 10),
      utilization: 0,
      allocations: []
    });
    
    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
  }
  
  // Calculate weekly utilization
  for (const week of weeks) {
    const weekStartDate = new Date(week.startDate);
    const weekEndDate = new Date(week.endDate);
    
    let totalUtilization = 0;
    let daysInWeek = 0;
    const weekAllocations = {};
    
    for (let currentDate = new Date(weekStartDate); 
         currentDate <= weekEndDate; 
         currentDate.setDate(currentDate.getDate() + 1)) {
      
      const dateStr = currentDate.toISOString().slice(0, 10);
      const yearMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Get capacity for this month
      const monthCapacity = capacityData.months[yearMonth] || { 
        availableCapacity: 100, 
        plannedTimeOff: 0 
      };
      
      // Adjust for planned time off
      const dailyCapacity = monthCapacity.availableCapacity - monthCapacity.plannedTimeOff;
      
      // Sum utilization from all active allocations on this day
      let dailyTotal = 0;
      
      for (const allocation of allocations) {
        const allocationStart = new Date(allocation.StartDate);
        const allocationEnd = new Date(allocation.EndDate);
        
        if (currentDate >= allocationStart && currentDate <= allocationEnd) {
          dailyTotal += allocation.Utilization;
          
          // Track allocations for this week
          if (!weekAllocations[allocation.AllocationID]) {
            weekAllocations[allocation.AllocationID] = {
              allocationId: allocation.AllocationID,
              projectId: allocation.ProjectID,
              projectName: allocation.ProjectName,
              utilization: allocation.Utilization
            };
          }
        }
      }
      
      // Calculate utilization percentage against available capacity
      const utilizationPercentage = dailyCapacity > 0 ? (dailyTotal / dailyCapacity * 100) : 0;
      totalUtilization += utilizationPercentage;
      daysInWeek++;
    }
    
    week.utilization = daysInWeek > 0 ? (totalUtilization / daysInWeek) : 0;
    week.status = getUtilizationStatus(week.utilization);
    week.allocations = Object.values(weekAllocations);
  }
  
  return weeks;
};

/**
 * Calculate resource forecast for a specific resource
 * @param {Object} resource - Resource details
 * @param {Array} allocations - Resource allocations
 * @param {Object} capacityData - Resource capacity data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} - Resource forecast
 */
const calculateResourceForecast = (resource, allocations, capacityData, startDate, endDate) => {
  const utilization = calculateResourceUtilizationForPeriod(
    allocations, 
    capacityData, 
    startDate, 
    endDate
  );
  
  return {
    resourceId: resource.ResourceID,
    resourceName: resource.Name,
    resourceRole: resource.Role,
    forecastPeriod: {
      startDate,
      endDate
    },
    averageUtilization: utilization.averageUtilization,
    utilizationStatus: getUtilizationStatus(utilization.averageUtilization),
    peakPeriods: utilization.peakPeriods,
    allocations: allocations.map(a => ({
      allocationId: a.AllocationID,
      projectId: a.ProjectID,
      projectName: a.ProjectName,
      startDate: a.StartDate,
      endDate: a.EndDate,
      utilization: a.Utilization
    }))
  };
};

/**
 * Calculate utilization by resource
 * @param {Array} allocations - Allocations data
 * @param {Object} capacityData - Capacity data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} - Utilization by resource
 */
const calculateUtilizationByResource = (allocations, capacityData, startDate, endDate) => {
  // Group allocations by resource
  const allocationsByResource = {};
  
  for (const allocation of allocations) {
    if (!allocationsByResource[allocation.ResourceID]) {
      allocationsByResource[allocation.ResourceID] = [];
    }
    allocationsByResource[allocation.ResourceID].push(allocation);
  }
  
  // Calculate utilization for each resource
  const utilizationByResource = {};
  
  for (const resourceId in allocationsByResource) {
    const resourceAllocations = allocationsByResource[resourceId];
    
    // Example allocation
    const sampleAllocation = resourceAllocations[0];
    
    const utilization = calculateResourceUtilizationForPeriod(
      resourceAllocations, 
      capacityData[resourceId], 
      startDate, 
      endDate
    );
    
    utilizationByResource[resourceId] = {
      resourceId: parseInt(resourceId),
      name: sampleAllocation.ResourceName,
      role: sampleAllocation.ResourceRole,
      averageUtilization: utilization.averageUtilization,
      peakPeriods: utilization.peakPeriods,
      allocations: resourceAllocations.map(a => ({
        allocationId: a.AllocationID,
        projectId: a.ProjectID,
        projectName: a.ProjectName,
        startDate: a.StartDate,
        endDate: a.EndDate,
        utilization: a.Utilization
      }))
    };
  }
  
  return utilizationByResource;
};

/**
 * Calculate detailed utilization by resource and week
 * @param {Array} allocations - Allocations data
 * @param {Object} capacityData - Capacity data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} - Detailed utilization
 */
const calculateDetailedUtilizationByResource = (allocations, capacityData, startDate, endDate) => {
  // Generate weekly breakdown
  const weeklyBreakdown = generateWeeklyBreakdown(allocations, capacityData, startDate, endDate);
  
  // Convert to resource-centric structure
  const utilizationByResource = {};
  
  // Create initial structure
  for (const allocation of allocations) {
    if (!utilizationByResource[allocation.ResourceID]) {
      utilizationByResource[allocation.ResourceID] = {
        resourceId: allocation.ResourceID,
        resourceName: allocation.ResourceName,
        resourceRole: allocation.ResourceRole,
        weeks: []
      };
    }
  }
  
  // Fill in weekly data
  for (const week of weeklyBreakdown) {
    for (const resourceId in week.resources) {
      if (utilizationByResource[resourceId]) {
        utilizationByResource[resourceId].weeks.push({
          startDate: week.startDate,
          endDate: week.endDate,
          utilization: week.resources[resourceId].utilization,
          status: week.resources[resourceId].status
        });
      }
    }
  }
  
  return utilizationByResource;
};

/**
 * Identify bottlenecks in resource utilization
 * @param {Object} utilizationByResource - Utilization by resource and week
 * @returns {Array} - Bottlenecks identified
 */
const identifyBottlenecks = (utilizationByResource) => {
  // Look for weeks where multiple resources are over-allocated
  const weeklyBottlenecks = {};
  
  for (const resourceId in utilizationByResource) {
    const resource = utilizationByResource[resourceId];
    
    for (const week of resource.weeks) {
      if (week.utilization > 100) {
        const weekKey = `${week.startDate}_${week.endDate}`;
        
        if (!weeklyBottlenecks[weekKey]) {
          weeklyBottlenecks[weekKey] = {
            startDate: week.startDate,
            endDate: week.endDate,
            overAllocatedResources: []
          };
        }
        
        weeklyBottlenecks[weekKey].overAllocatedResources.push({
          resourceId: parseInt(resourceId),
          resourceName: resource.resourceName,
          resourceRole: resource.resourceRole,
          utilization: week.utilization
        });
      }
    }
  }
  
  // Convert to array and sort by severity (number of over-allocated resources)
  const bottlenecks = Object.values(weeklyBottlenecks)
    .filter(b => b.overAllocatedResources.length > 1) // Only consider as bottleneck if multiple resources affected
    .map(b => ({
      ...b,
      severity: b.overAllocatedResources.length,
      averageOverallocation: b.overAllocatedResources.reduce((sum, r) => sum + (r.utilization - 100), 0) / b.overAllocatedResources.length
    }))
    .sort((a, b) => b.severity - a.severity);
  
  return bottlenecks;
};

/**
 * Identify weekly bottlenecks in resource utilization
 * @param {Object} resourceUtilization - Resource utilization data
 * @returns {Array} - Weekly bottlenecks
 */
const identifyWeeklyBottlenecks = (resourceUtilization) => {
  // We need weekly data from the resource utilization
  const weeklyData = {};
  
  for (const resourceId in resourceUtilization) {
    const resource = resourceUtilization[resourceId];
    
    // Use daily utilization to aggregate by week
    for (const dateStr in resource.dailyUtilization) {
      const date = new Date(dateStr);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      
      const weekKey = weekStart.toISOString().slice(0, 10);
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStartDate: weekKey,
          resources: {}
        };
      }
      
      if (!weeklyData[weekKey].resources[resourceId]) {
        weeklyData[weekKey].resources[resourceId] = {
          resourceId: parseInt(resourceId),
          name: resource.name || 'Unknown',
          role: resource.role || 'Unknown',
          dailyUtilization: [],
          averageUtilization: 0
        };
      }
      
      weeklyData[weekKey].resources[resourceId].dailyUtilization.push(
        resource.dailyUtilization[dateStr].utilizationPercentage
      );
    }
    
    // Calculate average utilization for each week
    for (const weekKey in weeklyData) {
      const week = weeklyData[weekKey];
      
      for (const resourceId in week.resources) {
        const resourceData = week.resources[resourceId];
        
        if (resourceData.dailyUtilization.length > 0) {
          resourceData.averageUtilization = 
            resourceData.dailyUtilization.reduce((sum, val) => sum + val, 0) / 
            resourceData.dailyUtilization.length;
        }
      }
    }
  }
  
  // Identify bottleneck weeks
  const bottlenecks = [];
  
  for (const weekKey in weeklyData) {
    const week = weeklyData[weekKey];
    
    // Count over-allocated resources
    const overAllocated = Object.values(week.resources)
      .filter(r => r.averageUtilization > 100);
    
    if (overAllocated.length > 1) {
      // This is a bottleneck week
      const weekEndDate = new Date(weekKey);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      
      bottlenecks.push({
        startDate: weekKey,
        endDate: weekEndDate.toISOString().slice(0, 10),
        overAllocatedResources: overAllocated,
        severity: overAllocated.length,
        averageOverallocation: overAllocated.reduce((sum, r) => sum + (r.averageUtilization - 100), 0) / overAllocated.length
      });
    }
  }
  
  // Sort by severity
  bottlenecks.sort((a, b) => b.severity - a.severity);
  
  return bottlenecks;
};

/**
 * Generate rule-based allocation suggestions
 * @param {Array} overAllocated - Over-allocated resources
 * @param {Array} underAllocated - Under-allocated resources
 * @returns {Array} - Allocation suggestions
 */
const generateRuleBasedSuggestions = (overAllocated, underAllocated) => {
  const suggestions = [];
  
  // Sort resources by overage percentage (descending)
  overAllocated.sort((a, b) => b.overagePercentage - a.overagePercentage);
  
  // Sort underAllocated by available capacity (descending)
  underAllocated.sort((a, b) => b.availableCapacity - a.availableCapacity);
  
  // For each over-allocated resource, try to redistribute work
  for (const overResource of overAllocated) {
    // Allocations to redistribute
    const allocationsToRedistribute = [];
    
    // Sort allocations by utilization (descending)
    const sortedAllocations = [...overResource.allocations]
      .sort((a, b) => b.utilization - a.utilization);
    
    // Target amount to redistribute
    const targetReduction = overResource.overagePercentage;
    let currentReduction = 0;
    
    // Collect allocations to redistribute until target is reached
    for (const allocation of sortedAllocations) {
      if (currentReduction >= targetReduction) {
        break;
      }
      
      // Add this allocation to the redistribution list
      allocationsToRedistribute.push(allocation);
      currentReduction += allocation.utilization;
    }
    
    // Find suitable resources to take on the work
    for (const allocation of allocationsToRedistribute) {
      // Find resources with matching skill profile
      const compatibleResources = underAllocated.filter(r => 
        r.availableCapacity >= allocation.utilization
      );
      
      if (compatibleResources.length > 0) {
        // Sort by most available capacity
        compatibleResources.sort((a, b) => b.availableCapacity - a.availableCapacity);
        
        const targetResource = compatibleResources[0];
        
        // Create suggestion
        suggestions.push({
          type: 'transfer',
          allocationId: allocation.allocationId,
          projectName: allocation.projectName,
          fromResource: {
            resourceId: overResource.resourceId,
            name: overResource.name,
            currentUtilization: overResource.overagePercentage + 100
          },
          toResource: {
            resourceId: targetResource.resourceId,
            name: targetResource.name,
            currentUtilization: 100 - targetResource.availableCapacity
          },
          utilizationAmount: allocation.utilization,
          impact: {
            fromResourceNewUtilization: (overResource.overagePercentage + 100) - allocation.utilization,
            toResourceNewUtilization: (100 - targetResource.availableCapacity) + allocation.utilization
          }
        });
        
        // Update available capacity
        targetResource.availableCapacity -= allocation.utilization;
      } else {
        // No compatible resources found, suggest reducing scope
        suggestions.push({
          type: 'reduce',
          allocationId: allocation.allocationId,
          projectName: allocation.projectName,
          resource: {
            resourceId: overResource.resourceId,
            name: overResource.name,
            currentUtilization: overResource.overagePercentage + 100
          },
          utilizationAmount: allocation.utilization,
          suggestedReduction: Math.min(allocation.utilization * 0.25, overResource.overagePercentage),
          impact: {
            newUtilization: (overResource.overagePercentage + 100) - Math.min(allocation.utilization * 0.25, overResource.overagePercentage)
          }
        });
      }
    }
  }
  
  return suggestions;
};

/**
 * Enhance bottlenecks with AI insights
 * @param {Array} bottlenecks - Bottlenecks data
 * @param {Array} allocations - Allocations data
 * @returns {Promise<Array>} - Enhanced bottlenecks
 */
const enhanceBottlenecksWithAI = async (bottlenecks, allocations) => {
  try {
    // Skip if no Claude API or no bottlenecks
    if (!CLAUDE_API_KEY || !claude || bottlenecks.length === 0) {
      return bottlenecks;
    }
    
    // Process bottlenecks in batches
    const enhancedBottlenecks = [...bottlenecks];
    
    for (let i = 0; i < bottlenecks.length; i++) {
      const bottleneck = bottlenecks[i];
      
      // Get affected projects
      const affectedProjectIds = new Set();
      
      for (const resource of bottleneck.overAllocatedResources) {
        // Find allocations for this resource during the bottleneck period
        const resourceAllocations = allocations.filter(a => 
          a.ResourceID === resource.resourceId &&
          new Date(a.StartDate) <= new Date(bottleneck.endDate) &&
          new Date(a.EndDate) >= new Date(bottleneck.startDate)
        );
        
        for (const allocation of resourceAllocations) {
          affectedProjectIds.add(allocation.ProjectID);
        }
      }
      
      // Get affected projects details
      const affectedProjects = [];
      
      for (const projectId of affectedProjectIds) {
        const projectAllocations = allocations.filter(a => a.ProjectID === projectId);
        
        if (projectAllocations.length > 0) {
          const project = {
            projectId,
            projectName: projectAllocations[0].ProjectName,
            resources: []
          };
          
          // Get resources allocated to this project
          const projectResourceIds = new Set();
          
          for (const allocation of projectAllocations) {
            projectResourceIds.add(allocation.ResourceID);
          }
          
          for (const resourceId of projectResourceIds) {
            const resourceAllocations = projectAllocations.filter(a => a.ResourceID === resourceId);
            
            if (resourceAllocations.length > 0) {
              project.resources.push({
                resourceId,
                resourceName: resourceAllocations[0].ResourceName,
                utilization: resourceAllocations[0].Utilization
              });
            }
          }
          
          affectedProjects.push(project);
        }
      }
      
      // Create prompt for Claude
      const prompt = `
<instructions>
You are an AI assistant helping with resource management bottleneck analysis. I'll provide details about a bottleneck period with overallocated resources and affected projects. 

Please analyze this bottleneck and provide:
1. A concise bottleneck description (1-2 sentences)
2. The root cause analysis of why this bottleneck is occurring (1-3 bullet points)
3. Specific resolution recommendations that could address this bottleneck (2-4 bullet points)
4. Risk level (High/Medium/Low) with a brief justification

Your response should be concise and actionable for resource managers.
</instructions>

<bottleneck_details>
Period: ${bottleneck.startDate} to ${bottleneck.endDate}
Severity: ${bottleneck.severity} overallocated resources
Average Overallocation: ${bottleneck.averageOverallocation.toFixed(1)}%

Overallocated Resources:
${bottleneck.overAllocatedResources.map(r => `- ${r.resourceName} (${r.resourceRole}): ${r.utilization.toFixed(1)}% utilization`).join('\n')}

Affected Projects:
${affectedProjects.map(p => {
  return `- ${p.projectName} (ID: ${p.projectId})
  Resources: ${p.resources.map(r => `${r.resourceName} (${r.utilization}%)`).join(', ')}`;
}).join('\n')}
</bottleneck_details>

Please format your response in JSON with this structure:
{
  "description": "Concise bottleneck description",
  "rootCauses": ["Cause 1", "Cause 2"],
  "recommendedActions": ["Action 1", "Action 2", "Action 3"],
  "riskLevel": "High/Medium/Low",
  "riskJustification": "Brief justification for risk level"
}
`;

      try {
        // Make API request
        const response = await claude.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        });
        
        // Process response
        const responseText = response.content[0].text.trim();
        
        try {
          const insights = JSON.parse(responseText);
          enhancedBottlenecks[i] = {
            ...bottleneck,
            description: insights.description,
            rootCauses: insights.rootCauses,
            recommendedActions: insights.recommendedActions,
            riskLevel: insights.riskLevel,
            riskJustification: insights.riskJustification
          };
        } catch (parseError) {
          console.error('Error parsing AI bottleneck insights:', parseError);
        }
      } catch (aiError) {
        console.error('Error getting AI bottleneck insights:', aiError);
      }
    }
    
    return enhancedBottlenecks;
  } catch (error) {
    console.error('Error enhancing bottlenecks with AI:', error);
    return bottlenecks;
  }
};

/**
 * Predict bench time for a resource
 * @param {number} resourceId - Resource ID
 * @param {Array} allocations - Resource allocations
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} - Bench time prediction
 */
const predictBenchTime = (resourceId, allocations, startDate, endDate) => {
  // Initialize bench periods
  const benchPeriods = [];
  let currentPeriod = null;
  
  // Sort allocations by start date
  const sortedAllocations = [...allocations].sort((a, b) => 
    new Date(a.StartDate) - new Date(b.StartDate)
  );
  
  // Track bench time by day
  for (let currentDate = new Date(startDate); 
       currentDate <= endDate; 
       currentDate.setDate(currentDate.getDate() + 1)) {
    
    const dateStr = currentDate.toISOString().slice(0, 10);
    
    // Check if resource is allocated on this day
    const isAllocated = sortedAllocations.some(allocation => 
      currentDate >= new Date(allocation.StartDate) && 
      currentDate <= new Date(allocation.EndDate) &&
      allocation.Utilization > 20 // Consider anything above 20% as allocated
    );
    
    if (!isAllocated) {
      // Resource is on bench
      if (!currentPeriod) {
        currentPeriod = {
          startDate: dateStr,
          endDate: dateStr,
          days: 1
        };
      } else {
        currentPeriod.endDate = dateStr;
        currentPeriod.days++;
      }
    } else if (currentPeriod) {
      // Resource was on bench but now allocated, end bench period
      benchPeriods.push(currentPeriod);
      currentPeriod = null;
    }
  }
  
  // Add final bench period if exists
  if (currentPeriod) {
    benchPeriods.push(currentPeriod);
  }
  
  // Calculate total bench days
  const totalBenchDays = benchPeriods.reduce((sum, period) => sum + period.days, 0);
  
  // Calculate percentage of time on bench
  const totalDaysInPeriod = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
  const benchPercentage = (totalBenchDays / totalDaysInPeriod) * 100;
  
  return {
    totalBenchDays,
    benchPercentage,
    benchPeriods
  };
};

/**
 * Generate preemptive action suggestions for bench time
 * @param {Array} benchPredictions - Bench time predictions by resource
 * @returns {Promise<Array>} - Enhanced predictions with suggestions
 */
const generatePreemptiveActionSuggestions = async (benchPredictions) => {
  try {
    // Skip if no Claude API
    if (!CLAUDE_API_KEY || !claude) {
      return benchPredictions;
    }
    
    // Process predictions in batches
    const enhancedPredictions = [...benchPredictions];
    const batchSize = 5;
    
    for (let i = 0; i < benchPredictions.length; i += batchSize) {
      const batch = benchPredictions.slice(i, i + batchSize);
      
      // Create prompt for Claude
      const prompt = `
<instructions>
You are an AI assistant helping with resource management. I'll provide details about resources with predicted bench time (time without assigned work). For each resource, please generate specific, actionable recommendations to address this bench time effectively.

For each resource, provide:
1. A priority level (High/Medium/Low) based on the amount of bench time
2. 2-3 specific, actionable recommendations for how to utilize this bench time effectively
3. A brief explanation of the business impact of addressing this bench time

Your recommendations should be tailored to each resource's role and specific situation.
</instructions>

<resources_with_bench_time>
${batch.map(resource => `
Resource: ${resource.name} (${resource.role})
Bench Time: ${resource.totalBenchDays} days (${resource.benchPercentage.toFixed(1)}%)
Bench Periods:
${resource.benchPeriods.map(period => `- ${period.startDate} to ${period.endDate} (${period.days} days)`).join('\n')}
`).join('\n---\n')}
</resources_with_bench_time>

Please format your response as a JSON array where each object represents recommendations for one resource:
[
  {
    "resourceId": 123,
    "priority": "High/Medium/Low",
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "businessImpact": "Brief impact explanation"
  },
  ...
]
`;

      try {
        // Make API request
        const response = await claude.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        });
        
        // Process response
        const responseText = response.content[0].text.trim();
        
        try {
          const suggestions = JSON.parse(responseText);
          
          // Match suggestions to resources
          for (let j = 0; j < batch.length; j++) {
            const resourceId = batch[j].resourceId;
            const suggestion = suggestions.find(s => s.resourceId === resourceId);
            
            if (suggestion) {
              enhancedPredictions[i + j] = {
                ...enhancedPredictions[i + j],
                priority: suggestion.priority,
                recommendations: suggestion.recommendations,
                businessImpact: suggestion.businessImpact
              };
            }
          }
        } catch (parseError) {
          console.error('Error parsing AI bench time suggestions:', parseError);
        }
      } catch (aiError) {
        console.error('Error getting AI bench time suggestions:', aiError);
      }
    }
    
    return enhancedPredictions;
  } catch (error) {
    console.error('Error generating preemptive action suggestions:', error);
    return benchPredictions;
  }
};

/**
 * Generate AI allocation suggestions
 * @param {Array} overAllocated - Over-allocated resources
 * @param {Array} underAllocated - Under-allocated resources
 * @param {Array} resources - All resources
 * @returns {Promise<Array>} - AI-generated suggestions
 */
const generateAIAllocationSuggestions = async (overAllocated, underAllocated, resources) => {
  try {
    // Skip if no Claude API
    if (!CLAUDE_API_KEY || !claude) {
      return generateRuleBasedSuggestions(overAllocated, underAllocated);
    }
    
    // Create prompt for Claude
    const prompt = `
<instructions>
You are an AI assistant helping with resource allocation. I'll provide details about overallocated resources (>100% utilization) and underallocated resources (<70% utilization). Your task is to suggest optimal ways to rebalance the workload.

For each overallocated resource, suggest either:
1. Transferring specific allocations to underallocated resources, or
2. Reducing the scope/utilization of specific allocations if no suitable transfer is possible

Make your suggestions specific and actionable, with clear reasoning. Prioritize maintaining project continuity while balancing workloads.
</instructions>

<resources>
Overallocated Resources:
${overAllocated.map(resource => `
- ${resource.name} (${resource.role}): ${(resource.overagePercentage + 100).toFixed(1)}% utilization
  Allocations:
  ${resource.allocations.map(a => `- Project: ${a.projectName}, Utilization: ${a.utilization}%`).join('\n  ')}
`).join('\n')}

Underallocated Resources:
${underAllocated.map(resource => `
- ${resource.name} (${resource.role}): ${(100 - resource.availableCapacity).toFixed(1)}% utilization (${resource.availableCapacity.toFixed(1)}% available)
  Allocations:
  ${resource.allocations.map(a => `- Project: ${a.projectName}, Utilization: ${a.utilization}%`).join('\n  ')}
`).join('\n')}
</resources>

Please format your response as a JSON array of suggestion objects:
[
  {
    "type": "transfer",
    "fromResource": {"resourceId": 123, "name": "Name"},
    "toResource": {"resourceId": 456, "name": "Name"},
    "projectName": "Project Name",
    "utilizationAmount": 25,
    "reasoning": "Brief explanation of why this is a good match"
  },
  {
    "type": "reduce",
    "resource": {"resourceId": 123, "name": "Name"},
    "projectName": "Project Name",
    "currentUtilization": 40,
    "suggestedReduction": 10,
    "reasoning": "Brief explanation of why reduction is recommended"
  }
]
`;

    // Make API request
    const response = await claude.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    // Process response
    const responseText = response.content[0].text.trim();
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing AI allocation suggestions:', parseError);
      return generateRuleBasedSuggestions(overAllocated, underAllocated);
    }
  } catch (error) {
    console.error('Error generating AI allocation suggestions:', error);
    return generateRuleBasedSuggestions(overAllocated, underAllocated);
  }
};

/**
 * Generate AI forecast insights
 * @param {Object} forecast - Forecast data
 * @returns {Promise<Object>} - AI-generated insights
 */
const generateAIForecastInsights = async (forecast) => {
  try {
    // Skip if no Claude API
    if (!CLAUDE_API_KEY || !claude) {
      return {
        error: 'AI insights not available - Claude API key not configured.'
      };
    }
    
    // Create prompt for Claude
    const prompt = `
<instructions>
You are an AI assistant analyzing resource utilization forecasts. Based on the provided forecast data, generate concise, actionable insights that will help resource managers optimize allocation and address potential issues.

Focus on:
1. Key trends and patterns in resource utilization
2. Potential bottlenecks and their business impact
3. Strategic recommendations for allocation improvements
4. Upcoming capacity risks and opportunities

Your insights should be specific, actionable, and tailored to the data.
</instructions>

<forecast_data>
${JSON.stringify(forecast, null, 2)}
</forecast_data>

Please format your response as a JSON object with these fields:
{
  "summary": "Brief 2-3 sentence overview of utilization status",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "bottlenecks": {
    "count": number,
    "description": "Brief bottleneck analysis",
    "impact": "Business impact of bottlenecks"
  },
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "outlook": "Brief forward-looking assessment"
}
`;

    // Make API request
    const response = await claude.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    // Process response
    const responseText = response.content[0].text.trim();
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing AI forecast insights:', parseError);
      return {
        error: 'Error parsing AI insights',
        rawResponse: responseText.substring(0, 200) + '...'
      };
    }
  } catch (error) {
    console.error('Error generating AI forecast insights:', error);
    return {
      error: 'Failed to generate AI insights',
      message: error.message
    };
  }
};

/**
 * Generate AI insights for a resource
 * @param {Object} resource - Resource details
 * @param {Object} forecast - Resource forecast
 * @returns {Promise<Object>} - AI-generated insights
 */
const generateAIResourceInsights = async (resource, forecast) => {
  try {
    // Skip if no Claude API
    if (!CLAUDE_API_KEY || !claude) {
      return {
        error: 'AI insights not available - Claude API key not configured.'
      };
    }
    
    // Create prompt for Claude
    const prompt = `
<instructions>
You are an AI assistant analyzing a specific resource's utilization forecast. Based on the provided data, generate concise, actionable insights to help optimize this resource's allocation and address potential issues.

Focus on:
1. This specific resource's utilization patterns and trends
2. Periods of over or under-allocation and their implications
3. Specific recommendations to optimize this resource's allocation
4. Potential skills development or career opportunities during bench time

Your insights should be specific, actionable, and tailored to this resource's situation.
</instructions>

<resource_details>
Resource ID: ${resource.ResourceID}
Name: ${resource.Name}
Role: ${resource.Role}
</resource_details>

<forecast_data>
${JSON.stringify(forecast, null, 2)}
</forecast_data>

Please format your response as a JSON object with these fields:
{
  "summary": "Brief 2-3 sentence overview of resource utilization",
  "utilizationAnalysis": "Analysis of utilization patterns",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "skillDevelopmentOpportunities": ["Opportunity 1", "Opportunity 2"],
  "riskAssessment": "Brief assessment of utilization risks for this resource"
}
`;

    // Make API request
    const response = await claude.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    // Process response
    const responseText = response.content[0].text.trim();
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing AI resource insights:', parseError);
      return {
        error: 'Error parsing AI insights',
        rawResponse: responseText.substring(0, 200) + '...'
      };
    }
  } catch (error) {
    console.error('Error generating AI resource insights:', error);
    return {
      error: 'Failed to generate AI insights',
      message: error.message
    };
  }
};

/**
 * Get utilization status based on utilization percentage
 * @param {number} utilization - Utilization percentage
 * @returns {string} - Utilization status
 */
const getUtilizationStatus = (utilization) => {
  if (utilization > 110) {
    return 'critical';
  } else if (utilization > 100) {
    return 'overallocated';
  } else if (utilization >= 80) {
    return 'optimal';
  } else if (utilization >= 50) {
    return 'adequate';
  } else if (utilization > 0) {
    return 'underallocated';
  } else {
    return 'bench';
  }
};

module.exports = {
  generateOrganizationForecast,
  generateResourceForecast,
  generateAllocationAdjustments,
  predictResourceBottlenecks,
  predictOrganizationBenchTime
};
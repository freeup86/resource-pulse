// matchingService.js
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
 * Finds the best matches between resources and projects based on various factors
 * @param {Object} options - Options for matching
 * @param {number} [options.projectId] - Optional project ID to match resources for
 * @param {number} [options.resourceId] - Optional resource ID to match projects for
 * @param {Date} [options.startDate] - Optional start date for availability check
 * @param {Date} [options.endDate] - Optional end date for availability check
 * @param {number} [options.limit=10] - Maximum number of matches to return
 * @returns {Promise<Array>} - Ranked list of matches with scores
 */
const findBestMatches = async (options = {}) => {
  try {
    const {
      projectId,
      resourceId,
      startDate,
      endDate,
      limit = 10
    } = options;

    // Validate inputs
    if (!projectId && !resourceId) {
      throw new Error('Either projectId or resourceId must be provided');
    }

    if (projectId && resourceId) {
      // Return a single match score between this specific resource and project
      return await getSingleMatchScore(resourceId, projectId, startDate, endDate);
    } else if (projectId) {
      // Find best resources for a project
      return await findResourcesForProject(projectId, startDate, endDate, limit);
    } else {
      // Find best projects for a resource
      return await findProjectsForResource(resourceId, startDate, endDate, limit);
    }
  } catch (error) {
    console.error('Error finding best matches:', error);
    throw error;
  }
};

/**
 * Find the best resources for a specific project
 * @param {number} projectId - Project ID
 * @param {Date} startDate - Start date for availability check
 * @param {Date} endDate - End date for availability check
 * @param {number} limit - Maximum number of matches to return
 * @returns {Promise<Array>} - Ranked list of resource matches
 */
const findResourcesForProject = async (projectId, startDate, endDate, limit) => {
  try {
    const pool = await poolPromise;

    // Step 1: Get project details and required skills
    const projectDetails = await getProjectDetails(projectId);
    
    if (!projectDetails) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Step 2: Find resources with matching skills
    const resourcesWithSkills = await findResourcesWithMatchingSkills(projectDetails.skills);

    // If no resources found, return empty array
    if (resourcesWithSkills.length === 0) {
      return [];
    }

    // Step 3: Check resource availability during project period
    const availabilityStartDate = startDate || projectDetails.startDate || new Date();
    const availabilityEndDate = endDate || projectDetails.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default 90 days
    
    const resourcesWithAvailability = await checkResourcesAvailability(
      resourcesWithSkills, 
      availabilityStartDate, 
      availabilityEndDate
    );

    // Step 4: Get past project experience and feedback for these resources
    const resourcesWithHistory = await addResourceHistoryAndFeedback(resourcesWithAvailability);

    // Step 5: Calculate overall match scores
    let matches = calculateResourceMatchScores(resourcesWithHistory, projectDetails);

    // Step 6: Use AI to further refine matches for complex fit criteria
    matches = await enhanceMatchesWithAI(matches, projectDetails, 'project_to_resources');
    
    // Sort by score and limit results
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
  } catch (error) {
    console.error('Error finding resources for project:', error);
    throw error;
  }
};

/**
 * Find the best projects for a specific resource
 * @param {number} resourceId - Resource ID
 * @param {Date} startDate - Start date for availability check
 * @param {Date} endDate - End date for availability check
 * @param {number} limit - Maximum number of matches to return
 * @returns {Promise<Array>} - Ranked list of project matches
 */
const findProjectsForResource = async (resourceId, startDate, endDate, limit) => {
  try {
    const pool = await poolPromise;

    // Step 1: Get resource details and skills
    const resourceDetails = await getResourceDetails(resourceId);
    
    if (!resourceDetails) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }

    // Step 2: Find projects with matching skill requirements
    const projectsWithMatchingSkills = await findProjectsWithMatchingSkills(resourceDetails.skills);

    // If no projects found, return empty array
    if (projectsWithMatchingSkills.length === 0) {
      return [];
    }

    // Step 3: Check resource availability during each project period
    const availabilityStartDate = startDate || new Date();
    const availabilityEndDate = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default 90 days
    
    const resourceAvailability = await getResourceAvailability(
      resourceId, 
      availabilityStartDate, 
      availabilityEndDate
    );

    // Filter projects based on availability and add availability score
    const projectsWithAvailability = projectsWithMatchingSkills.map(project => {
      const projectStart = new Date(project.startDate || availabilityStartDate);
      const projectEnd = new Date(project.endDate || availabilityEndDate);
      
      // Check if resource has availability during this period
      const availabilityScore = calculateAvailabilityScoreForProject(
        resourceAvailability,
        projectStart,
        projectEnd
      );

      return {
        ...project,
        availabilityScore
      };
    }).filter(project => project.availabilityScore > 0);

    // Step 4: Get past project experience and team compatibility
    const projectsWithContext = await addTeamCompatibilityData(projectsWithAvailability, resourceId);

    // Step 5: Calculate overall match scores
    let matches = calculateProjectMatchScores(projectsWithContext, resourceDetails);

    // Step 6: Use AI to further refine matches for complex fit criteria
    matches = await enhanceMatchesWithAI(matches, resourceDetails, 'resource_to_projects');
    
    // Sort by score and limit results
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
  } catch (error) {
    console.error('Error finding projects for resource:', error);
    throw error;
  }
};

/**
 * Calculate match score between a specific resource and project
 * @param {number} resourceId - Resource ID
 * @param {number} projectId - Project ID
 * @param {Date} startDate - Start date for availability
 * @param {Date} endDate - End date for availability
 * @returns {Promise<Object>} - Match details with score
 */
const getSingleMatchScore = async (resourceId, projectId, startDate, endDate) => {
  try {
    // Get resource details
    const resourceDetails = await getResourceDetails(resourceId);
    if (!resourceDetails) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }

    // Get project details
    const projectDetails = await getProjectDetails(projectId);
    if (!projectDetails) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Calculate skills match score
    const skillsMatchScore = calculateSkillsMatchScore(resourceDetails.skills, projectDetails.skills);

    // Check resource availability
    const availabilityStartDate = startDate || projectDetails.startDate || new Date();
    const availabilityEndDate = endDate || projectDetails.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    
    const resourceAvailability = await getResourceAvailability(
      resourceId, 
      availabilityStartDate, 
      availabilityEndDate
    );

    const availabilityScore = calculateAvailabilityScoreForProject(
      resourceAvailability,
      availabilityStartDate,
      availabilityEndDate
    );

    // Get experience and feedback
    const resourceHistory = await getResourceProjectHistory(resourceId);
    const experienceScore = calculateExperienceScore(resourceHistory, projectDetails);
    
    // Get team compatibility data
    const teamData = await getProjectTeamData(projectId);
    const teamCompatibilityScore = calculateTeamCompatibilityScore(resourceDetails, teamData);

    // Calculate overall match score
    const overallScore = (
      skillsMatchScore * 0.4 + 
      availabilityScore * 0.3 + 
      experienceScore * 0.2 + 
      teamCompatibilityScore * 0.1
    );

    // Use AI to refine the score
    const match = {
      resourceId,
      resourceName: resourceDetails.name,
      projectId,
      projectName: projectDetails.name,
      skillsMatchScore,
      availabilityScore,
      experienceScore,
      teamCompatibilityScore,
      score: overallScore,
      details: {
        skills: {
          resource: resourceDetails.skills,
          project: projectDetails.skills,
          matchPercentage: skillsMatchScore * 100
        },
        availability: {
          requiredPeriod: {
            start: availabilityStartDate,
            end: availabilityEndDate
          },
          availabilityPercentage: availabilityScore * 100
        },
        experience: {
          relevantProjects: resourceHistory.filter(h => 
            h.score > 0.3 // Only include somewhat relevant projects
          ).map(h => ({
            projectName: h.projectName,
            relevanceScore: h.score
          }))
        },
        teamCompatibility: {
          score: teamCompatibilityScore * 100,
          previousCollaborations: teamData.previousCollaborations || []
        }
      }
    };

    // Enhance with AI analysis
    const enhancedMatches = await enhanceMatchesWithAI([match], resourceDetails, 'single_match');
    return enhancedMatches[0];
  } catch (error) {
    console.error('Error calculating match score:', error);
    throw error;
  }
};

/**
 * Get project details including required skills
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - Project details
 */
const getProjectDetails = async (projectId) => {
  try {
    const pool = await poolPromise;
    
    // Get basic project details
    const projectResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          ProjectID,
          Name,
          Client,
          Description,
          StartDate,
          EndDate,
          Status
        FROM Projects
        WHERE ProjectID = @projectId
      `);
    
    if (projectResult.recordset.length === 0) {
      return null;
    }
    
    const project = projectResult.recordset[0];
    
    // Get required skills
    const skillsResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          s.SkillID,
          s.Name,
          s.Category
        FROM Skills s
        INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
        WHERE ps.ProjectID = @projectId
      `);
    
    return {
      id: project.ProjectID,
      name: project.Name,
      client: project.Client,
      description: project.Description,
      startDate: project.StartDate,
      endDate: project.EndDate,
      status: project.Status,
      skills: skillsResult.recordset
    };
  } catch (error) {
    console.error('Error getting project details:', error);
    throw error;
  }
};

/**
 * Get resource details including skills
 * @param {number} resourceId - Resource ID
 * @returns {Promise<Object>} - Resource details
 */
const getResourceDetails = async (resourceId) => {
  try {
    const pool = await poolPromise;
    
    // Get basic resource details
    const resourceResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          ResourceID,
          Name,
          Role,
          Email,
          HourlyRate
        FROM Resources
        WHERE ResourceID = @resourceId
      `);
    
    if (resourceResult.recordset.length === 0) {
      return null;
    }
    
    const resource = resourceResult.recordset[0];
    
    // Get resource skills
    const skillsResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          s.SkillID,
          s.Name,
          s.Category
        FROM Skills s
        INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
        WHERE rs.ResourceID = @resourceId
      `);
    
    return {
      id: resource.ResourceID,
      name: resource.Name,
      role: resource.Role,
      email: resource.Email,
      hourlyRate: resource.HourlyRate,
      skills: skillsResult.recordset
    };
  } catch (error) {
    console.error('Error getting resource details:', error);
    throw error;
  }
};

/**
 * Find resources with skills matching project requirements
 * @param {Array} projectSkills - Required skills for project
 * @returns {Promise<Array>} - Resources with matching skills and skill scores
 */
const findResourcesWithMatchingSkills = async (projectSkills) => {
  try {
    const pool = await poolPromise;
    
    // If no project skills, return empty array
    if (!projectSkills || projectSkills.length === 0) {
      return [];
    }
    
    // Get all skill IDs
    const skillIds = projectSkills.map(skill => skill.SkillID);
    
    // Find resources with any of these skills
    const resourcesResult = await pool.request()
      .query(`
        SELECT DISTINCT
          r.ResourceID,
          r.Name,
          r.Role,
          r.Email,
          r.HourlyRate
        FROM Resources r
        INNER JOIN ResourceSkills rs ON r.ResourceID = rs.ResourceID
        WHERE rs.SkillID IN (${skillIds.join(',')})
      `);
    
    const resources = resourcesResult.recordset;
    
    // For each resource, get their skills and compute match score
    const resourcesWithSkills = [];
    for (const resource of resources) {
      // Get resource skills
      const resourceSkillsResult = await pool.request()
        .input('resourceId', sql.Int, resource.ResourceID)
        .query(`
          SELECT 
            s.SkillID,
            s.Name,
            s.Category
          FROM Skills s
          INNER JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
          WHERE rs.ResourceID = @resourceId
        `);
      
      const resourceSkills = resourceSkillsResult.recordset;
      
      // Calculate skills match score
      const skillsMatchScore = calculateSkillsMatchScore(resourceSkills, projectSkills);
      
      resourcesWithSkills.push({
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        email: resource.Email,
        hourlyRate: resource.HourlyRate,
        skills: resourceSkills,
        skillsMatchScore
      });
    }
    
    return resourcesWithSkills;
  } catch (error) {
    console.error('Error finding resources with matching skills:', error);
    throw error;
  }
};

/**
 * Find projects with skills matching resource skills
 * @param {Array} resourceSkills - Skills the resource has
 * @returns {Promise<Array>} - Projects with matching skill requirements
 */
const findProjectsWithMatchingSkills = async (resourceSkills) => {
  try {
    const pool = await poolPromise;
    
    // If no resource skills, return empty array
    if (!resourceSkills || resourceSkills.length === 0) {
      return [];
    }
    
    // Get all skill IDs
    const skillIds = resourceSkills.map(skill => skill.SkillID);
    
    // Find projects requiring any of these skills
    const projectsResult = await pool.request()
      .query(`
        SELECT DISTINCT
          p.ProjectID,
          p.Name,
          p.Client,
          p.Description,
          p.StartDate,
          p.EndDate,
          p.Status
        FROM Projects p
        INNER JOIN ProjectSkills ps ON p.ProjectID = ps.ProjectID
        WHERE ps.SkillID IN (${skillIds.join(',')})
        AND p.Status = 'Active'
      `);
    
    const projects = projectsResult.recordset;
    
    // For each project, get required skills and compute match score
    const projectsWithSkills = [];
    for (const project of projects) {
      // Get project required skills
      const projectSkillsResult = await pool.request()
        .input('projectId', sql.Int, project.ProjectID)
        .query(`
          SELECT 
            s.SkillID,
            s.Name,
            s.Category
          FROM Skills s
          INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
          WHERE ps.ProjectID = @projectId
        `);
      
      const projectSkills = projectSkillsResult.recordset;
      
      // Calculate skills match score
      const skillsMatchScore = calculateSkillsMatchScore(resourceSkills, projectSkills);
      
      projectsWithSkills.push({
        id: project.ProjectID,
        name: project.Name,
        client: project.Client,
        description: project.Description,
        startDate: project.StartDate,
        endDate: project.EndDate,
        status: project.Status,
        skills: projectSkills,
        skillsMatchScore
      });
    }
    
    return projectsWithSkills;
  } catch (error) {
    console.error('Error finding projects with matching skills:', error);
    throw error;
  }
};

/**
 * Calculate skills match score between resource skills and project required skills
 * @param {Array} resourceSkills - Skills the resource has
 * @param {Array} projectSkills - Skills required for the project
 * @returns {number} - Match score between 0 and 1
 */
const calculateSkillsMatchScore = (resourceSkills, projectSkills) => {
  if (!resourceSkills || !projectSkills || resourceSkills.length === 0 || projectSkills.length === 0) {
    return 0;
  }
  
  // Create map of resource skills for quick lookup
  const resourceSkillMap = {};
  resourceSkills.forEach(skill => {
    resourceSkillMap[skill.SkillID] = skill;
  });
  
  // Count matched skills
  let matchedCount = 0;
  for (const projectSkill of projectSkills) {
    if (resourceSkillMap[projectSkill.SkillID]) {
      matchedCount++;
    }
  }
  
  // Calculate percentage of project skills matched
  return matchedCount / projectSkills.length;
};

/**
 * Check availability of resources for a specific period
 * @param {Array} resources - Resources to check
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Resources with availability scores
 */
const checkResourcesAvailability = async (resources, startDate, endDate) => {
  try {
    const pool = await poolPromise;
    const resourcesWithAvailability = [];
    
    for (const resource of resources) {
      // Get resource availability during period
      const availability = await getResourceAvailability(resource.id, startDate, endDate);
      
      // Calculate availability score (percentage of time available)
      const availabilityScore = calculateAvailabilityScore(availability, startDate, endDate);
      
      resourcesWithAvailability.push({
        ...resource,
        availability,
        availabilityScore
      });
    }
    
    return resourcesWithAvailability;
  } catch (error) {
    console.error('Error checking resources availability:', error);
    throw error;
  }
};

/**
 * Get resource availability for a specific period
 * @param {number} resourceId - Resource ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Availability data for the period
 */
const getResourceAvailability = async (resourceId, startDate, endDate) => {
  try {
    const pool = await poolPromise;
    
    // Convert dates to SQL parameters
    const sqlStartDate = startDate instanceof Date ? startDate : new Date(startDate);
    const sqlEndDate = endDate instanceof Date ? endDate : new Date(endDate);
    
    // Get allocations during this period
    const allocationsResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('startDate', sql.Date, sqlStartDate)
      .input('endDate', sql.Date, sqlEndDate)
      .query(`
        SELECT 
          a.AllocationID,
          a.ProjectID,
          p.Name AS ProjectName,
          a.StartDate,
          a.EndDate,
          a.Utilization
        FROM Allocations a
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.ResourceID = @resourceId
        AND (
          (a.StartDate <= @endDate AND a.EndDate >= @startDate) -- Overlaps with period
        )
        ORDER BY a.StartDate ASC
      `);
    
    // Get capacity information for this period
    const capacityResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          rc.Year,
          rc.Month,
          rc.AvailableCapacity,
          rc.PlannedTimeOff
        FROM ResourceCapacity rc
        WHERE rc.ResourceID = @resourceId
        AND (
          (rc.Year * 100 + rc.Month >= YEAR(@startDate) * 100 + MONTH(@startDate))
          AND 
          (rc.Year * 100 + rc.Month <= YEAR(@endDate) * 100 + MONTH(@endDate))
        )
        ORDER BY rc.Year, rc.Month
      `);
    
    // Combine allocation and capacity data
    return {
      allocations: allocationsResult.recordset,
      capacity: capacityResult.recordset,
      period: {
        startDate: sqlStartDate,
        endDate: sqlEndDate
      }
    };
  } catch (error) {
    console.error('Error getting resource availability:', error);
    throw error;
  }
};

/**
 * Calculate availability score based on allocations and capacity
 * @param {Object} availability - Availability data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Availability score between 0 and 1
 */
const calculateAvailabilityScore = (availability, startDate, endDate) => {
  const { allocations, capacity, period } = availability;
  
  // Convert dates to milliseconds for calculation
  const periodStart = period.startDate.getTime();
  const periodEnd = period.endDate.getTime();
  const periodDuration = periodEnd - periodStart;
  
  // If no period duration, return 0
  if (periodDuration <= 0) {
    return 0;
  }
  
  // Calculate average utilization during the period
  let totalUtilization = 0;
  
  // Process each day in the period
  for (let currentDate = new Date(periodStart); currentDate <= periodEnd; currentDate.setDate(currentDate.getDate() + 1)) {
    // Get all allocations active on this day
    const activeAllocations = allocations.filter(allocation => {
      const allocationStart = new Date(allocation.StartDate).getTime();
      const allocationEnd = new Date(allocation.EndDate).getTime();
      return currentDate >= allocationStart && currentDate <= allocationEnd;
    });
    
    // Sum up utilization for this day
    const dailyUtilization = activeAllocations.reduce((sum, allocation) => sum + allocation.Utilization, 0);
    totalUtilization += dailyUtilization;
  }
  
  // Calculate average utilization
  const daysInPeriod = Math.ceil(periodDuration / (24 * 60 * 60 * 1000));
  const averageUtilization = totalUtilization / daysInPeriod;
  
  // Calculate availability score (100% - average utilization%)
  return Math.max(0, (100 - averageUtilization) / 100);
};

/**
 * Calculate availability score for a project
 * @param {Object} availability - Resource availability data
 * @param {Date} projectStart - Project start date
 * @param {Date} projectEnd - Project end date
 * @returns {number} - Availability score between 0 and 1
 */
const calculateAvailabilityScoreForProject = (availability, projectStart, projectEnd) => {
  return calculateAvailabilityScore(availability, projectStart, projectEnd);
};

/**
 * Add resource project history and feedback data
 * @param {Array} resources - Resources to add history for
 * @returns {Promise<Array>} - Resources with history and feedback data
 */
const addResourceHistoryAndFeedback = async (resources) => {
  try {
    const resourcesWithHistory = [];
    
    for (const resource of resources) {
      // Get resource project history
      const history = await getResourceProjectHistory(resource.id);
      
      resourcesWithHistory.push({
        ...resource,
        projectHistory: history
      });
    }
    
    return resourcesWithHistory;
  } catch (error) {
    console.error('Error adding resource history and feedback:', error);
    throw error;
  }
};

/**
 * Get resource project history
 * @param {number} resourceId - Resource ID
 * @returns {Promise<Array>} - Project history data
 */
const getResourceProjectHistory = async (resourceId) => {
  try {
    const pool = await poolPromise;
    
    // Get completed allocations
    const historyResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .query(`
        SELECT 
          a.AllocationID,
          a.ProjectID,
          p.Name AS ProjectName,
          p.Client,
          p.Description,
          a.StartDate,
          a.EndDate,
          a.Utilization
        FROM Allocations a
        INNER JOIN Projects p ON a.ProjectID = p.ProjectID
        WHERE a.ResourceID = @resourceId
        AND a.EndDate < GETDATE() -- Only completed allocations
        ORDER BY a.EndDate DESC
      `);
    
    // Would add feedback data here if available
    // For now, return basic history with placeholder for feedback
    return historyResult.recordset.map(allocation => ({
      id: allocation.AllocationID,
      projectId: allocation.ProjectID,
      projectName: allocation.ProjectName,
      client: allocation.Client,
      description: allocation.Description,
      startDate: allocation.StartDate,
      endDate: allocation.EndDate,
      utilization: allocation.Utilization,
      feedback: null, // Placeholder for future feedback data
      duration: Math.ceil((new Date(allocation.EndDate) - new Date(allocation.StartDate)) / (24 * 60 * 60 * 1000))
    }));
  } catch (error) {
    console.error('Error getting resource project history:', error);
    throw error;
  }
};

/**
 * Add team compatibility data to projects
 * @param {Array} projects - Projects to add team data for
 * @param {number} resourceId - Resource ID to check compatibility with
 * @returns {Promise<Array>} - Projects with team compatibility data
 */
const addTeamCompatibilityData = async (projects, resourceId) => {
  try {
    const projectsWithTeamData = [];
    
    for (const project of projects) {
      // Get project team data
      const teamData = await getProjectTeamData(project.id);
      
      // Calculate team compatibility score
      const compatibility = calculateTeamCompatibilityWithResource(teamData, resourceId);
      
      projectsWithTeamData.push({
        ...project,
        teamData,
        teamCompatibilityScore: compatibility.score,
        previousCollaborations: compatibility.previousCollaborations
      });
    }
    
    return projectsWithTeamData;
  } catch (error) {
    console.error('Error adding team compatibility data:', error);
    throw error;
  }
};

/**
 * Get project team data
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - Team data
 */
const getProjectTeamData = async (projectId) => {
  try {
    const pool = await poolPromise;
    
    // Get current team members
    const teamResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          a.ResourceID,
          r.Name,
          r.Role,
          a.StartDate,
          a.EndDate,
          a.Utilization
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        WHERE a.ProjectID = @projectId
        AND a.EndDate >= GETDATE() -- Current team members
      `);
    
    return {
      members: teamResult.recordset,
      previousCollaborations: [] // Placeholder for collaboration history
    };
  } catch (error) {
    console.error('Error getting project team data:', error);
    throw error;
  }
};

/**
 * Calculate team compatibility with a resource
 * @param {Object} teamData - Team data
 * @param {number} resourceId - Resource ID
 * @returns {Object} - Compatibility score and data
 */
const calculateTeamCompatibilityWithResource = (teamData, resourceId) => {
  // In a real system, would check past collaborations and feedback
  // For now, return placeholder data
  const hasWorkedWith = teamData.members.some(member => member.ResourceID === resourceId);
  
  return {
    score: hasWorkedWith ? 0.8 : 0.5, // Prefer people who worked together before
    previousCollaborations: []
  };
};

/**
 * Calculate resource match scores
 * @param {Array} resources - Resources with data
 * @param {Object} project - Project details
 * @returns {Array} - Resources with overall match scores
 */
const calculateResourceMatchScores = (resources, project) => {
  return resources.map(resource => {
    // Base score weighting
    const weights = {
      skills: 0.4,
      availability: 0.3,
      experience: 0.2,
      teamCompatibility: 0.1
    };
    
    // Calculate experience score based on project history
    let experienceScore = 0;
    if (resource.projectHistory && resource.projectHistory.length > 0) {
      experienceScore = calculateExperienceScore(resource.projectHistory, project);
    }
    
    // Team compatibility score (placeholder for now)
    const teamCompatibilityScore = 0.5; // Medium compatibility by default
    
    // Calculate overall score
    const overallScore = (
      resource.skillsMatchScore * weights.skills + 
      resource.availabilityScore * weights.availability + 
      experienceScore * weights.experience + 
      teamCompatibilityScore * weights.teamCompatibility
    );
    
    return {
      resourceId: resource.id,
      resourceName: resource.name,
      projectId: project.id,
      projectName: project.name,
      skillsMatchScore: resource.skillsMatchScore,
      availabilityScore: resource.availabilityScore,
      experienceScore,
      teamCompatibilityScore,
      score: overallScore
    };
  });
};

/**
 * Calculate project match scores
 * @param {Array} projects - Projects with data
 * @param {Object} resource - Resource details
 * @returns {Array} - Projects with overall match scores
 */
const calculateProjectMatchScores = (projects, resource) => {
  return projects.map(project => {
    // Base score weighting
    const weights = {
      skills: 0.4,
      availability: 0.3,
      teamCompatibility: 0.3
    };
    
    // Calculate overall score
    const overallScore = (
      project.skillsMatchScore * weights.skills + 
      project.availabilityScore * weights.availability + 
      project.teamCompatibilityScore * weights.teamCompatibility
    );
    
    return {
      resourceId: resource.id,
      resourceName: resource.name,
      projectId: project.id,
      projectName: project.name,
      skillsMatchScore: project.skillsMatchScore,
      availabilityScore: project.availabilityScore,
      teamCompatibilityScore: project.teamCompatibilityScore,
      score: overallScore
    };
  });
};

/**
 * Calculate experience score based on project history
 * @param {Array} projectHistory - Resource's project history
 * @param {Object} targetProject - Target project
 * @returns {number} - Experience score between 0 and 1
 */
const calculateExperienceScore = (projectHistory, targetProject) => {
  if (!projectHistory || projectHistory.length === 0) {
    return 0;
  }
  
  // Check for similar projects in history (basic implementation)
  // In a real system, would use NLP to calculate semantic similarity
  let relevantExperience = 0;
  
  for (const pastProject of projectHistory) {
    // Simple keyword matching for now (would use more sophisticated techniques in production)
    const pastProjectKeywords = extractKeywords(pastProject.projectName + ' ' + (pastProject.description || ''));
    const targetProjectKeywords = extractKeywords(targetProject.name + ' ' + (targetProject.description || ''));
    
    const similarity = calculateKeywordSimilarity(pastProjectKeywords, targetProjectKeywords);
    
    // Weight by recency and duration
    const recencyFactor = calculateRecencyFactor(pastProject.endDate);
    const durationFactor = Math.min(1, pastProject.duration / 90); // Cap at 90 days
    
    relevantExperience += similarity * recencyFactor * durationFactor;
  }
  
  // Normalize to 0-1 range
  return Math.min(1, relevantExperience / 3); // Cap at 1
};

/**
 * Calculate recency factor for experience
 * @param {Date} endDate - End date of past project
 * @returns {number} - Recency factor between 0 and 1
 */
const calculateRecencyFactor = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const monthsAgo = (now - end) / (30 * 24 * 60 * 60 * 1000);
  
  // Recent projects get higher weight (exponential decay)
  return Math.exp(-0.1 * monthsAgo);
};

/**
 * Extract keywords from text
 * @param {string} text - Text to extract keywords from
 * @returns {Array} - Array of keywords
 */
const extractKeywords = (text) => {
  // Simple implementation - in real system would use NLP techniques
  if (!text) return [];
  
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
};

/**
 * Calculate keyword similarity between two sets
 * @param {Array} keywords1 - First set of keywords
 * @param {Array} keywords2 - Second set of keywords
 * @returns {number} - Similarity score between 0 and 1
 */
const calculateKeywordSimilarity = (keywords1, keywords2) => {
  if (!keywords1 || !keywords2 || keywords1.length === 0 || keywords2.length === 0) {
    return 0;
  }
  
  // Create sets for intersection
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  // Calculate intersection
  const intersection = new Set([...set1].filter(word => set2.has(word)));
  
  // Calculate Jaccard similarity
  return intersection.size / (set1.size + set2.size - intersection.size);
};

/**
 * Use Claude AI to enhance match scores
 * @param {Array} matches - Matches to enhance
 * @param {Object} context - Resource or project details
 * @param {string} matchType - Type of match ('project_to_resources', 'resource_to_projects', 'single_match')
 * @returns {Promise<Array>} - Enhanced matches with AI insights
 */
const enhanceMatchesWithAI = async (matches, context, matchType) => {
  // Skip AI enhancement if no Claude API key
  if (!CLAUDE_API_KEY || !claude) {
    console.warn('Claude API key not configured. Skipping AI enhancement of matches.');
    return matches;
  }
  
  try {
    // Batch matches to send to Claude (to reduce API calls)
    const enhancedMatches = [...matches];
    
    // For single or small batches, process all at once
    if (matches.length <= 3) {
      const aiMatches = await processAIMatchBatch(matches, context, matchType);
      for (let i = 0; i < matches.length; i++) {
        if (aiMatches[i]) {
          enhancedMatches[i] = {
            ...matches[i],
            ...aiMatches[i]
          };
        }
      }
    } else {
      // For larger sets, process in batches of 3
      for (let i = 0; i < matches.length; i += 3) {
        const batch = matches.slice(i, i + 3);
        const aiMatches = await processAIMatchBatch(batch, context, matchType);
        
        for (let j = 0; j < batch.length; j++) {
          if (aiMatches[j]) {
            enhancedMatches[i + j] = {
              ...matches[i + j],
              ...aiMatches[j]
            };
          }
        }
      }
    }
    
    return enhancedMatches;
  } catch (error) {
    console.error('Error enhancing matches with AI:', error);
    // If AI enhancement fails, return original matches
    return matches;
  }
};

/**
 * Process a batch of matches with Claude AI
 * @param {Array} matches - Batch of matches to process
 * @param {Object} context - Resource or project context
 * @param {string} matchType - Type of match
 * @returns {Promise<Array>} - AI-enhanced matches
 */
const processAIMatchBatch = async (matches, context, matchType) => {
  if (!matches || matches.length === 0) {
    return [];
  }
  
  try {
    // Create prompt for Claude
    let prompt = `
<instructions>
You are an expert AI resource allocation system analyzing potential matches between resources (employees) and projects. Based on the data provided, evaluate each match and enhance the scoring with deeper insights.

For each match, analyze:
1. Skills alignment: How well do the resource's skills align with project requirements beyond simple keyword matching?
2. Prior experience relevance: How relevant is the resource's past experience to this project?
3. Team compatibility: How well would this resource work with the existing team?
4. Workload balance: Would this allocation create a balanced workload?
5. Development opportunity: Would this project provide growth opportunities for the resource?

For each match, provide:
- An adjusted score (number between 0-1, up to 2 decimal places)
- A brief reasoning (2-3 sentences)
- Key strengths (2-3 bullet points)
- Potential concerns (1-2 bullet points)

Return the response as a JSON array where each object represents a match:
[
  {
    "matchId": number,
    "aiScore": number,
    "reasoning": "string",
    "strengths": ["string", "string"],
    "concerns": ["string"]
  }
]
</instructions>
`;

    // Add details based on match type
    switch (matchType) {
      case 'project_to_resources':
        prompt += `
<project_context>
Project ID: ${context.id}
Project Name: ${context.name}
Client: ${context.client}
Description: ${context.description || 'N/A'}
Required Skills: ${context.skills.map(s => s.Name).join(', ')}
</project_context>

<matches>
${matches.map((match, index) => `
Match ID: ${index}
Resource: ${match.resourceName}
Skills Match Score: ${(match.skillsMatchScore * 100).toFixed(1)}%
Availability Score: ${(match.availabilityScore * 100).toFixed(1)}%
Experience Score: ${(match.experienceScore * 100).toFixed(1)}%
Team Compatibility: ${(match.teamCompatibilityScore * 100).toFixed(1)}%
Overall Score: ${(match.score * 100).toFixed(1)}%
`).join('\n')}
</matches>
`;
        break;
        
      case 'resource_to_projects':
        prompt += `
<resource_context>
Resource ID: ${context.id}
Resource Name: ${context.name}
Role: ${context.role}
Skills: ${context.skills.map(s => s.Name).join(', ')}
</resource_context>

<matches>
${matches.map((match, index) => `
Match ID: ${index}
Project: ${match.projectName}
Skills Match Score: ${(match.skillsMatchScore * 100).toFixed(1)}%
Availability Score: ${(match.availabilityScore * 100).toFixed(1)}%
Team Compatibility: ${(match.teamCompatibilityScore * 100).toFixed(1)}%
Overall Score: ${(match.score * 100).toFixed(1)}%
`).join('\n')}
</matches>
`;
        break;
        
      case 'single_match':
        prompt += `
<match_details>
Resource: ${matches[0].resourceName}
Project: ${matches[0].projectName}
Skills Match Score: ${(matches[0].skillsMatchScore * 100).toFixed(1)}%
Availability Score: ${(matches[0].availabilityScore * 100).toFixed(1)}%
Experience Score: ${(matches[0].experienceScore * 100).toFixed(1)}%
Team Compatibility: ${(matches[0].teamCompatibilityScore * 100).toFixed(1)}%
Overall Score: ${(matches[0].score * 100).toFixed(1)}%

Skills Match Details:
- Resource skills: ${context.skills.map(s => s.Name).join(', ')}
- Project requires: ${matches[0].details.skills.project.map(s => s.Name).join(', ')}
- Match percentage: ${matches[0].details.skills.matchPercentage.toFixed(1)}%

Availability Details:
- Required period: ${new Date(matches[0].details.availability.requiredPeriod.start).toLocaleDateString()} to ${new Date(matches[0].details.availability.requiredPeriod.end).toLocaleDateString()}
- Availability percentage: ${matches[0].details.availability.availabilityPercentage.toFixed(1)}%

Experience Details:
${matches[0].details.experience.relevantProjects.length > 0 
  ? matches[0].details.experience.relevantProjects.map(p => 
      `- ${p.projectName} (Relevance: ${(p.relevanceScore * 100).toFixed(1)}%)`).join('\n')
  : '- No relevant prior experience'
}

Team Compatibility:
- Compatibility score: ${matches[0].details.teamCompatibility.score.toFixed(1)}%
- Previous collaborations: ${matches[0].details.teamCompatibility.previousCollaborations.length || 0}
</match_details>
`;
        break;
    }
    
    // Create request
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
    
    // Process and parse response
    const responseText = response.content[0].text.trim();
    try {
      const aiMatches = JSON.parse(responseText);
      return aiMatches.map(aiMatch => ({
        aiScore: aiMatch.aiScore,
        aiReasoning: aiMatch.reasoning,
        strengths: aiMatch.strengths,
        concerns: aiMatch.concerns
      }));
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return matches.map(() => null);
    }
  } catch (error) {
    console.error('Error processing AI match batch:', error);
    return matches.map(() => null);
  }
};

/**
 * Get resource allocations based on various filter criteria
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} - Filtered allocations
 */
const getResourceAllocations = async (options = {}) => {
  try {
    const {
      resourceId,
      projectId,
      startDate,
      endDate,
      status
    } = options;
    
    const pool = await poolPromise;
    let query = `
      SELECT 
        a.AllocationID,
        a.ResourceID,
        r.Name AS ResourceName,
        r.Role AS ResourceRole,
        a.ProjectID,
        p.Name AS ProjectName,
        p.Client,
        a.StartDate,
        a.EndDate,
        a.Utilization,
        a.Notes
      FROM Allocations a
      INNER JOIN Resources r ON a.ResourceID = r.ResourceID
      INNER JOIN Projects p ON a.ProjectID = p.ProjectID
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters
    if (resourceId) {
      query += ` AND a.ResourceID = @resourceId`;
      queryParams.push({ name: 'resourceId', type: sql.Int, value: resourceId });
    }
    
    if (projectId) {
      query += ` AND a.ProjectID = @projectId`;
      queryParams.push({ name: 'projectId', type: sql.Int, value: projectId });
    }
    
    if (startDate) {
      query += ` AND a.EndDate >= @startDate`;
      queryParams.push({ name: 'startDate', type: sql.Date, value: new Date(startDate) });
    }
    
    if (endDate) {
      query += ` AND a.StartDate <= @endDate`;
      queryParams.push({ name: 'endDate', type: sql.Date, value: new Date(endDate) });
    }
    
    if (status) {
      if (status === 'current') {
        query += ` AND GETDATE() BETWEEN a.StartDate AND a.EndDate`;
      } else if (status === 'future') {
        query += ` AND a.StartDate > GETDATE()`;
      } else if (status === 'past') {
        query += ` AND a.EndDate < GETDATE()`;
      }
    }
    
    query += ` ORDER BY a.StartDate ASC`;
    
    // Execute query with parameters
    const request = pool.request();
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error getting resource allocations:', error);
    throw error;
  }
};

module.exports = {
  findBestMatches,
  findResourcesForProject,
  findProjectsForResource,
  getSingleMatchScore,
  getResourceAllocations
};
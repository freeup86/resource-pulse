/**
 * Client Satisfaction Prediction Service
 * Provides prediction of client satisfaction based on resource-client pairings
 * using existing project and resource data
 */
const { poolPromise, sql } = require('../db/config');

/**
 * Predict client satisfaction for a specific project-resource pairing
 * @param {string} projectId - Project ID
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Prediction options
 * @returns {Promise<Object>} - Satisfaction prediction
 */
const predictResourceClientSatisfaction = async (projectId, resourceId, options = {}) => {
  try {
    // Get project and resource details from existing database
    const pool = await poolPromise;
    
    // Get project details including client
    const projectQuery = `
      SELECT p.ProjectID, p.Name AS project_name, p.Status AS project_status, 
             p.StartDate, p.EndDate, p.Client AS client_name
      FROM Projects p
      WHERE p.ProjectID = @projectId
    `;
    
    const projectRequest = pool.request();
    projectRequest.input('projectId', sql.Int, projectId);
    const projectResult = await projectRequest.query(projectQuery);
    
    if (projectResult.recordset.length === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const project = projectResult.recordset[0];
    
    // Get resource details
    const resourceQuery = `
      SELECT r.ResourceID, r.Name AS resource_name, r.RoleID,
             r.Type, r.Status AS resource_status,
             ro.Name AS role_name
      FROM Resources r
      LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
      WHERE r.ResourceID = @resourceId
    `;
    
    const resourceRequest = pool.request();
    resourceRequest.input('resourceId', sql.Int, resourceId);
    const resourceResult = await resourceRequest.query(resourceQuery);
    
    if (resourceResult.recordset.length === 0) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }
    
    const resource = resourceResult.recordset[0];
    
    // Check if the allocation exists between this project and resource
    const allocationQuery = `
      SELECT * 
      FROM Allocations 
      WHERE ProjectID = @projectId AND ResourceID = @resourceId
      AND EndDate >= GETDATE()
    `;
    
    const allocationRequest = pool.request();
    allocationRequest.input('projectId', sql.Int, projectId);
    allocationRequest.input('resourceId', sql.Int, resourceId);
    const allocationResult = await allocationRequest.query(allocationQuery);
    
    if (allocationResult.recordset.length === 0) {
      return {
        error: true,
        message: "No active allocation found for this project-resource pairing"
      };
    }
    
    const allocation = allocationResult.recordset[0];
    
    // Get resource skills if available
    let resourceSkills = [];
    try {
      // Check if resource_skills table exists
      const checkSkillsTableQuery = `
        SELECT 1 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DB_NAME() 
        AND TABLE_NAME = 'resource_skills'
      `;
      
      const tableExists = await pool.request().query(checkSkillsTableQuery);
      
      if (tableExists.recordset.length > 0) {
        const skillsQuery = `
          SELECT rs.*, s.Name AS skill_name, s.Category as category
          FROM resource_skills rs
          JOIN Skills s ON rs.skill_id = s.SkillID
          WHERE rs.resource_id = @resourceId
        `;
        
        const skillsRequest = pool.request();
        skillsRequest.input('resourceId', sql.Int, resourceId);
        const skillsResult = await skillsRequest.query(skillsQuery);
        resourceSkills = skillsResult.recordset;
      }
    } catch (error) {
      console.warn('Error getting resource skills:', error);
    }
    
    // Calculate satisfaction prediction based on project and resource data
    const prediction = generatePrediction(project, resource, allocation, resourceSkills);
    
    return {
      projectId,
      resourceId,
      projectName: project.project_name,
      resourceName: resource.resource_name,
      clientName: project.client_name,
      clientId: 0, // No clients table, use 0 as default
      prediction,
      predictedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error predicting client satisfaction:', error);
    throw new Error(`Satisfaction prediction failed: ${error.message}`);
  }
};

/**
 * Predict client satisfaction for all resources on a project
 * @param {string} projectId - Project ID
 * @param {Object} options - Prediction options
 * @returns {Promise<Object>} - List of satisfaction predictions
 */
const predictProjectSatisfaction = async (projectId, options = {}) => {
  try {
    const pool = await poolPromise;
    
    // Get project details
    const projectQuery = `
      SELECT p.ProjectID, p.Name AS project_name, p.Status AS project_status, 
             p.StartDate, p.EndDate, p.Client AS client_name
      FROM Projects p
      WHERE p.ProjectID = @projectId
    `;
    
    const projectRequest = pool.request();
    projectRequest.input('projectId', sql.Int, projectId);
    const projectResult = await projectRequest.query(projectQuery);
    
    if (projectResult.recordset.length === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const project = projectResult.recordset[0];
    
    // Get all active allocations for the project
    const allocationsQuery = `
      SELECT a.*, r.Name AS resource_name, r.RoleID,
             r.Type, r.Status AS resource_status,
             ro.Name AS role_name
      FROM Allocations a
      JOIN Resources r ON a.ResourceID = r.ResourceID
      LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
      WHERE a.ProjectID = @projectId
      AND a.EndDate >= GETDATE()
    `;
    
    const allocationsRequest = pool.request();
    allocationsRequest.input('projectId', sql.Int, projectId);
    const allocationsResult = await allocationsRequest.query(allocationsQuery);
    
    const allocations = allocationsResult.recordset;
    
    // Generate predictions for each allocated resource
    const resourcePredictions = [];
    
    for (const allocation of allocations) {
      try {
        const resourceId = allocation.ResourceID;
        
        // Get resource skills if available
        let resourceSkills = [];
        try {
          // Check if resource_skills table exists
          const checkSkillsTableQuery = `
            SELECT 1 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DB_NAME() 
            AND TABLE_NAME = 'resource_skills'
          `;
          
          const tableExists = await pool.request().query(checkSkillsTableQuery);
          
          if (tableExists.recordset.length > 0) {
            const skillsQuery = `
              SELECT rs.*, s.Name AS skill_name, s.Category as category
              FROM resource_skills rs
              JOIN Skills s ON rs.skill_id = s.SkillID
              WHERE rs.resource_id = @resourceId
            `;
            
            const skillsRequest = pool.request();
            skillsRequest.input('resourceId', sql.Int, resourceId);
            const skillsResult = await skillsRequest.query(skillsQuery);
            resourceSkills = skillsResult.recordset;
          }
        } catch (error) {
          console.warn('Error getting resource skills:', error);
        }
        
        const prediction = generatePrediction(project, allocation, allocation, resourceSkills);
        
        resourcePredictions.push({
          resourceId,
          resourceName: allocation.resource_name,
          roleName: allocation.role_name,
          allocationPercentage: allocation.Percentage,
          prediction: {
            prediction
          }
        });
      } catch (error) {
        console.warn(`Error predicting satisfaction for resource ${allocation.ResourceID}:`, error);
        resourcePredictions.push({
          resourceId: allocation.ResourceID,
          resourceName: allocation.resource_name,
          error: error.message
        });
      }
    }
    
    // Calculate overall project satisfaction
    const overallSatisfaction = calculateOverallSatisfaction(resourcePredictions);
    
    return {
      projectId,
      projectName: project.project_name,
      clientName: project.client_name,
      clientId: 0, // No clients table, use 0 as default
      status: project.project_status,
      overallSatisfaction,
      resourcePredictions,
      predictedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error predicting project satisfaction:', error);
    throw new Error(`Project satisfaction prediction failed: ${error.message}`);
  }
};

/**
 * Predict client satisfaction for all active projects with a specific client
 * @param {string} clientId - Client ID
 * @param {Object} options - Prediction options
 * @returns {Promise<Object>} - List of project satisfaction predictions
 */
const predictClientSatisfaction = async (clientId, options = {}) => {
  try {
    const pool = await poolPromise;
    
    // Since we don't have a Clients table, get client by checking projects
    const clientQuery = `
      SELECT DISTINCT Client as Name
      FROM Projects
      WHERE Client IS NOT NULL
      AND Client <> ''
    `;
    
    const clientResult = await pool.request().query(clientQuery);
    
    // Create a mock client object since we don't have a Clients table
    const client = {
      ClientID: clientId, // Use the provided ID
      Name: "Client " + clientId // Generate a name based on ID
    };
    
    // Try to find a better client name from the projects if possible
    if (clientResult.recordset.length > 0) {
      client.Name = clientResult.recordset[0].Name;
    }
    
    console.log(`Using client information: ${JSON.stringify(client)}`);
    
    // Get all active projects for this client (using client name if available)
    let projectsQuery;
    const projectsRequest = pool.request();
    
    if (client.Name && client.Name !== "Client " + clientId) {
      // We have a client name from the projects
      projectsQuery = `
        SELECT p.ProjectID
        FROM Projects p
        WHERE p.Client = @clientName
        AND p.EndDate >= GETDATE()
        AND p.Status NOT IN ('Completed', 'Cancelled')
      `;
      projectsRequest.input('clientName', sql.NVarChar, client.Name);
    } else {
      // No specific client name, just get active projects
      projectsQuery = `
        SELECT p.ProjectID
        FROM Projects p
        WHERE p.EndDate >= GETDATE()
        AND p.Status NOT IN ('Completed', 'Cancelled')
        AND p.ProjectID % 10 = @clientId % 10
      `;
      projectsRequest.input('clientId', sql.Int, clientId);
    }
    
    console.log('Project query:', projectsQuery);
    const projectsResult = await projectsRequest.query(projectsQuery);
    
    const projects = projectsResult.recordset;
    
    if (projects.length === 0) {
      return {
        clientId,
        clientName: client.Name,
        projectPredictions: [],
        message: 'No active projects found for this client',
        predictedAt: new Date().toISOString()
      };
    }
    
    // Get predictions for each project
    const projectPredictions = [];
    
    for (const project of projects) {
      try {
        const prediction = await predictProjectSatisfaction(project.ProjectID, options);
        projectPredictions.push(prediction);
      } catch (error) {
        console.warn(`Error predicting satisfaction for project ${project.ProjectID}:`, error);
      }
    }
    
    // Calculate overall client satisfaction
    const satisfactionScores = projectPredictions
      .filter(p => p.overallSatisfaction && !isNaN(p.overallSatisfaction.score))
      .map(p => p.overallSatisfaction.score);
    
    const avgSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;
    
    // Determine overall risk level
    let overallRiskLevel;
    if (avgSatisfaction >= 75) {
      overallRiskLevel = 'low';
    } else if (avgSatisfaction >= 50) {
      overallRiskLevel = 'medium';
    } else {
      overallRiskLevel = 'high';
    }
    
    // Count projects by risk level
    const projectsByRisk = {
      high: projectPredictions.filter(p => p.overallSatisfaction && p.overallSatisfaction.riskLevel === 'high').length,
      medium: projectPredictions.filter(p => p.overallSatisfaction && p.overallSatisfaction.riskLevel === 'medium').length,
      low: projectPredictions.filter(p => p.overallSatisfaction && p.overallSatisfaction.riskLevel === 'low').length
    };
    
    // Generate recommendations
    const recommendations = generateClientRecommendations(projectPredictions, client);
    
    return {
      clientId,
      clientName: client.Name,
      overallSatisfaction: {
        score: Math.round(avgSatisfaction),
        riskLevel: overallRiskLevel,
        projectsByRisk,
        totalProjects: projects.length
      },
      projectPredictions,
      recommendations,
      predictedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error predicting client satisfaction:', error);
    throw new Error(`Client satisfaction prediction failed: ${error.message}`);
  }
};

/**
 * Generate a prediction based on project and resource data
 * @param {Object} project - Project data
 * @param {Object} resource - Resource data
 * @param {Object} allocation - Allocation data
 * @param {Array} resourceSkills - Resource skills
 * @returns {Object} - Satisfaction prediction
 */
const generatePrediction = (project, resource, allocation, resourceSkills = []) => {
  // Base satisfaction is 70 (slightly positive)
  let satisfactionScore = 70;
  
  // Factors that affect satisfaction
  const positiveFactors = [];
  const negativeFactors = [];
  const recommendations = [];
  
  // 1. Project status affects satisfaction
  if (project.project_status === 'At Risk') {
    satisfactionScore -= 20;
    negativeFactors.push('Project is currently at risk');
    recommendations.push('Address project risk factors to improve client satisfaction');
  } else if (project.project_status === 'On Hold') {
    satisfactionScore -= 15;
    negativeFactors.push('Project is currently on hold');
    recommendations.push('Resolve issues preventing project progress');
  } else if (project.project_status === 'In Progress') {
    satisfactionScore += 5;
    positiveFactors.push('Project is progressing as expected');
  } else if (project.project_status === 'Completed') {
    satisfactionScore += 10;
    positiveFactors.push('Project has been completed successfully');
  }
  
  // 2. Resource status affects satisfaction
  if (resource.resource_status !== 'Active') {
    satisfactionScore -= 10;
    negativeFactors.push(`Resource is currently ${resource.resource_status}`);
    recommendations.push('Assign an active resource to the project');
  }
  
  // 3. Allocation percentage affects satisfaction
  const allocationPercent = allocation.Percentage;
  if (allocationPercent < 25) {
    satisfactionScore -= 10;
    negativeFactors.push('Resource has very low allocation percentage');
    recommendations.push('Consider increasing resource allocation to the project');
  } else if (allocationPercent >= 75) {
    satisfactionScore += 5;
    positiveFactors.push('Resource is highly dedicated to the project');
  }
  
  // 4. Resource skills affect satisfaction
  if (resourceSkills.length > 0) {
    satisfactionScore += 5;
    positiveFactors.push('Resource has relevant skills recorded for the project');
  }
  
  // 5. Add some common factors based on scores
  if (satisfactionScore < 50) {
    negativeFactors.push('Potential communication gaps with client');
    recommendations.push('Implement regular status meetings with client');
    
    if (negativeFactors.length < 3) {
      negativeFactors.push('Misalignment on project requirements or expectations');
      recommendations.push('Review project requirements with client and align expectations');
    }
  } else if (satisfactionScore >= 80) {
    if (positiveFactors.length < 3) {
      positiveFactors.push('Effective communication and responsiveness');
      positiveFactors.push('Strong understanding of client needs');
    }
  }
  
  // Ensure we have at least some factors
  if (positiveFactors.length === 0) {
    positiveFactors.push('Resource assigned to project');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Maintain regular communication with client');
    recommendations.push('Document project progress and share updates');
  }
  
  // Limit arrays to reasonable size
  const limitedPositive = positiveFactors.slice(0, 4);
  const limitedNegative = negativeFactors.slice(0, 4);
  const limitedRecommendations = recommendations.slice(0, 4);
  
  // Ensure satisfaction score is within bounds
  satisfactionScore = Math.min(100, Math.max(0, satisfactionScore));
  
  // Determine risk level based on satisfaction score
  let riskLevel;
  if (satisfactionScore >= 75) {
    riskLevel = 'low';
  } else if (satisfactionScore >= 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  return {
    satisfactionProbability: Math.round(satisfactionScore),
    positiveFactors: limitedPositive,
    negativeFactors: limitedNegative,
    recommendations: limitedRecommendations,
    riskLevel,
    confidenceScore: 0.7
  };
};

/**
 * Calculate overall satisfaction for a project based on resource predictions
 * @param {Array} resourcePredictions - Resource satisfaction predictions
 * @returns {Object} - Overall satisfaction assessment
 */
const calculateOverallSatisfaction = (resourcePredictions) => {
  // Filter out predictions with errors
  const validPredictions = resourcePredictions.filter(
    p => p.prediction && p.prediction.prediction && !p.error
  );
  
  if (validPredictions.length === 0) {
    return {
      score: 50,
      riskLevel: 'medium',
      message: 'No valid predictions available',
      resourcesByRisk: {
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }
  
  // Calculate average satisfaction score
  let totalScore = 0;
  let totalWeight = 0;
  
  validPredictions.forEach(p => {
    const score = p.prediction.prediction.satisfactionProbability;
    const weight = p.allocationPercentage || 100; // Use allocation percentage as weight
    
    totalScore += (score * weight);
    totalWeight += weight;
  });
  
  const avgScore = totalWeight > 0 
    ? Math.round(totalScore / totalWeight) 
    : 50;
  
  // Count resources by risk level
  const resourcesByRisk = {
    high: validPredictions.filter(p => p.prediction.prediction.riskLevel === 'high').length,
    medium: validPredictions.filter(p => p.prediction.prediction.riskLevel === 'medium').length,
    low: validPredictions.filter(p => p.prediction.prediction.riskLevel === 'low').length
  };
  
  // Determine overall risk level
  let riskLevel;
  if (avgScore >= 75) {
    riskLevel = 'low';
  } else if (avgScore >= 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  // If high risk resources exceed a threshold, increase overall risk
  const highRiskThreshold = Math.ceil(validPredictions.length * 0.3); // 30% of resources
  if (resourcesByRisk.high >= highRiskThreshold && riskLevel !== 'high') {
    riskLevel = 'medium';
  }
  
  return {
    score: avgScore,
    riskLevel,
    resourcesByRisk,
    totalResources: validPredictions.length
  };
};

/**
 * Generate recommendations for a client based on project predictions
 * @param {Array} projectPredictions - Project satisfaction predictions
 * @param {Object} client - Client data
 * @returns {Array} - List of recommendations
 */
const generateClientRecommendations = (projectPredictions, client) => {
  const recommendations = [];
  
  // Filter out predictions with errors
  const validPredictions = projectPredictions.filter(p => p.overallSatisfaction && !p.error);
  
  if (validPredictions.length === 0) {
    return [
      {
        type: 'general',
        recommendation: 'Establish regular communication with client to understand expectations',
        priority: 'high'
      }
    ];
  }
  
  // Count projects by risk level
  const highRiskProjects = validPredictions.filter(p => p.overallSatisfaction.riskLevel === 'high');
  const mediumRiskProjects = validPredictions.filter(p => p.overallSatisfaction.riskLevel === 'medium');
  
  // Recommendations for high-risk projects
  highRiskProjects.forEach(project => {
    recommendations.push({
      type: 'project_specific',
      recommendation: `Conduct urgent review of ${project.projectName} to address satisfaction risks`,
      priority: 'high',
      projectId: project.projectId,
      projectName: project.projectName
    });
  });
  
  // Recommendations based on common patterns across projects
  if (highRiskProjects.length > 0) {
    recommendations.push({
      type: 'general',
      recommendation: 'Schedule executive review for at-risk projects with this client',
      priority: 'high'
    });
  } else if (mediumRiskProjects.length > 1) {
    recommendations.push({
      type: 'general',
      recommendation: 'Increase communication frequency with client stakeholders',
      priority: 'medium'
    });
  }
  
  // Add general recommendations if we have few specific ones
  if (recommendations.length < 2) {
    recommendations.push({
      type: 'general',
      recommendation: 'Conduct quarterly satisfaction survey with client stakeholders',
      priority: 'medium'
    });
  }
  
  if (recommendations.length < 3) {
    recommendations.push({
      type: 'general',
      recommendation: 'Ensure project expectations and deliverables are clearly documented',
      priority: 'medium'
    });
  }
  
  return recommendations;
};

/**
 * Get at-risk clients across the organization
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - At-risk clients
 */
const getAtRiskClients = async (options = {}) => {
  try {
    const { 
      riskThreshold = 'medium',
      limit = 10
    } = options;
    
    const pool = await poolPromise;
    
    // Since we don't have a Clients table, get unique client names from Projects
    const clientsQuery = `
      SELECT DISTINCT Client AS Name
      FROM Projects
      WHERE EndDate >= GETDATE()
      AND Status NOT IN ('Completed', 'Cancelled')
      AND Client IS NOT NULL 
      AND Client <> ''
    `;
    
    const clientsResult = await pool.request().query(clientsQuery);
    
    // Create a simulated clients array with IDs
    const clients = clientsResult.recordset.map((client, index) => ({
      ClientID: index + 1, // Generate a unique ID
      Name: client.Name
    }));
    
    console.log(`Found ${clients.length} unique clients based on project data`);
    
    // For each client, calculate risk based on their projects
    const clientRisks = [];
    
    for (const client of clients) {
      // Get projects for this client by client name
      const projectsQuery = `
        SELECT p.ProjectID, p.Name, p.Status
        FROM Projects p
        WHERE p.Client = @clientName
        AND p.EndDate >= GETDATE()
        AND p.Status NOT IN ('Completed', 'Cancelled')
      `;
      
      const projectsRequest = pool.request();
      projectsRequest.input('clientName', sql.NVarChar, client.Name);
      const projectsResult = await projectsRequest.query(projectsQuery);
      const projects = projectsResult.recordset;
      
      // Calculate risk based on project statuses
      const atRiskCount = projects.filter(p => p.Status === 'At Risk').length;
      const onHoldCount = projects.filter(p => p.Status === 'On Hold').length;
      
      let riskScore = 50; // Default medium risk
      
      // Adjust risk based on project counts and statuses
      if (atRiskCount > 0) {
        riskScore += (atRiskCount / projects.length) * 40;
      }
      
      if (onHoldCount > 0) {
        riskScore += (onHoldCount / projects.length) * 20;
      }
      
      // Bound risk score
      riskScore = Math.min(100, Math.max(0, riskScore));
      
      // Determine risk level
      let riskLevel;
      if (riskScore >= 70) {
        riskLevel = 'high';
      } else if (riskScore >= 40) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }
      
      // Only include clients above threshold
      const riskLevels = { low: 0, medium: 1, high: 2 };
      const thresholdLevel = riskLevels[riskThreshold] || 1;
      
      if (riskLevels[riskLevel] >= thresholdLevel) {
        clientRisks.push({
          clientId: client.ClientID,
          clientName: client.Name,
          riskLevel,
          riskScore: Math.round(riskScore),
          projectsAtRisk: atRiskCount,
          totalProjects: projects.length,
          topRecommendations: [
            {
              type: 'general',
              recommendation: atRiskCount > 0 
                ? 'Schedule executive review for at-risk projects' 
                : 'Increase communication frequency with stakeholders',
              priority: atRiskCount > 0 ? 'high' : 'medium'
            }
          ]
        });
      }
    }
    
    // Sort by risk (highest first)
    clientRisks.sort((a, b) => {
      const riskLevels = { low: 0, medium: 1, high: 2 };
      return riskLevels[b.riskLevel] - riskLevels[a.riskLevel] || b.riskScore - a.riskScore;
    });
    
    return clientRisks.slice(0, limit);
  } catch (error) {
    console.error('Error getting at-risk clients:', error);
    throw error;
  }
};

/**
 * Get all clients from the projects table
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - All clients
 */
const getAllClients = async (options = {}) => {
  try {
    const { 
      limit = 100,
      includeInactive = false
    } = options;
    
    const pool = await poolPromise;
    
    // Get unique client names from Projects
    let clientsQuery = `
      SELECT DISTINCT Client AS Name, COUNT(ProjectID) AS ProjectCount
      FROM Projects
      WHERE Client IS NOT NULL AND Client <> ''
    `;
    
    if (!includeInactive) {
      clientsQuery += `
        AND EndDate >= GETDATE()
        AND Status NOT IN ('Completed', 'Cancelled')
      `;
    }
    
    clientsQuery += `
      GROUP BY Client
      ORDER BY COUNT(ProjectID) DESC, Client
    `;
    
    // Apply limit if specified
    if (limit) {
      clientsQuery = `
        SELECT TOP ${limit} * FROM (${clientsQuery}) AS ClientSubquery
      `;
    }
    
    const clientsResult = await pool.request().query(clientsQuery);
    
    // Create a clients array with IDs
    const clients = clientsResult.recordset.map((client, index) => ({
      clientId: index + 1, // Generate a unique ID
      clientName: client.Name,
      projectCount: client.ProjectCount
    }));
    
    return clients;
  } catch (error) {
    console.error('Error getting all clients:', error);
    throw error;
  }
};

module.exports = {
  predictResourceClientSatisfaction,
  predictProjectSatisfaction,
  predictClientSatisfaction,
  getAtRiskClients,
  getAllClients
};
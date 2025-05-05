/**
 * Mock Client Satisfaction Prediction Service for testing
 * Provides mock data for testing endpoints
 */

/**
 * Predict client satisfaction for a specific project-resource pairing
 * @param {string} projectId - Project ID
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Prediction options
 * @returns {Promise<Object>} - Satisfaction prediction
 */
const predictResourceClientSatisfaction = async (projectId, resourceId, options = {}) => {
  return {
    projectId,
    resourceId,
    clientId: 1,
    projectName: `Project ${projectId}`,
    resourceName: `Resource ${resourceId}`,
    clientName: "Sample Client",
    prediction: {
      satisfactionProbability: 78,
      positiveFactors: [
        "Strong communication skills",
        "Previous experience with client",
        "Technical skills match project requirements"
      ],
      negativeFactors: [
        "Limited availability due to other projects",
        "Previous project delays"
      ],
      recommendations: [
        "Schedule regular check-ins",
        "Provide additional technical support"
      ],
      riskLevel: "medium",
      confidenceScore: 0.85,
      aiGenerated: false
    },
    predictedAt: new Date().toISOString()
  };
};

/**
 * Predict client satisfaction for all resources on a project
 * @param {string} projectId - Project ID
 * @param {Object} options - Prediction options
 * @returns {Promise<Array>} - List of satisfaction predictions
 */
const predictProjectSatisfaction = async (projectId, options = {}) => {
  // Create sample resources
  const resourceIds = [1, 2, 3];
  const resourcePredictions = [];
  
  // Generate predictions for each resource
  for (const resourceId of resourceIds) {
    const prediction = await predictResourceClientSatisfaction(projectId, resourceId, options);
    resourcePredictions.push(prediction);
  }
  
  return {
    projectId,
    projectName: `Project ${projectId}`,
    clientId: 1,
    clientName: "Sample Client",
    overallSatisfactionRisk: {
      riskLevel: "medium",
      riskScore: 35,
      confidenceScore: 0.8,
      resourcesAtRisk: 1,
      totalResources: 3
    },
    resourcePredictions,
    predictedAt: new Date().toISOString()
  };
};

/**
 * Predict client satisfaction for all active projects with a specific client
 * @param {string} clientId - Client ID
 * @param {Object} options - Prediction options
 * @returns {Promise<Array>} - List of project satisfaction predictions
 */
const predictClientSatisfaction = async (clientId, options = {}) => {
  // Create sample projects
  const projectIds = [1, 2];
  const projectPredictions = [];
  
  // Generate predictions for each project
  for (const projectId of projectIds) {
    const prediction = await predictProjectSatisfaction(projectId, options);
    projectPredictions.push(prediction);
  }
  
  return {
    clientId,
    clientName: "Sample Client",
    overallSatisfactionRisk: {
      riskLevel: "medium",
      riskScore: 40,
      confidenceScore: 0.75,
      projectsAtRisk: 1,
      totalProjects: 2
    },
    projectPredictions,
    recommendations: [
      {
        type: "cross_project",
        recommendation: "Improve communication frequency across all projects",
        priority: "high",
        affectedProjects: ["Project 1", "Project 2"],
        theme: "communication"
      },
      {
        type: "project_specific",
        recommendation: "Conduct urgent review of Project 1 to address satisfaction risks",
        priority: "high",
        projectId: 1,
        projectName: "Project 1"
      }
    ],
    predictedAt: new Date().toISOString()
  };
};

/**
 * Get at-risk clients across the organization
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - At-risk clients
 */
const getAtRiskClients = async (options = {}) => {
  return [
    {
      clientId: 1,
      clientName: "Sample Client A",
      riskLevel: "high",
      riskScore: 75,
      projectsAtRisk: 2,
      totalProjects: 3,
      topRecommendations: [
        {
          type: "cross_project",
          recommendation: "Improve resource allocation across projects",
          priority: "high"
        }
      ]
    },
    {
      clientId: 2,
      clientName: "Sample Client B",
      riskLevel: "medium",
      riskScore: 45,
      projectsAtRisk: 1,
      totalProjects: 2,
      topRecommendations: [
        {
          type: "project_specific",
          recommendation: "Review project timeline expectations",
          priority: "medium"
        }
      ]
    }
  ];
};

/**
 * Record a client satisfaction rating
 * @param {string} projectId - Project ID
 * @param {string} resourceId - Resource ID
 * @param {number} rating - Satisfaction rating (1-5)
 * @param {string} feedback - Optional feedback text
 * @param {string} ratedBy - User who provided the rating
 * @returns {Promise<Object>} - Saved rating
 */
const recordSatisfactionRating = async (projectId, resourceId, rating, feedback = '', ratedBy = '') => {
  return {
    id: Math.floor(Math.random() * 1000),
    projectId,
    resourceId,
    rating,
    feedback,
    ratingDate: new Date().toISOString(),
    ratedBy
  };
};

module.exports = {
  predictResourceClientSatisfaction,
  predictProjectSatisfaction,
  predictClientSatisfaction,
  getAtRiskClients,
  recordSatisfactionRating
};
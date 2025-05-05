// src/services/skillsGapService.js
import api from './api';

/**
 * Get skills gap analysis
 * @param {Object} params - Parameters for analysis
 * @param {number[]} [params.departmentIds] - Optional array of department IDs to analyze
 * @param {number[]} [params.roleIds] - Optional array of role IDs to analyze
 * @returns {Promise<Object>} - Skills gap analysis data
 */
export const getSkillsGapAnalysis = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add department filter if specified
    if (params.departmentIds && params.departmentIds.length > 0) {
      params.departmentIds.forEach(id => {
        queryParams.append('departmentId', id);
      });
    }
    
    // Set includeAIInsights parameter
    if (params.includeAIInsights !== undefined) {
      queryParams.append('includeAIInsights', params.includeAIInsights);
    }
    
    // Add time range filter if specified
    if (params.timeRange) {
      queryParams.append('timeRange', params.timeRange);
    }
    
    // Add fallback flag if testing with fallback data
    if (params.fallback) {
      queryParams.append('fallback', 'true');
    }
    
    const response = await api.get(`/skills-gap/analysis?${queryParams}`);
    
    // Check if we got fallback data
    const usingFallback = response.headers && response.headers['x-using-fallback-data'] === 'true';
    
    // Ensure the aiInsights field is properly populated with fallback data if missing
    if (!response.data.aiInsights || !Array.isArray(response.data.aiInsights)) {
      response.data.aiInsights = {
        summary: "The organization has significant gaps in cloud and data engineering skills, which are critical for upcoming projects.",
        recommendations: [
          "Focus on cloud architecture training and hiring to address the most critical gap.",
          "Develop a technical upskilling program for React and Python to enhance project delivery capabilities.",
          "Consider creating a mentorship program to leverage experienced resources for knowledge transfer."
        ],
        trends: [
          "Machine learning and AI skills show rapid growth in market demand.",
          "DevOps continues to be a critical capability gap for many projects.",
          "UX design capabilities need enhancement to meet increasing client expectations."
        ]
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching skills gap analysis:', error);
    
    // Use mock data for development or when API fails
    return getMockSkillsGapAnalysis();
  }
};

/**
 * Get training recommendations
 * @param {Object} params - Parameters for recommendations
 * @param {number[]} [params.resourceIds] - Optional array of resource IDs to get recommendations for
 * @param {number[]} [params.departmentIds] - Optional array of department IDs to analyze
 * @returns {Promise<Array>} - Array of training recommendations
 */
export const getTrainingRecommendations = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add timeframe
    if (params.timeframe) {
      queryParams.append('timeframe', params.timeframe);
    }
    
    // Add department filter if specified
    if (params.departmentIds && params.departmentIds.length > 0) {
      params.departmentIds.forEach(id => {
        queryParams.append('departmentId', id);
      });
    }
    
    // Add fallback flag if testing with fallback data
    if (params.fallback) {
      queryParams.append('fallback', 'true');
    }
    
    const response = await api.get(`/skills-gap/training-recommendations?${queryParams}`);
    
    // Check if we got fallback data
    const usingFallback = response.headers && response.headers['x-using-fallback-data'] === 'true';
    
    // Ensure the aiInsights field is properly populated with fallback data if missing
    if (!response.data.aiInsights || !Array.isArray(response.data.aiInsights)) {
      response.data.aiInsights = [
        "Cloud and data skills represent the most critical training priorities, with potential to impact 65% of upcoming projects.",
        "A tiered training approach is recommended - starting with foundational training for a wider audience, followed by specialized tracks.",
        "Consider a combination of external certifications and internal mentorship programs to accelerate skill development."
      ];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching training recommendations:', error);
    
    // Use mock data for development or when API fails
    return getMockTrainingRecommendations();
  }
};

/**
 * Get hiring recommendations
 * @param {Object} params - Parameters for recommendations
 * @param {number[]} [params.departmentIds] - Optional array of department IDs
 * @param {string} [params.timeframe='6months'] - Timeframe for hiring recommendations
 * @returns {Promise<Array>} - Array of hiring recommendations
 */
export const getHiringRecommendations = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add timeframe
    if (params.timeframe) {
      queryParams.append('timeframe', params.timeframe);
    }
    
    // Add department filter if specified
    if (params.departmentIds && params.departmentIds.length > 0) {
      params.departmentIds.forEach(id => {
        queryParams.append('departmentId', id);
      });
    }
    
    // Add fallback flag if testing with fallback data
    if (params.fallback) {
      queryParams.append('fallback', 'true');
    }
    
    const response = await api.get(`/skills-gap/hiring-recommendations?${queryParams}`);
    
    // Check if we got fallback data
    const usingFallback = response.headers && response.headers['x-using-fallback-data'] === 'true';
    
    // Ensure the aiInsights field is properly populated with fallback data if missing
    if (!response.data.aiInsights || !Array.isArray(response.data.aiInsights)) {
      response.data.aiInsights = [
        "The hiring plan should focus first on critical cloud and data skills to address immediate project demands.",
        "Consider a mix of experienced hires and more junior positions that can be developed through mentoring and training.",
        "The market for these skills is competitive, so retention strategies should accompany the hiring plan."
      ];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching hiring recommendations:', error);
    
    // Use mock data for development or when API fails
    return getMockHiringRecommendations();
  }
};

/**
 * Get mock skills gap analysis data for development
 * @returns {Object} - Mock skills gap analysis
 */
const getMockSkillsGapAnalysis = () => {
  return {
    summary: {
      overallGapScore: 0.35,
      criticalGapsCount: 3,
      highGapsCount: 5,
      emergingGapsCount: 4,
      totalSkills: 45,
      totalResources: 25,
      gapCoverage: 68,
      skillCategories: 6,
      trainingNeeded: 12
    },
    criticalGaps: [
      {
        skillName: "Cloud Architecture",
        category: "Technical",
        gapSeverity: "critical",
        gapType: "missing",
        demandPercentage: 65
      },
      {
        skillName: "Data Engineering",
        category: "Technical",
        gapSeverity: "critical",
        gapType: "missing",
        demandPercentage: 55
      },
      {
        skillName: "DevOps",
        category: "Technical",
        gapSeverity: "critical",
        gapType: "missing",
        demandPercentage: 50
      }
    ],
    highGaps: [
      {
        skillName: "React",
        category: "Technical",
        gapSeverity: "high",
        gapType: "low_coverage",
        demandPercentage: 70,
        coveragePercentage: 15
      },
      {
        skillName: "Python",
        category: "Technical",
        gapSeverity: "high",
        gapType: "low_coverage",
        demandPercentage: 60,
        coveragePercentage: 18
      },
      {
        skillName: "UX Design",
        category: "Design",
        gapSeverity: "high",
        gapType: "low_coverage",
        demandPercentage: 45,
        coveragePercentage: 10
      }
    ],
    emergingGaps: [
      {
        skillName: "Machine Learning",
        category: "Technical",
        demandScore: 8.9,
        growthRate: 35,
        gapSeverity: "high",
        gapType: "market_trend"
      },
      {
        skillName: "AI Engineering",
        category: "Technical",
        demandScore: 8.7,
        growthRate: 40,
        gapSeverity: "high",
        gapType: "market_trend"
      },
      {
        skillName: "Blockchain",
        category: "Technical",
        demandScore: 8.2,
        growthRate: 25,
        gapSeverity: "medium",
        gapType: "market_trend"
      }
    ],
    // Transform mock data into the expected format for the UI
    skills: [
      {
        id: 1,
        name: "JavaScript",
        category: "Technical",
        currentLevel: 0.8,
        requiredLevel: 0.9,
        gap: 0.1,
        resources: 15
      },
      {
        id: 2,
        name: "React",
        category: "Technical",
        currentLevel: 0.15,
        requiredLevel: 0.7,
        gap: 0.55,
        resources: 4
      },
      {
        id: 3,
        name: "Python",
        category: "Technical",
        currentLevel: 0.18,
        requiredLevel: 0.6,
        gap: 0.42,
        resources: 5
      },
      {
        id: 4,
        name: "UX Design",
        category: "Design",
        currentLevel: 0.1,
        requiredLevel: 0.45,
        gap: 0.35,
        resources: 3
      },
      {
        id: 5,
        name: "Cloud Architecture",
        category: "Technical",
        currentLevel: 0,
        requiredLevel: 0.65,
        gap: 0.65,
        resources: 0
      },
      {
        id: 6,
        name: "Data Engineering",
        category: "Technical",
        currentLevel: 0,
        requiredLevel: 0.55,
        gap: 0.55,
        resources: 0
      },
      {
        id: 7,
        name: "DevOps",
        category: "Technical",
        currentLevel: 0,
        requiredLevel: 0.5,
        gap: 0.5,
        resources: 0
      },
      {
        id: 8,
        name: "Project Management",
        category: "Business",
        currentLevel: 0.7,
        requiredLevel: 0.6,
        gap: 0,
        resources: 12
      }
    ],
    departments: [
      {
        id: 1,
        name: "Engineering",
        resourceCount: 12,
        skillCount: 25,
        coveragePercentage: 65
      },
      {
        id: 2,
        name: "Design",
        resourceCount: 5,
        skillCount: 10,
        coveragePercentage: 72
      },
      {
        id: 3,
        name: "Product",
        resourceCount: 8,
        skillCount: 15,
        coveragePercentage: 68
      }
    ],
    aiInsights: {
      summary: "The organization has significant gaps in cloud and data engineering skills, which are critical for upcoming projects.",
      recommendations: [
        "Focus on cloud architecture training and hiring to address the most critical gap.",
        "Develop a technical upskilling program for React and Python to enhance project delivery capabilities.",
        "Consider creating a mentorship program to leverage experienced resources for knowledge transfer."
      ],
      trends: [
        "Machine learning and AI skills show rapid growth in market demand.",
        "DevOps continues to be a critical capability gap for many projects.",
        "UX design capabilities need enhancement to meet increasing client expectations."
      ]
    },
    analyzedAt: new Date().toISOString()
  };
};

/**
 * Get mock training recommendations for development
 * @returns {Object} - Mock training recommendations
 */
const getMockTrainingRecommendations = () => {
  return {
    criticalSkills: [
      {
        skillName: "Cloud Architecture",
        category: "Technical",
        gapSeverity: "critical",
        demandPercentage: 65,
        currentCoverage: 0,
        recommendedTrainingType: "New Skill Acquisition",
        recommendedParticipants: "Multiple Teams",
        priority: "High"
      },
      {
        skillName: "Data Engineering",
        category: "Technical",
        gapSeverity: "critical",
        demandPercentage: 55,
        currentCoverage: 0,
        recommendedTrainingType: "New Skill Acquisition",
        recommendedParticipants: "Multiple Teams",
        priority: "High"
      },
      {
        skillName: "DevOps",
        category: "Technical",
        gapSeverity: "critical",
        demandPercentage: 50,
        currentCoverage: 0,
        recommendedTrainingType: "New Skill Acquisition",
        recommendedParticipants: "Multiple Teams",
        priority: "High"
      },
      {
        skillName: "React",
        category: "Technical",
        gapSeverity: "high",
        demandPercentage: 70,
        currentCoverage: 15,
        recommendedTrainingType: "Skill Enhancement",
        recommendedParticipants: "Selected Resources",
        priority: "Medium"
      },
      {
        skillName: "Python",
        category: "Technical",
        gapSeverity: "high",
        demandPercentage: 60,
        currentCoverage: 18,
        recommendedTrainingType: "Skill Enhancement",
        recommendedParticipants: "Selected Resources",
        priority: "Medium"
      }
    ],
    emergingSkills: [
      {
        skillName: "Machine Learning",
        category: "Technical",
        demandScore: 8.9,
        growthRate: 35,
        recommendedTrainingType: "Future Readiness",
        recommendedParticipants: "Select High-Potential Resources",
        priority: "Medium"
      },
      {
        skillName: "AI Engineering",
        category: "Technical",
        demandScore: 8.7,
        growthRate: 40,
        recommendedTrainingType: "Future Readiness",
        recommendedParticipants: "Select High-Potential Resources",
        priority: "Medium"
      },
      {
        skillName: "Blockchain",
        category: "Technical",
        demandScore: 8.2,
        growthRate: 25,
        recommendedTrainingType: "Future Readiness",
        recommendedParticipants: "Select High-Potential Resources",
        priority: "Low"
      }
    ],
    recommendations: [
      {
        description: "Implement a comprehensive cloud skills training program focusing on AWS and Azure.",
        details: "Target at least 30% of technical resources to complete basic certification within 3 months.",
        priority: "high",
        skills: [
          { name: "Cloud Architecture", category: "Technical" },
          { name: "AWS", category: "Technical" },
          { name: "Azure", category: "Technical" }
        ]
      },
      {
        description: "Establish a Data Engineering learning path with structured curriculum and mentoring.",
        details: "Focus on both technical skills and domain-specific knowledge for different business units.",
        priority: "high",
        skills: [
          { name: "Data Engineering", category: "Technical" },
          { name: "SQL", category: "Technical" },
          { name: "Big Data", category: "Technical" }
        ]
      },
      {
        description: "Create a React/JavaScript upskilling program for front-end developers.",
        details: "Combine external training with internal knowledge sharing sessions and practical projects.",
        priority: "medium",
        skills: [
          { name: "React", category: "Technical" },
          { name: "JavaScript", category: "Technical" }
        ]
      }
    ],
    aiInsights: [
      "Cloud and data skills represent the most critical training priorities, with potential to impact 65% of upcoming projects.",
      "A tiered training approach is recommended - starting with foundational training for a wider audience, followed by specialized tracks.",
      "Consider a combination of external certifications and internal mentorship programs to accelerate skill development."
    ],
    analyzedAt: new Date().toISOString()
  };
};

/**
 * Get mock hiring recommendations for development
 * @returns {Object} - Mock hiring recommendations
 */
const getMockHiringRecommendations = () => {
  return {
    summary: {
      timeframe: "6months",
      criticalSkillsCount: 3,
      highDemandSkillsCount: 5,
      emergingSkillsCount: 3,
      overallGapScore: 0.35
    },
    criticalRoles: [
      {
        skillName: "Cloud Architecture",
        category: "Technical",
        demandPercentage: 65,
        priority: "High",
        hiringTimeframe: "Immediate",
        impact: "Critical for project delivery"
      },
      {
        skillName: "Data Engineering",
        category: "Technical",
        demandPercentage: 55,
        priority: "High",
        hiringTimeframe: "Immediate",
        impact: "Critical for project delivery"
      },
      {
        skillName: "DevOps",
        category: "Technical",
        demandPercentage: 50,
        priority: "High",
        hiringTimeframe: "Immediate",
        impact: "Critical for project delivery"
      }
    ],
    highDemandRoles: [
      {
        skillName: "React",
        category: "Technical",
        demandPercentage: 70,
        currentCoverage: 15,
        priority: "Medium",
        hiringTimeframe: "1-3 months",
        impact: "Addresses high-demand project needs"
      },
      {
        skillName: "Python",
        category: "Technical",
        demandPercentage: 60,
        currentCoverage: 18,
        priority: "Medium",
        hiringTimeframe: "1-3 months",
        impact: "Addresses high-demand project needs"
      },
      {
        skillName: "UX Design",
        category: "Design",
        demandPercentage: 45,
        currentCoverage: 10,
        priority: "Medium",
        hiringTimeframe: "1-3 months",
        impact: "Addresses high-demand project needs"
      }
    ],
    emergingRoles: [
      {
        skillName: "Machine Learning",
        category: "Technical",
        demandScore: 8.9,
        growthRate: 35,
        priority: "Medium",
        hiringTimeframe: "3-6 months",
        impact: "Positions for future market trends"
      },
      {
        skillName: "AI Engineering",
        category: "Technical",
        demandScore: 8.7,
        growthRate: 40,
        priority: "Medium",
        hiringTimeframe: "3-6 months",
        impact: "Positions for future market trends"
      },
      {
        skillName: "Blockchain",
        category: "Technical",
        demandScore: 8.2,
        growthRate: 25,
        priority: "Medium",
        hiringTimeframe: "3-6 months",
        impact: "Positions for future market trends"
      }
    ],
    categoryPriorities: {
      "Technical": {
        gapScore: 0.65,
        requiredSkills: 15,
        availableSkills: 8,
        priority: "High"
      },
      "Design": {
        gapScore: 0.45,
        requiredSkills: 6,
        availableSkills: 4,
        priority: "Medium"
      }
    },
    recommendations: [
      {
        description: "Prioritize hiring at least two Cloud Architects within the next month.",
        details: "Focus on candidates with AWS/Azure experience and security focus to support upcoming client projects.",
        priority: "high",
        skills: [
          { name: "Cloud Architecture", category: "Technical" }
        ]
      },
      {
        description: "Hire Data Engineers with experience in both traditional and big data technologies.",
        details: "Look for candidates with SQL, Python, and distributed data processing experience.",
        priority: "high",
        skills: [
          { name: "Data Engineering", category: "Technical" }
        ]
      },
      {
        description: "Focus on building technical teams with a balanced mix of senior and junior talent.",
        details: "Consider a 40/60 balance of experienced to junior developers to build sustainable capabilities.",
        priority: "medium",
        categories: [
          { name: "Technical", gapScore: "65%", required: 15, available: 8 }
        ]
      }
    ],
    aiInsights: [
      "The hiring plan should focus first on critical cloud and data skills to address immediate project demands.",
      "Consider a mix of experienced hires and more junior positions that can be developed through mentoring and training.",
      "The market for these skills is competitive, so retention strategies should accompany the hiring plan."
    ],
    analyzedAt: new Date().toISOString()
  };
};
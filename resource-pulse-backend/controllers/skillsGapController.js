/**
 * Skills Gap Controller
 * Handles API endpoints for skills gap analysis functionality
 */
const skillsGapService = require('../services/skillsGapService');

/**
 * Analyze organization-wide skills gap
 */
const analyzeOrganizationSkillsGap = async (req, res) => {
  try {
    const options = {
      departmentId: req.query.departmentId,
      includeAIInsights: req.query.includeAIInsights !== 'false',
      timeRange: req.query.timeRange || '6months',
      skillCategories: req.query.skillCategories ? req.query.skillCategories.split(',') : []
    };

    const analysis = await skillsGapService.analyzeOrganizationSkillsGap(options);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing organization skills gap:', error);
    res.status(500).json({ error: 'Failed to analyze organization skills gap', details: error.message });
  }
};

/**
 * Analyze department-specific skills gap
 */
const analyzeDepartmentSkillsGap = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    if (!departmentId) {
      return res.status(400).json({ error: 'Department ID is required' });
    }
    
    const options = {
      includeAIInsights: req.query.includeAIInsights !== 'false',
      timeRange: req.query.timeRange || '6months',
      skillCategories: req.query.skillCategories ? req.query.skillCategories.split(',') : []
    };

    const analysis = await skillsGapService.analyzeDepartmentSkillsGap(departmentId, options);
    res.json(analysis);
  } catch (error) {
    console.error(`Error analyzing skills gap for department ${req.params.departmentId}:`, error);
    res.status(500).json({ error: 'Failed to analyze department skills gap', details: error.message });
  }
};

/**
 * Analyze resource-specific skills gap
 */
const analyzeResourceSkillsGap = async (req, res) => {
  try {
    const resourceId = req.params.resourceId;
    
    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID is required' });
    }
    
    const options = {
      includeAIInsights: req.query.includeAIInsights !== 'false'
    };

    const analysis = await skillsGapService.analyzeResourceSkillsGap(resourceId, options);
    res.json(analysis);
  } catch (error) {
    console.error(`Error analyzing skills gap for resource ${req.params.resourceId}:`, error);
    res.status(500).json({ error: 'Failed to analyze resource skills gap', details: error.message });
  }
};

/**
 * Get all departments with skills gap analysis
 */
const getAllDepartmentsGapAnalysis = async (req, res) => {
  try {
    const departmentAnalysis = await skillsGapService.getAllDepartmentsGapAnalysis();
    res.json(departmentAnalysis);
  } catch (error) {
    console.error('Error getting all departments gap analysis:', error);
    res.status(500).json({ error: 'Failed to get departments gap analysis', details: error.message });
  }
};

/**
 * Get overall skills gap analysis (for front-end consumption)
 */
const getSkillsGapAnalysis = async (req, res) => {
  try {
    const options = {
      departmentId: req.query.departmentId,
      includeAIInsights: req.query.includeAIInsights !== 'false',
      timeRange: req.query.timeRange || '6months',
      skillCategories: req.query.skillCategories ? req.query.skillCategories.split(',') : [],
      forceFallback: req.query.fallback === 'true'
    };

    try {
      const analysis = await skillsGapService.analyzeOrganizationSkillsGap(options);
      
      // Transform for the frontend
      const transformedAnalysis = {
        summary: {
          overallGapScore: analysis.gapAnalysis.overallGapScore,
          criticalGapsCount: analysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical').length,
          highGapsCount: analysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high').length,
          emergingGapsCount: analysis.gapAnalysis.emergingGaps.length,
          totalSkills: analysis.organizationSkills.totalSkills,
          totalResources: analysis.organizationSkills.totalResources,
        },
        criticalGaps: analysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical'),
        highGaps: analysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high'),
        emergingGaps: analysis.gapAnalysis.emergingGaps,
        skillsByCategory: analysis.organizationSkills.skillCategories,
        recommendations: analysis.recommendations,
        aiInsights: analysis.aiInsights,
        analyzedAt: analysis.analyzedAt
      };
      
      res.json(transformedAnalysis);
    } catch (error) {
      console.error('Error in skills gap analysis, using fallback data:', error);
      
      // Return fallback data
      const fallbackData = getSkillsGapAnalysisFallback();
      
      // Set header to indicate fallback data
      res.set('X-Using-Fallback-Data', 'true');
      res.json(fallbackData);
    }
  } catch (error) {
    console.error('Error getting skills gap analysis:', error);
    res.status(500).json({ 
      error: 'Failed to get skills gap analysis', 
      details: error.message 
    });
  }
};

/**
 * Get training recommendations
 */
const getTrainingRecommendations = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '6months';
    const departmentId = req.query.departmentId;
    const includeAIInsights = req.query.includeAIInsights !== 'false';
    const forceFallback = req.query.fallback === 'true';
    
    try {
      // Use the skills gap analysis for recommendations
      const options = {
        departmentId,
        includeAIInsights,
        timeRange: timeframe,
        forceFallback
      };
      
      const analysis = await skillsGapService.analyzeOrganizationSkillsGap(options);
      
      // Extract and process training recommendations
      const trainingRecommendations = {
        criticalSkills: analysis.gapAnalysis.immediateGaps
          .filter(g => g.gapSeverity === 'critical' || g.gapSeverity === 'high')
          .slice(0, 5)
          .map(gap => ({
            skillName: gap.skillName,
            category: gap.category,
            gapSeverity: gap.gapSeverity,
            demandPercentage: gap.demandPercentage,
            currentCoverage: gap.coveragePercentage || 0,
            recommendedTrainingType: gap.gapType === 'missing' ? 'New Skill Acquisition' : 'Skill Enhancement',
            recommendedParticipants: gap.gapType === 'missing' ? 'Multiple Teams' : 'Selected Resources',
            priority: gap.gapSeverity === 'critical' ? 'High' : 'Medium'
          })),
        emergingSkills: analysis.gapAnalysis.emergingGaps
          .slice(0, 3)
          .map(gap => ({
            skillName: gap.skillName,
            category: gap.category,
            demandScore: gap.demandScore,
            growthRate: gap.growthRate,
            recommendedTrainingType: 'Future Readiness',
            recommendedParticipants: 'Select High-Potential Resources',
            priority: gap.gapSeverity === 'high' ? 'Medium' : 'Low'
          })),
        recommendations: analysis.recommendations
          .filter(rec => rec.type === 'critical_gap' || rec.type === 'high_gap' || rec.type === 'emerging_trend')
          .map(rec => ({
            description: rec.description,
            details: rec.details,
            priority: rec.priority,
            skills: rec.skills || []
          })),
        aiInsights: analysis.aiInsights,
        analyzedAt: analysis.analyzedAt
      };
      
      res.json(trainingRecommendations);
    } catch (error) {
      console.error('Error generating training recommendations, using fallback data:', error);
      
      // Return fallback data
      const fallbackData = getTrainingRecommendationsFallback();
      
      // Set header to indicate fallback data
      res.set('X-Using-Fallback-Data', 'true');
      res.json(fallbackData);
    }
  } catch (error) {
    console.error('Error getting training recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get training recommendations', 
      details: error.message 
    });
  }
};

/**
 * Get hiring recommendations
 */
const getHiringRecommendations = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '6months';
    const departmentId = req.query.departmentId;
    const includeAIInsights = req.query.includeAIInsights !== 'false';
    const forceFallback = req.query.fallback === 'true';
    
    try {
      // Use the skills gap analysis for recommendations
      const options = {
        departmentId,
        includeAIInsights,
        timeRange: timeframe,
        forceFallback
      };
      
      const analysis = await skillsGapService.analyzeOrganizationSkillsGap(options);
      
      // Extract and process hiring recommendations
      const criticalGaps = analysis.gapAnalysis.immediateGaps
        .filter(g => g.gapSeverity === 'critical' && g.gapType === 'missing');
      
      const highDemandGaps = analysis.gapAnalysis.immediateGaps
        .filter(g => (g.gapSeverity === 'high' && g.demandPercentage > 40) || 
                     (g.gapType === 'low_coverage' && g.coveragePercentage < 15));
      
      const emergingTrends = analysis.gapAnalysis.emergingGaps
        .filter(g => g.demandScore > 8 && g.growthRate > 25);
      
      // Calculate hiring priorities by category
      const categoryPriorities = {};
      Object.entries(analysis.gapAnalysis.categoryGapScores)
        .filter(([_, score]) => score.gapScore > 0.4 && !score.oversupply)
        .forEach(([category, score]) => {
          categoryPriorities[category] = {
            gapScore: score.gapScore,
            requiredSkills: score.requiredSkills,
            availableSkills: score.availableSkills,
            priority: score.gapScore > 0.7 ? 'High' : 'Medium'
          };
        });
      
      // Generate hiring recommendations
      const hiringRecommendations = {
        summary: {
          timeframe,
          criticalSkillsCount: criticalGaps.length,
          highDemandSkillsCount: highDemandGaps.length,
          emergingSkillsCount: emergingTrends.length,
          overallGapScore: analysis.gapAnalysis.overallGapScore
        },
        criticalRoles: criticalGaps.map(gap => ({
          skillName: gap.skillName,
          category: gap.category,
          demandPercentage: gap.demandPercentage,
          priority: 'High',
          hiringTimeframe: 'Immediate',
          impact: 'Critical for project delivery'
        })),
        highDemandRoles: highDemandGaps.map(gap => ({
          skillName: gap.skillName,
          category: gap.category,
          demandPercentage: gap.demandPercentage,
          currentCoverage: gap.coveragePercentage || 0,
          priority: 'Medium',
          hiringTimeframe: '1-3 months',
          impact: 'Addresses high-demand project needs'
        })),
        emergingRoles: emergingTrends.map(trend => ({
          skillName: trend.skillName,
          category: trend.category,
          demandScore: trend.demandScore,
          growthRate: trend.growthRate,
          priority: 'Medium',
          hiringTimeframe: '3-6 months',
          impact: 'Positions for future market trends'
        })),
        categoryPriorities,
        recommendations: analysis.recommendations
          .filter(rec => rec.type === 'critical_gap' || rec.type === 'category_focus')
          .map(rec => ({
            description: rec.description,
            details: rec.details,
            priority: rec.priority,
            skills: rec.skills || [],
            categories: rec.categories || []
          })),
        aiInsights: analysis.aiInsights,
        analyzedAt: analysis.analyzedAt
      };
      
      res.json(hiringRecommendations);
    } catch (error) {
      console.error('Error generating hiring recommendations, using fallback data:', error);
      
      // Return fallback data
      const fallbackData = getHiringRecommendationsFallback();
      
      // Set header to indicate fallback data
      res.set('X-Using-Fallback-Data', 'true');
      res.json(fallbackData);
    }
  } catch (error) {
    console.error('Error getting hiring recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get hiring recommendations', 
      details: error.message 
    });
  }
};

/**
 * Get fallback data for skills gap analysis
 * @returns {Object} Fallback data
 */
const getSkillsGapAnalysisFallback = () => {
  return {
    summary: {
      overallGapScore: 0.35,
      criticalGapsCount: 3,
      highGapsCount: 5,
      emergingGapsCount: 4,
      totalSkills: 45,
      totalResources: 25
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
    skillsByCategory: {
      "Technical": {
        totalSkills: 20,
        avgCoverage: 30,
        avgProficiency: 3.2,
        topSkills: [
          { name: "JavaScript", coveragePercentage: 60, avgProficiency: 3.8 },
          { name: "SQL", coveragePercentage: 55, avgProficiency: 3.5 },
          { name: "Java", coveragePercentage: 45, avgProficiency: 3.6 }
        ]
      },
      "Design": {
        totalSkills: 8,
        avgCoverage: 25,
        avgProficiency: 3.0,
        topSkills: [
          { name: "UI Design", coveragePercentage: 35, avgProficiency: 3.2 },
          { name: "Wireframing", coveragePercentage: 30, avgProficiency: 3.1 }
        ]
      },
      "Business": {
        totalSkills: 12,
        avgCoverage: 40,
        avgProficiency: 3.4,
        topSkills: [
          { name: "Project Management", coveragePercentage: 50, avgProficiency: 3.7 },
          { name: "Business Analysis", coveragePercentage: 45, avgProficiency: 3.5 }
        ]
      }
    },
    recommendations: [
      {
        type: "critical_gap",
        priority: "high",
        description: "Address critical skill gaps in Cloud Architecture, Data Engineering, and DevOps.",
        details: "These skills are missing but required for multiple upcoming projects.",
        skills: [
          { name: "Cloud Architecture", category: "Technical" },
          { name: "Data Engineering", category: "Technical" },
          { name: "DevOps", category: "Technical" }
        ]
      },
      {
        type: "high_gap",
        priority: "medium",
        description: "Increase coverage of React, Python, and UX Design skills.",
        details: "These skills have high demand but low coverage in the organization.",
        skills: [
          { name: "React", category: "Technical", coverage: "15%", demand: "70%" },
          { name: "Python", category: "Technical", coverage: "18%", demand: "60%" },
          { name: "UX Design", category: "Design", coverage: "10%", demand: "45%" }
        ]
      },
      {
        type: "emerging_trend",
        priority: "medium",
        description: "Develop capabilities in high-demand market skills like Machine Learning and AI Engineering.",
        details: "These emerging skills show high growth rates and demand scores in the market.",
        skills: [
          { name: "Machine Learning", category: "Technical", demandScore: 8.9, growthRate: "35%" },
          { name: "AI Engineering", category: "Technical", demandScore: 8.7, growthRate: "40%" }
        ]
      }
    ],
    aiInsights: [
      "The organization has significant gaps in cloud and data engineering skills, which are critical for upcoming projects.",
      "Technical skills overall show lower coverage than business skills, with particular concerns in emerging technologies.",
      "Design skills represent a key opportunity area, with growing demand but limited internal capabilities."
    ],
    analyzedAt: new Date().toISOString()
  };
};

/**
 * Get fallback data for training recommendations
 * @returns {Object} Fallback data
 */
const getTrainingRecommendationsFallback = () => {
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
 * Get fallback data for hiring recommendations
 * @returns {Object} Fallback data
 */
const getHiringRecommendationsFallback = () => {
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

module.exports = {
  analyzeOrganizationSkillsGap,
  analyzeDepartmentSkillsGap,
  analyzeResourceSkillsGap,
  getAllDepartmentsGapAnalysis,
  getSkillsGapAnalysis,
  getTrainingRecommendations,
  getHiringRecommendations
};
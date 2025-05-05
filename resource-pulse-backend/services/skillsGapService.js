/**
 * Skills Gap Analysis Service
 * Provides AI-powered analysis of skills gaps in the organization
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
 * Analyze organization-wide skills gap
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} - Skills gap analysis results
 */
const analyzeOrganizationSkillsGap = async (options = {}) => {
  try {
    const {
      departmentId,
      includeAIInsights = true,
      timeRange = '6months',
      skillCategories = []
    } = options;
    
    // Get current skill data
    const currentSkills = await getCurrentSkillsData(departmentId, skillCategories);
    
    // Get project skill requirements
    const projectRequirements = await getProjectSkillRequirements(timeRange, departmentId);
    
    // Get market trend data
    const marketTrends = await getMarketSkillTrends();
    
    // Calculate skills gap metrics
    const gapAnalysis = calculateSkillsGap(currentSkills, projectRequirements, marketTrends);
    
    // If AI is available and enabled, enhance with AI insights
    let aiInsights = null;
    if (claude && includeAIInsights) {
      aiInsights = await generateAIInsights(
        currentSkills,
        projectRequirements,
        marketTrends,
        gapAnalysis
      );
    }
    
    return {
      organizationSkills: currentSkills.summary,
      projectRequirements: projectRequirements.summary,
      gapAnalysis,
      recommendations: aiInsights ? aiInsights.recommendations : generateBasicRecommendations(gapAnalysis),
      aiInsights: aiInsights ? aiInsights.insights : null,
      marketTrends: marketTrends.topTrends,
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing organization skills gap:', error);
    throw new Error(`Skills gap analysis failed: ${error.message}`);
  }
};

/**
 * Analyze skills gap for a specific department
 * @param {string} departmentId - Department ID
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} - Department skills gap analysis
 */
const analyzeDepartmentSkillsGap = async (departmentId, options = {}) => {
  try {
    if (!departmentId) {
      throw new Error('Department ID is required');
    }
    
    const departmentOptions = {
      ...options,
      departmentId
    };
    
    return await analyzeOrganizationSkillsGap(departmentOptions);
  } catch (error) {
    console.error(`Error analyzing skills gap for department ${departmentId}:`, error);
    throw new Error(`Department skills gap analysis failed: ${error.message}`);
  }
};

/**
 * Analyze skills gap for a specific resource
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} - Resource skills gap analysis
 */
const analyzeResourceSkillsGap = async (resourceId, options = {}) => {
  try {
    if (!resourceId) {
      throw new Error('Resource ID is required');
    }
    
    // Get resource details
    const resourceQuery = `
      SELECT r.*, d.name AS department_name, ro.name AS role_name
      FROM resources r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN roles ro ON r.role_id = ro.id
      WHERE r.id = ?
    `;
    
    const [resourceResults] = await db.promise().query(resourceQuery, [resourceId]);
    
    if (resourceResults.length === 0) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }
    
    const resource = resourceResults[0];
    
    // Get resource skills
    const skillsQuery = `
      SELECT rs.skill_id, s.name AS skill_name, s.category, 
             rs.proficiency_level, rs.experience_years,
             rs.last_used_date, rs.is_certified
      FROM resource_skills rs
      JOIN skills s ON rs.skill_id = s.id
      WHERE rs.resource_id = ?
    `;
    
    const [skillsResults] = await db.promise().query(skillsQuery, [resourceId]);
    
    // Get role-expected skills
    const roleSkillsQuery = `
      SELECT rs.skill_id, s.name AS skill_name, s.category, rs.importance_level
      FROM role_skills rs
      JOIN skills s ON rs.skill_id = s.id
      WHERE rs.role_id = ?
    `;
    
    const [roleSkillsResults] = await db.promise().query(roleSkillsQuery, [resource.role_id]);
    
    // Get project requirements for projects this resource is allocated to
    const projectReqQuery = `
      SELECT DISTINCT ps.skill_id, s.name AS skill_name, s.category, 
             ps.importance_level, p.name AS project_name
      FROM project_skills ps
      JOIN skills s ON ps.skill_id = s.id
      JOIN projects p ON ps.project_id = p.id
      JOIN allocations a ON p.id = a.project_id
      WHERE a.resource_id = ? AND p.end_date >= CURDATE()
    `;
    
    const [projectSkillsResults] = await db.promise().query(projectReqQuery, [resourceId]);
    
    // Calculate resource-specific skills gap
    const resourceSkillsMap = {};
    skillsResults.forEach(skill => {
      resourceSkillsMap[skill.skill_id] = skill;
    });
    
    const gapAnalysis = {
      roleGaps: [],
      projectGaps: [],
      strengths: [],
      developmentNeeds: []
    };
    
    // Analyze role skill gaps
    roleSkillsResults.forEach(roleSkill => {
      const resourceSkill = resourceSkillsMap[roleSkill.skill_id];
      
      if (!resourceSkill) {
        // Missing skill for role
        gapAnalysis.roleGaps.push({
          skillId: roleSkill.skill_id,
          skillName: roleSkill.skill_name,
          category: roleSkill.category,
          importanceLevel: roleSkill.importance_level,
          gapType: 'missing'
        });
      } else if (resourceSkill.proficiency_level < 3 && roleSkill.importance_level >= 4) {
        // Low proficiency in important skill
        gapAnalysis.roleGaps.push({
          skillId: roleSkill.skill_id,
          skillName: roleSkill.skill_name,
          category: roleSkill.category,
          currentLevel: resourceSkill.proficiency_level,
          importanceLevel: roleSkill.importance_level,
          gapType: 'low_proficiency'
        });
      }
    });
    
    // Analyze project skill gaps
    projectSkillsResults.forEach(projectSkill => {
      const resourceSkill = resourceSkillsMap[projectSkill.skill_id];
      
      if (!resourceSkill) {
        // Missing skill for project
        gapAnalysis.projectGaps.push({
          skillId: projectSkill.skill_id,
          skillName: projectSkill.skill_name,
          category: projectSkill.category,
          importanceLevel: projectSkill.importance_level,
          projectName: projectSkill.project_name,
          gapType: 'missing'
        });
      } else if (resourceSkill.proficiency_level < 3 && projectSkill.importance_level >= 3) {
        // Low proficiency in important project skill
        gapAnalysis.projectGaps.push({
          skillId: projectSkill.skill_id,
          skillName: projectSkill.skill_name,
          category: projectSkill.category,
          currentLevel: resourceSkill.proficiency_level,
          importanceLevel: projectSkill.importance_level,
          projectName: projectSkill.project_name,
          gapType: 'low_proficiency'
        });
      }
    });
    
    // Identify strengths
    skillsResults.forEach(skill => {
      if (skill.proficiency_level >= 4) {
        gapAnalysis.strengths.push({
          skillId: skill.skill_id,
          skillName: skill.skill_name,
          category: skill.category,
          proficiencyLevel: skill.proficiency_level,
          experienceYears: skill.experience_years,
          isCertified: skill.is_certified
        });
      }
    });
    
    // Calculate priority development needs
    const developmentNeeds = [...gapAnalysis.roleGaps, ...gapAnalysis.projectGaps];
    const uniqueNeeds = {};
    
    developmentNeeds.forEach(gap => {
      const key = gap.skillId;
      if (!uniqueNeeds[key]) {
        uniqueNeeds[key] = {
          skillId: gap.skillId,
          skillName: gap.skillName,
          category: gap.category,
          importance: gap.importanceLevel || 3,
          currentLevel: gap.currentLevel || 0,
          sources: []
        };
      }
      
      if (gap.projectName) {
        uniqueNeeds[key].sources.push(`Project: ${gap.projectName}`);
        uniqueNeeds[key].importance = Math.max(uniqueNeeds[key].importance, gap.importanceLevel || 3);
      } else {
        uniqueNeeds[key].sources.push('Role requirement');
        uniqueNeeds[key].importance = Math.max(uniqueNeeds[key].importance, gap.importanceLevel || 3);
      }
    });
    
    gapAnalysis.developmentNeeds = Object.values(uniqueNeeds)
      .sort((a, b) => b.importance - a.importance);
    
    // If AI is available and enabled, enhance with AI insights
    let aiInsights = null;
    if (claude && options.includeAIInsights !== false) {
      aiInsights = await generateResourceAIInsights(
        resource,
        skillsResults,
        roleSkillsResults,
        projectSkillsResults,
        gapAnalysis
      );
    }
    
    return {
      resourceId,
      resourceName: resource.name,
      department: resource.department_name,
      role: resource.role_name,
      currentSkills: skillsResults,
      gapAnalysis,
      recommendations: aiInsights ? aiInsights.recommendations : generateResourceRecommendations(gapAnalysis),
      aiInsights: aiInsights ? aiInsights.insights : null,
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error analyzing skills gap for resource ${resourceId}:`, error);
    throw new Error(`Resource skills gap analysis failed: ${error.message}`);
  }
};

/**
 * Get current skills data for the organization
 * @param {string} departmentId - Optional department filter
 * @param {Array} skillCategories - Optional skill category filter
 * @returns {Promise<Object>} - Current skills data
 */
const getCurrentSkillsData = async (departmentId, skillCategories = []) => {
  try {
    // Base query for skills data
    let skillsQuery = `
      SELECT s.id, s.name, s.category, COUNT(rs.resource_id) AS resource_count,
             AVG(rs.proficiency_level) AS avg_proficiency,
             SUM(CASE WHEN rs.is_certified = 1 THEN 1 ELSE 0 END) AS certified_count
      FROM skills s
      LEFT JOIN resource_skills rs ON s.id = rs.skill_id
      LEFT JOIN resources r ON rs.resource_id = r.id
    `;
    
    const queryParams = [];
    let whereClause = ' WHERE 1=1';
    
    // Add department filter if specified
    if (departmentId) {
      whereClause += ' AND r.department_id = ?';
      queryParams.push(departmentId);
    }
    
    // Add skill category filter if specified
    if (skillCategories && skillCategories.length > 0) {
      whereClause += ' AND s.category IN (?)';
      queryParams.push(skillCategories);
    }
    
    skillsQuery += whereClause + ' GROUP BY s.id ORDER BY resource_count DESC';
    
    // Execute the query
    const [skillsResults] = await db.promise().query(skillsQuery, queryParams);
    
    // Get resource count (total, or by department)
    let resourceCountQuery = 'SELECT COUNT(*) AS total FROM resources';
    
    if (departmentId) {
      resourceCountQuery += ' WHERE department_id = ?';
    }
    
    const [resourceCountResults] = await db.promise().query(
      resourceCountQuery, 
      departmentId ? [departmentId] : []
    );
    
    const totalResources = resourceCountResults[0].total;
    
    // Process skills data
    const skills = skillsResults.map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      resourceCount: skill.resource_count,
      coveragePercentage: (skill.resource_count / totalResources) * 100,
      avgProficiency: skill.avg_proficiency || 0,
      certifiedCount: skill.certified_count,
      certificationPercentage: skill.resource_count > 0 
        ? (skill.certified_count / skill.resource_count) * 100 
        : 0
    }));
    
    // Group skills by category
    const skillsByCategory = {};
    skills.forEach(skill => {
      if (!skillsByCategory[skill.category]) {
        skillsByCategory[skill.category] = [];
      }
      skillsByCategory[skill.category].push(skill);
    });
    
    // Calculate category summaries
    const categorySummaries = {};
    Object.keys(skillsByCategory).forEach(category => {
      const categorySkills = skillsByCategory[category];
      categorySummaries[category] = {
        totalSkills: categorySkills.length,
        avgCoverage: calculateAverage(categorySkills, 'coveragePercentage'),
        avgProficiency: calculateAverage(categorySkills, 'avgProficiency'),
        topSkills: categorySkills.slice(0, 5)
      };
    });
    
    // Calculate overall summary
    const summary = {
      totalSkills: skills.length,
      totalResources: totalResources,
      avgSkillsPerResource: skills.reduce((sum, skill) => sum + skill.resourceCount, 0) / totalResources,
      skillCategories: categorySummaries,
      topSkills: skills.slice(0, 10)
    };
    
    return {
      skills,
      skillsByCategory,
      categorySummaries,
      summary
    };
  } catch (error) {
    console.error('Error getting current skills data:', error);
    throw error;
  }
};

/**
 * Get project skill requirements
 * @param {string} timeRange - Time range for projects
 * @param {string} departmentId - Optional department filter
 * @returns {Promise<Object>} - Project skill requirements
 */
const getProjectSkillRequirements = async (timeRange, departmentId) => {
  try {
    const { startDate, endDate } = convertTimeRangeToDateRange(timeRange);
    
    // Base query for project skill requirements
    let projectSkillsQuery = `
      SELECT ps.skill_id, s.name, s.category, 
             COUNT(DISTINCT ps.project_id) AS project_count,
             AVG(ps.importance_level) AS avg_importance
      FROM project_skills ps
      JOIN skills s ON ps.skill_id = s.id
      JOIN projects p ON ps.project_id = p.id
      WHERE p.start_date <= ? AND p.end_date >= ?
    `;
    
    const queryParams = [endDate, startDate];
    
    // Add department filter if specified
    if (departmentId) {
      projectSkillsQuery += ' AND p.department_id = ?';
      queryParams.push(departmentId);
    }
    
    projectSkillsQuery += ' GROUP BY ps.skill_id ORDER BY project_count DESC';
    
    // Execute the query
    const [projectSkillsResults] = await db.promise().query(projectSkillsQuery, queryParams);
    
    // Get project count
    let projectCountQuery = `
      SELECT COUNT(*) AS total 
      FROM projects 
      WHERE start_date <= ? AND end_date >= ?
    `;
    
    if (departmentId) {
      projectCountQuery += ' AND department_id = ?';
    }
    
    const [projectCountResults] = await db.promise().query(
      projectCountQuery, 
      departmentId ? [endDate, startDate, departmentId] : [endDate, startDate]
    );
    
    const totalProjects = projectCountResults[0].total;
    
    // Process project requirements data
    const requirements = projectSkillsResults.map(req => ({
      skillId: req.skill_id,
      skillName: req.name,
      category: req.category,
      projectCount: req.project_count,
      demandPercentage: (req.project_count / totalProjects) * 100,
      avgImportance: req.avg_importance || 0
    }));
    
    // Group by category
    const requirementsByCategory = {};
    requirements.forEach(req => {
      if (!requirementsByCategory[req.category]) {
        requirementsByCategory[req.category] = [];
      }
      requirementsByCategory[req.category].push(req);
    });
    
    // Calculate category summaries
    const categorySummaries = {};
    Object.keys(requirementsByCategory).forEach(category => {
      const categoryRequirements = requirementsByCategory[category];
      categorySummaries[category] = {
        totalSkills: categoryRequirements.length,
        avgDemand: calculateAverage(categoryRequirements, 'demandPercentage'),
        avgImportance: calculateAverage(categoryRequirements, 'avgImportance'),
        topSkills: categoryRequirements.slice(0, 5)
      };
    });
    
    // Calculate overall summary
    const summary = {
      totalRequirements: requirements.length,
      totalProjects: totalProjects,
      timeRange: {
        startDate,
        endDate
      },
      skillCategories: categorySummaries,
      topRequirements: requirements.slice(0, 10)
    };
    
    return {
      requirements,
      requirementsByCategory,
      categorySummaries,
      summary
    };
  } catch (error) {
    console.error('Error getting project skill requirements:', error);
    throw error;
  }
};

/**
 * Get market skill trends
 * @returns {Promise<Object>} - Market skill trends
 */
const getMarketSkillTrends = async () => {
  try {
    // Ideally, this would pull from an external API or service
    // For now, we'll use a simple database query for market trends
    
    // Query for stored market trends
    const query = `
      SELECT * 
      FROM market_skill_trends
      WHERE trend_date <= CURDATE()
      ORDER BY trend_date DESC, demand_score DESC
      LIMIT 50
    `;
    
    let marketTrends = [];
    
    try {
      const [results] = await db.promise().query(query);
      marketTrends = results;
    } catch (error) {
      console.warn('Could not retrieve market trend data. Using default values:', error.message);
      
      // Fallback to hardcoded trends if table doesn't exist
      marketTrends = [
        { skill_name: 'Cloud Computing', category: 'Technical', demand_score: 9.2, growth_rate: 27 },
        { skill_name: 'Data Science', category: 'Technical', demand_score: 9.0, growth_rate: 35 },
        { skill_name: 'Machine Learning', category: 'Technical', demand_score: 8.9, growth_rate: 32 },
        { skill_name: 'DevOps', category: 'Technical', demand_score: 8.7, growth_rate: 24 },
        { skill_name: 'Cybersecurity', category: 'Technical', demand_score: 8.6, growth_rate: 28 },
        { skill_name: 'Agile Methodology', category: 'Process', demand_score: 8.5, growth_rate: 18 },
        { skill_name: 'Big Data', category: 'Technical', demand_score: 8.4, growth_rate: 21 },
        { skill_name: 'Artificial Intelligence', category: 'Technical', demand_score: 8.3, growth_rate: 30 },
        { skill_name: 'React', category: 'Technical', demand_score: 8.2, growth_rate: 20 },
        { skill_name: 'Node.js', category: 'Technical', demand_score: 8.1, growth_rate: 17 }
      ];
    }
    
    // Process market trends
    const trends = marketTrends.map(trend => ({
      skillName: trend.skill_name,
      category: trend.category,
      demandScore: trend.demand_score,
      growthRate: trend.growth_rate,
      trendDate: trend.trend_date || new Date().toISOString().split('T')[0]
    }));
    
    // Group by category
    const trendsByCategory = {};
    trends.forEach(trend => {
      if (!trendsByCategory[trend.category]) {
        trendsByCategory[trend.category] = [];
      }
      trendsByCategory[trend.category].push(trend);
    });
    
    // Get top trends
    const topTrends = trends.slice(0, 10);
    
    return {
      trends,
      trendsByCategory,
      topTrends
    };
  } catch (error) {
    console.error('Error getting market skill trends:', error);
    return {
      trends: [],
      trendsByCategory: {},
      topTrends: []
    };
  }
};

/**
 * Calculate skills gap metrics
 * @param {Object} currentSkills - Current organizational skills
 * @param {Object} projectRequirements - Project skill requirements
 * @param {Object} marketTrends - Market skill trends
 * @returns {Object} - Skills gap analysis
 */
const calculateSkillsGap = (currentSkills, projectRequirements, marketTrends) => {
  // Create maps for easier lookup
  const skillsMap = {};
  currentSkills.skills.forEach(skill => {
    skillsMap[skill.id] = skill;
  });
  
  const reqMap = {};
  projectRequirements.requirements.forEach(req => {
    reqMap[req.skillId] = req;
  });
  
  const trendsMap = {};
  marketTrends.trends.forEach(trend => {
    trendsMap[trend.skillName.toLowerCase()] = trend;
  });
  
  // Calculate immediate gaps (project requirements not met)
  const immediateGaps = [];
  
  projectRequirements.requirements.forEach(req => {
    const skill = skillsMap[req.skillId];
    
    if (!skill) {
      // Skill not present at all
      immediateGaps.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        demandPercentage: req.demandPercentage,
        avgImportance: req.avgImportance,
        gapSeverity: 'critical',
        gapType: 'missing'
      });
    } else if (skill.coveragePercentage < 20 && req.demandPercentage > 30) {
      // Skill has low coverage but high demand
      immediateGaps.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        demandPercentage: req.demandPercentage,
        coveragePercentage: skill.coveragePercentage,
        avgImportance: req.avgImportance,
        avgProficiency: skill.avgProficiency,
        gapSeverity: 'high',
        gapType: 'low_coverage'
      });
    } else if (skill.avgProficiency < 3 && req.avgImportance > 3.5) {
      // Skill has low proficiency but high importance
      immediateGaps.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        demandPercentage: req.demandPercentage,
        coveragePercentage: skill.coveragePercentage,
        avgImportance: req.avgImportance,
        avgProficiency: skill.avgProficiency,
        gapSeverity: 'medium',
        gapType: 'low_proficiency'
      });
    }
  });
  
  // Identify emerging gaps (market trends not covered)
  const emergingGaps = [];
  
  marketTrends.topTrends.forEach(trend => {
    // Look for skill by name match (case insensitive)
    const matchingSkill = currentSkills.skills.find(
      skill => skill.name.toLowerCase() === trend.skillName.toLowerCase()
    );
    
    if (!matchingSkill && trend.demandScore > 7.5) {
      // High demand skill not present
      emergingGaps.push({
        skillName: trend.skillName,
        category: trend.category,
        demandScore: trend.demandScore,
        growthRate: trend.growthRate,
        gapSeverity: trend.demandScore > 8.5 ? 'high' : 'medium',
        gapType: 'market_trend'
      });
    } else if (matchingSkill && matchingSkill.coveragePercentage < 15 && trend.demandScore > 8) {
      // High demand skill with low coverage
      emergingGaps.push({
        skillId: matchingSkill.id,
        skillName: trend.skillName,
        category: trend.category,
        demandScore: trend.demandScore,
        growthRate: trend.growthRate,
        coveragePercentage: matchingSkill.coveragePercentage,
        avgProficiency: matchingSkill.avgProficiency,
        gapSeverity: 'medium',
        gapType: 'low_coverage_trend'
      });
    }
  });
  
  // Calculate oversupply (skills with high coverage but low demand)
  const oversupply = [];
  
  currentSkills.skills.forEach(skill => {
    const req = reqMap[skill.id];
    
    if (!req && skill.coveragePercentage > 30) {
      // Skill not required in projects but has high coverage
      oversupply.push({
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        coveragePercentage: skill.coveragePercentage,
        resourceCount: skill.resourceCount,
        avgProficiency: skill.avgProficiency,
        oversupplySeverity: skill.coveragePercentage > 60 ? 'high' : 'medium'
      });
    } else if (req && skill.coveragePercentage > 70 && req.demandPercentage < 20) {
      // Skill has much higher coverage than demand
      oversupply.push({
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        coveragePercentage: skill.coveragePercentage,
        demandPercentage: req.demandPercentage,
        resourceCount: skill.resourceCount,
        avgProficiency: skill.avgProficiency,
        oversupplySeverity: 'medium'
      });
    }
  });
  
  // Calculate skill gap score by category
  const categoryGapScores = {};
  const allCategories = new Set([
    ...Object.keys(currentSkills.categorySummaries),
    ...Object.keys(projectRequirements.categorySummaries)
  ]);
  
  allCategories.forEach(category => {
    const currentSummary = currentSkills.categorySummaries[category];
    const reqSummary = projectRequirements.categorySummaries[category];
    
    if (!currentSummary && reqSummary) {
      // Category completely missing
      categoryGapScores[category] = {
        gapScore: 1.0, // Maximum gap
        missingCategory: true,
        requiredSkills: reqSummary.totalSkills,
        availableSkills: 0,
        avgDemand: reqSummary.avgDemand,
        avgImportance: reqSummary.avgImportance
      };
    } else if (currentSummary && reqSummary) {
      // Calculate gap based on coverage vs demand
      const coverageDemandGap = Math.max(0, reqSummary.avgDemand - currentSummary.avgCoverage) / 100;
      
      // Adjust for proficiency vs importance
      const proficiencyImportanceGap = Math.max(0, (reqSummary.avgImportance / 5) - (currentSummary.avgProficiency / 5));
      
      // Combined gap score (0 to 1)
      const gapScore = (coverageDemandGap * 0.7) + (proficiencyImportanceGap * 0.3);
      
      categoryGapScores[category] = {
        gapScore,
        requiredSkills: reqSummary.totalSkills,
        availableSkills: currentSummary.totalSkills,
        avgDemand: reqSummary.avgDemand,
        avgCoverage: currentSummary.avgCoverage,
        avgImportance: reqSummary.avgImportance,
        avgProficiency: currentSummary.avgProficiency
      };
    } else if (currentSummary && !reqSummary) {
      // Category not required
      categoryGapScores[category] = {
        gapScore: 0,
        oversupply: true,
        requiredSkills: 0,
        availableSkills: currentSummary.totalSkills,
        avgCoverage: currentSummary.avgCoverage,
        avgProficiency: currentSummary.avgProficiency
      };
    }
  });
  
  // Calculate overall gap score
  const overallGapScore = calculateAverageObj(
    Object.values(categoryGapScores).filter(score => !score.oversupply), 
    'gapScore'
  );
  
  return {
    immediateGaps,
    emergingGaps,
    oversupply,
    categoryGapScores,
    overallGapScore
  };
};

/**
 * Generate basic recommendations based on skills gap analysis
 * @param {Object} gapAnalysis - Skills gap analysis results
 * @returns {Array} - List of recommendations
 */
const generateBasicRecommendations = (gapAnalysis) => {
  const recommendations = [];
  
  // Recommendations for immediate gaps
  const criticalGaps = gapAnalysis.immediateGaps.filter(gap => gap.gapSeverity === 'critical');
  const highGaps = gapAnalysis.immediateGaps.filter(gap => gap.gapSeverity === 'high');
  
  if (criticalGaps.length > 0) {
    recommendations.push({
      type: 'critical_gap',
      priority: 'high',
      description: `Address critical skill gaps in ${criticalGaps.length} skills needed for current projects.`,
      details: `Missing skills: ${criticalGaps.map(gap => gap.skillName).join(', ')}`,
      skills: criticalGaps.map(gap => ({
        name: gap.skillName,
        category: gap.category
      }))
    });
    
    // Add specific recommendation for each critical gap
    criticalGaps.forEach(gap => {
      recommendations.push({
        type: 'skill_acquisition',
        priority: 'high',
        description: `Acquire ${gap.skillName} capability through hiring or training.`,
        details: `This skill is required by ${Math.round(gap.demandPercentage)}% of projects but is not present in the organization.`,
        skill: {
          name: gap.skillName,
          category: gap.category
        }
      });
    });
  }
  
  if (highGaps.length > 0) {
    recommendations.push({
      type: 'high_gap',
      priority: 'medium',
      description: `Increase coverage of ${highGaps.length} skills with low coverage but high demand.`,
      details: `Skills with coverage gaps: ${highGaps.map(gap => gap.skillName).join(', ')}`,
      skills: highGaps.map(gap => ({
        name: gap.skillName,
        category: gap.category,
        coverage: Math.round(gap.coveragePercentage) + '%',
        demand: Math.round(gap.demandPercentage) + '%'
      }))
    });
  }
  
  // Recommendations for emerging gaps
  const emergingHighGaps = gapAnalysis.emergingGaps.filter(gap => gap.gapSeverity === 'high');
  
  if (emergingHighGaps.length > 0) {
    recommendations.push({
      type: 'emerging_trend',
      priority: 'medium',
      description: `Develop capabilities in ${emergingHighGaps.length} high-demand market skills.`,
      details: `Emerging skills: ${emergingHighGaps.map(gap => gap.skillName).join(', ')}`,
      skills: emergingHighGaps.map(gap => ({
        name: gap.skillName,
        category: gap.category,
        demandScore: gap.demandScore,
        growthRate: gap.growthRate + '%'
      }))
    });
  }
  
  // Recommendations for oversupply
  const highOversupply = gapAnalysis.oversupply.filter(item => item.oversupplySeverity === 'high');
  
  if (highOversupply.length > 0) {
    recommendations.push({
      type: 'skill_oversupply',
      priority: 'low',
      description: `Review resource allocation for ${highOversupply.length} skills with high coverage but low demand.`,
      details: `Oversupplied skills: ${highOversupply.map(item => item.skillName).join(', ')}`,
      skills: highOversupply.map(item => ({
        name: item.skillName,
        category: item.category,
        coverage: Math.round(item.coveragePercentage) + '%',
        demand: item.demandPercentage ? Math.round(item.demandPercentage) + '%' : 'Not required'
      }))
    });
  }
  
  // Recommendations by category
  const highGapCategories = Object.entries(gapAnalysis.categoryGapScores)
    .filter(([category, score]) => score.gapScore > 0.5 && !score.oversupply)
    .sort((a, b) => b[1].gapScore - a[1].gapScore);
  
  if (highGapCategories.length > 0) {
    recommendations.push({
      type: 'category_focus',
      priority: 'high',
      description: `Focus on building capabilities in ${highGapCategories.map(([category]) => category).join(', ')}.`,
      details: `These categories have significant gaps between required skills and current capabilities.`,
      categories: highGapCategories.map(([category, score]) => ({
        name: category,
        gapScore: Math.round(score.gapScore * 100) + '%',
        required: score.requiredSkills,
        available: score.availableSkills
      }))
    });
  }
  
  return recommendations;
};

/**
 * Generate resource-specific recommendations
 * @param {Object} gapAnalysis - Resource skills gap analysis
 * @returns {Array} - List of recommendations
 */
const generateResourceRecommendations = (gapAnalysis) => {
  const recommendations = [];
  
  // Recommendations for role gaps
  if (gapAnalysis.roleGaps.length > 0) {
    const missingSkills = gapAnalysis.roleGaps.filter(gap => gap.gapType === 'missing');
    const lowProficiencySkills = gapAnalysis.roleGaps.filter(gap => gap.gapType === 'low_proficiency');
    
    if (missingSkills.length > 0) {
      recommendations.push({
        type: 'role_skill_acquisition',
        priority: 'high',
        description: `Acquire ${missingSkills.length} missing skills required for current role.`,
        details: `Role requires: ${missingSkills.map(gap => gap.skillName).join(', ')}`,
        skills: missingSkills.map(gap => ({
          name: gap.skillName,
          category: gap.category,
          importance: gap.importanceLevel
        }))
      });
    }
    
    if (lowProficiencySkills.length > 0) {
      recommendations.push({
        type: 'role_skill_improvement',
        priority: 'medium',
        description: `Improve proficiency in ${lowProficiencySkills.length} important role skills.`,
        details: `Skills to improve: ${lowProficiencySkills.map(gap => gap.skillName).join(', ')}`,
        skills: lowProficiencySkills.map(gap => ({
          name: gap.skillName,
          category: gap.category,
          currentLevel: gap.currentLevel,
          importance: gap.importanceLevel
        }))
      });
    }
  }
  
  // Recommendations for project gaps
  if (gapAnalysis.projectGaps.length > 0) {
    // Group by project
    const projectGapMap = {};
    
    gapAnalysis.projectGaps.forEach(gap => {
      if (!projectGapMap[gap.projectName]) {
        projectGapMap[gap.projectName] = [];
      }
      projectGapMap[gap.projectName].push(gap);
    });
    
    // Create recommendations by project
    Object.entries(projectGapMap).forEach(([projectName, gaps]) => {
      recommendations.push({
        type: 'project_skill_gaps',
        priority: 'high',
        description: `Address ${gaps.length} skill gaps for project: ${projectName}`,
        details: `Project requires: ${gaps.map(gap => gap.skillName).join(', ')}`,
        projectName,
        skills: gaps.map(gap => ({
          name: gap.skillName,
          category: gap.category,
          gapType: gap.gapType,
          currentLevel: gap.currentLevel,
          importance: gap.importanceLevel
        }))
      });
    });
  }
  
  // Development path recommendation based on development needs
  if (gapAnalysis.developmentNeeds.length > 0) {
    const topNeeds = gapAnalysis.developmentNeeds.slice(0, 3);
    
    recommendations.push({
      type: 'development_path',
      priority: 'high',
      description: `Prioritize development of ${topNeeds.map(need => need.skillName).join(', ')}`,
      details: `These skills are high priority based on role and project requirements.`,
      developmentPath: topNeeds.map(need => ({
        name: need.skillName,
        category: need.category,
        currentLevel: need.currentLevel,
        targetLevel: Math.min(5, need.currentLevel + 2),
        importance: need.importance,
        sources: need.sources
      }))
    });
  }
  
  // Leverage strengths recommendation
  if (gapAnalysis.strengths.length > 0) {
    const topStrengths = gapAnalysis.strengths.slice(0, 3);
    
    recommendations.push({
      type: 'leverage_strengths',
      priority: 'medium',
      description: `Leverage expertise in ${topStrengths.map(strength => strength.skillName).join(', ')}`,
      details: `These strengths can be utilized for mentoring, knowledge sharing, or specialized projects.`,
      strengths: topStrengths.map(strength => ({
        name: strength.skillName,
        category: strength.category,
        proficiencyLevel: strength.proficiencyLevel,
        experienceYears: strength.experienceYears,
        isCertified: strength.isCertified
      }))
    });
  }
  
  return recommendations;
};

/**
 * Generate AI insights for organization skills gap
 * @param {Object} currentSkills - Current organizational skills
 * @param {Object} projectRequirements - Project skill requirements
 * @param {Object} marketTrends - Market skill trends
 * @param {Object} gapAnalysis - Skills gap analysis
 * @returns {Promise<Object>} - AI insights and recommendations
 */
const generateAIInsights = async (currentSkills, projectRequirements, marketTrends, gapAnalysis) => {
  if (!claude) {
    return null;
  }
  
  try {
    // Record API call in telemetry
    telemetry.recordRequest('claude_skills_gap_analysis');
    
    // Prepare data for Claude
    const prompt = `<instructions>
You are a skill gap analyst for a professional services organization. Analyze the following skills data and provide strategic insights and recommendations.
</instructions>

<organization_skills>
Total Skills: ${currentSkills.summary.totalSkills}
Total Resources: ${currentSkills.summary.totalResources}
Average Skills Per Resource: ${currentSkills.summary.avgSkillsPerResource.toFixed(1)}

Top Skills (by coverage):
${currentSkills.summary.topSkills.slice(0, 5).map(skill => 
  `- ${skill.name} (${skill.category}): ${skill.coveragePercentage.toFixed(1)}% coverage, ${skill.avgProficiency.toFixed(1)}/5 avg proficiency`
).join('\n')}

Skill Categories:
${Object.entries(currentSkills.summary.skillCategories).map(([category, summary]) => 
  `- ${category}: ${summary.totalSkills} skills, ${summary.avgCoverage.toFixed(1)}% avg coverage, ${summary.avgProficiency.toFixed(1)}/5 avg proficiency`
).join('\n')}
</organization_skills>

<project_requirements>
Total Requirements: ${projectRequirements.summary.totalRequirements}
Total Projects: ${projectRequirements.summary.totalProjects}
Time Range: ${projectRequirements.summary.timeRange.startDate} to ${projectRequirements.summary.timeRange.endDate}

Top Required Skills:
${projectRequirements.summary.topRequirements.slice(0, 5).map(req => 
  `- ${req.skillName} (${req.category}): ${req.demandPercentage.toFixed(1)}% demand, ${req.avgImportance.toFixed(1)}/5 avg importance`
).join('\n')}

Requirement Categories:
${Object.entries(projectRequirements.summary.skillCategories).map(([category, summary]) => 
  `- ${category}: ${summary.totalSkills} skills, ${summary.avgDemand.toFixed(1)}% avg demand, ${summary.avgImportance.toFixed(1)}/5 avg importance`
).join('\n')}
</project_requirements>

<market_trends>
Top Market Trends:
${marketTrends.topTrends.slice(0, 5).map(trend => 
  `- ${trend.skillName} (${trend.category}): ${trend.demandScore.toFixed(1)}/10 demand score, ${trend.growthRate}% growth rate`
).join('\n')}
</market_trends>

<gap_analysis>
Overall Gap Score: ${(gapAnalysis.overallGapScore * 100).toFixed(1)}%

Critical Immediate Gaps:
${gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical').slice(0, 3).map(gap => 
  `- ${gap.skillName} (${gap.category}): ${gap.gapType}, ${gap.demandPercentage.toFixed(1)}% demand, ${gap.avgImportance ? gap.avgImportance.toFixed(1) + '/5 importance' : 'N/A'}`
).join('\n')}

High Immediate Gaps:
${gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high').slice(0, 3).map(gap => 
  `- ${gap.skillName} (${gap.category}): ${gap.gapType}, ${gap.coveragePercentage ? gap.coveragePercentage.toFixed(1) + '% coverage' : 'missing'}, ${gap.demandPercentage.toFixed(1)}% demand`
).join('\n')}

Emerging Gaps:
${gapAnalysis.emergingGaps.slice(0, 3).map(gap => 
  `- ${gap.skillName} (${gap.category}): ${gap.gapType}, ${gap.demandScore.toFixed(1)}/10 demand score, ${gap.growthRate}% growth rate`
).join('\n')}

Category Gap Scores:
${Object.entries(gapAnalysis.categoryGapScores).filter(([_, score]) => !score.oversupply).sort((a, b) => b[1].gapScore - a[1].gapScore).slice(0, 3).map(([category, score]) => 
  `- ${category}: ${(score.gapScore * 100).toFixed(1)}% gap score, ${score.requiredSkills} required vs ${score.availableSkills} available skills`
).join('\n')}
</gap_analysis>

Based on this data, please provide:
1. 3-5 strategic insights about the organization's skills landscape and gaps
2. 4-6 actionable, prioritized recommendations for addressing the skills gaps
3. Suggested metrics to track progress in closing these gaps

Your response should focus on practical advice that would help the organization build the right capabilities for current and future needs.`;

    // Call Claude API
    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: "You are a skills gap analyst for a professional services organization, providing concise, actionable insights and recommendations."
    });
    
    // Record successful API response
    telemetry.recordSuccess(response);
    
    // Parse insights and recommendations
    const aiContent = response.content[0].text;
    const insights = [];
    const recommendations = [];
    
    // Extract insights
    const insightsMatch = aiContent.match(/strategic insights[:\s\n]+([\s\S]+?)(?=actionable|recommendations|suggested metrics|$)/i);
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
    const recommendationsMatch = aiContent.match(/recommendations[:\s\n]+([\s\S]+?)(?=suggested metrics|$)/i);
    if (recommendationsMatch && recommendationsMatch[1]) {
      const recText = recommendationsMatch[1].trim();
      recText.split(/\d+\.|\n\s*-/).filter(Boolean).forEach((rec, index) => {
        const trimmed = rec.trim();
        if (trimmed) {
          recommendations.push({
            type: 'ai',
            priority: index < 3 ? 'high' : 'medium',
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
    console.error('Error generating AI insights for skills gap analysis:', error);
    telemetry.recordError(error);
    return null;
  }
};

/**
 * Generate AI insights for resource skills gap
 * @param {Object} resource - Resource details
 * @param {Array} skills - Resource skills
 * @param {Array} roleSkills - Role expected skills
 * @param {Array} projectSkills - Project required skills
 * @param {Object} gapAnalysis - Resource skills gap analysis
 * @returns {Promise<Object>} - AI insights and recommendations
 */
const generateResourceAIInsights = async (resource, skills, roleSkills, projectSkills, gapAnalysis) => {
  if (!claude) {
    return null;
  }
  
  try {
    // Record API call in telemetry
    telemetry.recordRequest('claude_resource_skills_gap');
    
    // Prepare data for Claude
    const prompt = `<instructions>
You are a professional development advisor for a resource management system. Analyze the following resource skills data and provide personalized insights and development recommendations.
</instructions>

<resource_profile>
Name: ${resource.name}
Role: ${resource.role_name}
Department: ${resource.department_name}

Current Skills (${skills.length} total):
${skills.slice(0, 7).map(skill => 
  `- ${skill.skill_name} (${skill.category}): ${skill.proficiency_level}/5 proficiency, ${skill.experience_years || 'unknown'} years experience${skill.is_certified ? ', certified' : ''}`
).join('\n')}${skills.length > 7 ? '\n- ...' : ''}

Role Expected Skills:
${roleSkills.slice(0, 7).map(skill => 
  `- ${skill.skill_name} (${skill.category}): ${skill.importance_level}/5 importance`
).join('\n')}${roleSkills.length > 7 ? '\n- ...' : ''}

Project Required Skills:
${projectSkills.slice(0, 7).map(skill => 
  `- ${skill.skill_name} (${skill.category}): ${skill.importance_level}/5 importance, project: ${skill.project_name}`
).join('\n')}${projectSkills.length > 7 ? '\n- ...' : ''}
</resource_profile>

<gap_analysis>
Role Gaps (${gapAnalysis.roleGaps.length}):
${gapAnalysis.roleGaps.slice(0, 5).map(gap => 
  `- ${gap.skillName} (${gap.category}): ${gap.gapType}${gap.currentLevel ? ', current level: ' + gap.currentLevel + '/5' : ''}, importance: ${gap.importanceLevel}/5`
).join('\n')}${gapAnalysis.roleGaps.length > 5 ? '\n- ...' : ''}

Project Gaps (${gapAnalysis.projectGaps.length}):
${gapAnalysis.projectGaps.slice(0, 5).map(gap => 
  `- ${gap.skillName} (${gap.category}): ${gap.gapType}${gap.currentLevel ? ', current level: ' + gap.currentLevel + '/5' : ''}, importance: ${gap.importanceLevel}/5, project: ${gap.projectName}`
).join('\n')}${gapAnalysis.projectGaps.length > 5 ? '\n- ...' : ''}

Strengths (${gapAnalysis.strengths.length}):
${gapAnalysis.strengths.slice(0, 5).map(strength => 
  `- ${strength.skillName} (${strength.category}): ${strength.proficiencyLevel}/5 proficiency, ${strength.experienceYears || 'unknown'} years experience${strength.isCertified ? ', certified' : ''}`
).join('\n')}${gapAnalysis.strengths.length > 5 ? '\n- ...' : ''}

Development Needs (${gapAnalysis.developmentNeeds.length}):
${gapAnalysis.developmentNeeds.slice(0, 5).map(need => 
  `- ${need.skillName} (${need.category}): current level: ${need.currentLevel}/5, importance: ${need.importance}/5, sources: ${need.sources.join(', ')}`
).join('\n')}${gapAnalysis.developmentNeeds.length > 5 ? '\n- ...' : ''}
</gap_analysis>

Based on this data, please provide:
1. 3-4 personalized insights about the resource's skills profile, gaps, and strengths
2. 4-5 specific development recommendations, prioritized by importance
3. A suggested 6-month development plan focusing on the top 2-3 skills to improve

Your response should be practical, actionable, and tailored to this specific resource.`;

    // Call Claude API
    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: "You are a professional development advisor, providing personalized insights and development recommendations based on skills data."
    });
    
    // Record successful API response
    telemetry.recordSuccess(response);
    
    // Parse insights and recommendations
    const aiContent = response.content[0].text;
    const insights = [];
    const recommendations = [];
    
    // Extract insights
    const insightsMatch = aiContent.match(/insights[:\s\n]+([\s\S]+?)(?=development recommendations|recommendations|suggested|$)/i);
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
    const recommendationsMatch = aiContent.match(/recommendations[:\s\n]+([\s\S]+?)(?=suggested|development plan|$)/i);
    if (recommendationsMatch && recommendationsMatch[1]) {
      const recText = recommendationsMatch[1].trim();
      recText.split(/\d+\.|\n\s*-/).filter(Boolean).forEach((rec, index) => {
        const trimmed = rec.trim();
        if (trimmed) {
          recommendations.push({
            type: 'ai_development',
            priority: index < 3 ? 'high' : 'medium',
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
    console.error('Error generating AI insights for resource skills gap:', error);
    telemetry.recordError(error);
    return null;
  }
};

/**
 * Calculate average of array values for a specific property
 * @param {Array} arr - Array of objects
 * @param {string} prop - Property to average
 * @returns {number} - Average value
 */
const calculateAverage = (arr, prop) => {
  if (!arr || arr.length === 0) {
    return 0;
  }
  
  return arr.reduce((sum, item) => sum + (item[prop] || 0), 0) / arr.length;
};

/**
 * Calculate average of object values for a specific property
 * @param {Array} arr - Array of objects
 * @param {string} prop - Property to average
 * @returns {number} - Average value
 */
const calculateAverageObj = (arr, prop) => {
  if (!arr || arr.length === 0) {
    return 0;
  }
  
  return arr.reduce((sum, item) => sum + (item[prop] || 0), 0) / arr.length;
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
      endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 1);
      break;
      
    case '3months':
      startDate = new Date(now);
      endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 3);
      break;
      
    case '6months':
      startDate = new Date(now);
      endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 6);
      break;
      
    case '1year':
      startDate = new Date(now);
      endDate = new Date(now);
      endDate.setFullYear(now.getFullYear() + 1);
      break;
      
    default:
      startDate = new Date(now);
      endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 6);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

/**
 * Get all departments with skills gap analysis
 * @returns {Promise<Array>} - Departments with summary gap analysis
 */
const getAllDepartmentsGapAnalysis = async () => {
  try {
    // Get all departments
    const departmentQuery = `
      SELECT id, name
      FROM departments
    `;
    
    const [departments] = await db.promise().query(departmentQuery);
    
    if (departments.length === 0) {
      return [];
    }
    
    // Get summary gap analysis for each department
    const departmentAnalysis = [];
    
    for (const department of departments) {
      try {
        // Use a simplified analysis to avoid full computation for each department
        const analysis = await analyzeOrganizationSkillsGap({
          departmentId: department.id,
          includeAIInsights: false
        });
        
        departmentAnalysis.push({
          departmentId: department.id,
          departmentName: department.name,
          overallGapScore: analysis.gapAnalysis.overallGapScore,
          criticalGapsCount: analysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical').length,
          highGapsCount: analysis.gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high').length,
          emergingGapsCount: analysis.gapAnalysis.emergingGaps.length,
          topGaps: analysis.gapAnalysis.immediateGaps
            .filter(g => g.gapSeverity === 'critical' || g.gapSeverity === 'high')
            .slice(0, 3)
            .map(g => g.skillName)
        });
      } catch (error) {
        console.error(`Error analyzing department ${department.id}:`, error);
        departmentAnalysis.push({
          departmentId: department.id,
          departmentName: department.name,
          error: error.message
        });
      }
    }
    
    // Sort by gap score
    return departmentAnalysis.sort((a, b) => {
      if (a.error || b.error) return a.error ? 1 : -1;
      return b.overallGapScore - a.overallGapScore;
    });
  } catch (error) {
    console.error('Error getting all departments gap analysis:', error);
    throw error;
  }
};

module.exports = {
  analyzeOrganizationSkillsGap,
  analyzeDepartmentSkillsGap,
  analyzeResourceSkillsGap,
  getAllDepartmentsGapAnalysis
};
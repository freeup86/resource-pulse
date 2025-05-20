/**
 * Skills Gap Analysis Service
 * Provides AI-powered analysis of skills gaps in the organization
 */
const { sql, poolPromise } = require('../db/config');
const { Anthropic } = require('@anthropic-ai/sdk');
const telemetry = require('./aiTelemetry');

// Initialize Claude client if API key is available
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Try to use Claude, and fall back to other options if not available
let claude = null;
try {
  if (CLAUDE_API_KEY) {
    claude = new Anthropic({
      apiKey: CLAUDE_API_KEY,
    });
    console.log('Claude API initialized successfully');
  } else {
    console.log('Claude API key not provided, AI features will be limited');
  }
} catch (error) {
  console.error('Error initializing Claude API client:', error);
}

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
      skillCategories = [],
      forceFallback = false
    } = options;
    
    // Return fallback data if explicitly requested
    if (forceFallback) {
      return await provideFallbackData();
    }
    
    // Check if required tables exist
    try {
      const pool = await poolPromise;
      const tableExistsResult = await pool.request().query(`
        SELECT 
          OBJECT_ID('Skills') as skills_table,
          OBJECT_ID('ResourceSkills') as resource_skills_table,
          OBJECT_ID('ProjectSkills') as project_skills_table
      `);
      
      const tablesExist = tableExistsResult.recordset[0].skills_table && 
                         tableExistsResult.recordset[0].resource_skills_table &&
                         tableExistsResult.recordset[0].project_skills_table;
                         
      if (!tablesExist) {
        console.warn('Required skills tables do not exist, using fallback data');
        return await provideFallbackData();
      }
    } catch (error) {
      console.error('Error checking for required tables:', error);
      return await provideFallbackData();
    }
    
    try {
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
      return await provideFallbackData();
    }
  } catch (error) {
    console.error('Error analyzing organization skills gap:', error);
    throw new Error(`Skills gap analysis failed: ${error.message}`);
  }
};

/**
 * Provides fallback data when real data analysis fails
 * @returns {Promise<Object>} Fallback analysis data
 */
const provideFallbackData = async () => {
  // Try to get real skill categories from the database to make fallback data more realistic
  let categories = ["Technical", "Design", "Business"]; // Default categories if query fails
  
  try {
    const pool = await poolPromise;
    const categoriesResult = await pool.request().query(`
      SELECT DISTINCT Category FROM Skills
    `);
    
    if (categoriesResult.recordset.length > 0) {
      categories = categoriesResult.recordset.map(record => record.Category);
    }
  } catch (error) {
    console.warn('Could not fetch skill categories from database, using defaults:', error.message);
  }
  
  // Generate skill categories dynamically from the categories we found
  const skillCategories = {};
  const categoryCount = categories.length;
  const totalSkills = 45; // Total number of skills across all categories
  
  // Distribute skills among categories
  let remainingSkills = totalSkills;
  categories.forEach((category, index) => {
    // Last category gets all remaining skills
    const categorySkills = index === categoryCount - 1 
      ? remainingSkills 
      : Math.floor(totalSkills / categoryCount) + (index < totalSkills % categoryCount ? 1 : 0);
    
    remainingSkills -= categorySkills;
    
    skillCategories[category] = {
      totalSkills: categorySkills,
      avgCoverage: 25 + Math.floor(Math.random() * 20), // Random between 25-45
      avgProficiency: 3.0 + Math.random() * 0.8, // Random between 3.0-3.8
    };
  });
  
  return {
    organizationSkills: {
      totalSkills: totalSkills,
      totalResources: 25,
      avgSkillsPerResource: 4.5,
      skillCategories,
      topSkills: []
    },
    projectRequirements: {
      totalRequirements: 35,
      totalProjects: 12,
      timeRange: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      skillCategories: {},
      topRequirements: []
    },
    gapAnalysis: {
      immediateGaps: [
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
        },
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
        }
      ],
      oversupply: [],
      categoryGapScores: {
        "Technical": {
          gapScore: 0.65,
          requiredSkills: 15,
          availableSkills: 8,
        },
        "Design": {
          gapScore: 0.45,
          requiredSkills: 6,
          availableSkills: 4,
        }
      },
      overallGapScore: 0.35
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
      }
    ],
    aiInsights: [
      "The organization has significant gaps in cloud and data engineering skills, which are critical for upcoming projects.",
      "Technical skills overall show lower coverage than business skills, with particular concerns in emerging technologies.",
      "Design skills represent a key opportunity area, with growing demand but limited internal capabilities."
    ],
    marketTrends: [
      { skillName: 'Cloud Computing', category: 'Technical', demandScore: 9.2, growthRate: 27 },
      { skillName: 'Data Science', category: 'Technical', demandScore: 9.0, growthRate: 35 },
      { skillName: 'Machine Learning', category: 'Technical', demandScore: 8.9, growthRate: 32 },
      { skillName: 'DevOps', category: 'Technical', demandScore: 8.7, growthRate: 24 },
      { skillName: 'Cybersecurity', category: 'Technical', demandScore: 8.6, growthRate: 28 }
    ],
    analyzedAt: new Date().toISOString(),
    usingFallbackData: true
  };
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
    
    // Check if required tables exist
    try {
      const pool = await poolPromise;
      const tableExistsResult = await pool.request().query(`
        SELECT 
          OBJECT_ID('Resources') as resources_table,
          OBJECT_ID('ResourceSkills') as resource_skills_table,
          OBJECT_ID('Skills') as skills_table
      `);
      
      const tablesExist = tableExistsResult.recordset[0].resources_table && 
                         tableExistsResult.recordset[0].resource_skills_table &&
                         tableExistsResult.recordset[0].skills_table;
                         
      if (!tablesExist) {
        console.warn('Required skills tables do not exist, using fallback data');
        return provideFallbackResourceData(resourceId);
      }
    } catch (error) {
      console.error('Error checking for required tables:', error);
      return provideFallbackResourceData(resourceId);
    }
    
    // Get resource details
    const resourceQuery = `
      SELECT r.ResourceID, r.Name, d.DepartmentID, d.Name AS department_name, ro.RoleID, ro.Name AS role_name
      FROM Resources r
      LEFT JOIN Departments d ON r.DepartmentID = d.DepartmentID
      LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
      WHERE r.ResourceID = @resourceId
    `;
    
    const pool = await poolPromise;
    const resourceResult = await pool.request()
      .input('resourceId', sql.VarChar, resourceId)
      .query(resourceQuery);
    const resourceResults = resourceResult.recordset;
    
    if (resourceResults.length === 0) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }
    
    const resource = resourceResults[0];
    
    // Get resource skills
    const skillsQuery = `
      SELECT rs.SkillID, s.Name AS skill_name, s.Category, 
             rs.ProficiencyLevelID as proficiency_level,
             rs.Notes as experience_years,
             CASE WHEN rs.ProficiencyLevelID = 4 THEN 1 ELSE 0 END as is_certified
      FROM ResourceSkills rs
      JOIN Skills s ON rs.SkillID = s.SkillID
      WHERE rs.ResourceID = @resourceId
    `;
    
    const skillsResult = await pool.request()
      .input('resourceId', sql.VarChar, resourceId)
      .query(skillsQuery);
    const skillsResults = skillsResult.recordset;
    
    // Get role-expected skills
    const roleSkillsQuery = `
      SELECT rs.SkillID, s.Name AS skill_name, s.Category, rs.Priority as importance_level
      FROM RoleSkills rs
      JOIN Skills s ON rs.SkillID = s.SkillID
      WHERE rs.RoleID = @roleId
    `;
    
    const roleSkillsResult = await pool.request()
      .input('roleId', sql.VarChar, resource.RoleID)
      .query(roleSkillsQuery);
    const roleSkillsResults = roleSkillsResult.recordset;
    
    // Get project requirements for projects this resource is allocated to
    const projectReqQuery = `
      SELECT DISTINCT ps.SkillID, s.Name AS skill_name, s.Category, 
             ps.Priority as importance_level, p.Name AS project_name
      FROM ProjectSkills ps
      JOIN Skills s ON ps.SkillID = s.SkillID
      JOIN Projects p ON ps.ProjectID = p.ProjectID
      JOIN Allocations a ON p.ProjectID = a.ProjectID
      WHERE a.ResourceID = @resourceId AND p.EndDate >= GETDATE()
    `;
    
    const projectSkillsResult = await pool.request()
      .input('resourceId', sql.VarChar, resourceId)
      .query(projectReqQuery);
    const projectSkillsResults = projectSkillsResult.recordset;
    
    // Calculate resource-specific skills gap
    const resourceSkillsMap = {};
    skillsResults.forEach(skill => {
      resourceSkillsMap[skill.SkillID] = skill;
    });
    
    const gapAnalysis = {
      roleGaps: [],
      projectGaps: [],
      strengths: [],
      developmentNeeds: []
    };
    
    // Analyze role skill gaps
    roleSkillsResults.forEach(roleSkill => {
      const resourceSkill = resourceSkillsMap[roleSkill.SkillID];
      
      if (!resourceSkill) {
        // Missing skill for role
        gapAnalysis.roleGaps.push({
          skillId: roleSkill.SkillID,
          skillName: roleSkill.skill_name,
          category: roleSkill.category,
          importanceLevel: roleSkill.importance_level,
          gapType: 'missing'
        });
      } else if (resourceSkill.proficiency_level < 3 && roleSkill.importance_level >= 4) {
        // Low proficiency in important skill
        gapAnalysis.roleGaps.push({
          skillId: roleSkill.SkillID,
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
      const resourceSkill = resourceSkillsMap[projectSkill.SkillID];
      
      if (!resourceSkill) {
        // Missing skill for project
        gapAnalysis.projectGaps.push({
          skillId: projectSkill.SkillID,
          skillName: projectSkill.skill_name,
          category: projectSkill.category,
          importanceLevel: projectSkill.importance_level,
          projectName: projectSkill.project_name,
          gapType: 'missing'
        });
      } else if (resourceSkill.proficiency_level < 3 && projectSkill.importance_level >= 3) {
        // Low proficiency in important project skill
        gapAnalysis.projectGaps.push({
          skillId: projectSkill.SkillID,
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
          skillId: skill.SkillID,
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
      resourceName: resource.Name,
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
    return provideFallbackResourceData(resourceId);
  }
};

/**
 * Provides fallback data for resource skills gap
 * @param {string} resourceId - Resource ID
 * @returns {Object} Fallback resource data
 */
const provideFallbackResourceData = (resourceId) => {
  return {
    resourceId,
    resourceName: "Sample Resource",
    department: "Sample Department",
    role: "Developer",
    currentSkills: [
      { skill_name: "JavaScript", category: "Technical", proficiency_level: 4, is_certified: true },
      { skill_name: "React", category: "Technical", proficiency_level: 3, is_certified: false },
      { skill_name: "SQL", category: "Technical", proficiency_level: 3, is_certified: false }
    ],
    gapAnalysis: {
      roleGaps: [
        { skillName: "DevOps", category: "Technical", importanceLevel: 4, gapType: "missing" },
        { skillName: "Cloud Architecture", category: "Technical", importanceLevel: 4, gapType: "missing" }
      ],
      projectGaps: [
        { skillName: "Python", category: "Technical", importanceLevel: 3, projectName: "Data Analysis Project", gapType: "missing" }
      ],
      strengths: [
        { skillName: "JavaScript", category: "Technical", proficiencyLevel: 4, isCertified: true }
      ],
      developmentNeeds: [
        { skillName: "DevOps", category: "Technical", importance: 4, currentLevel: 0, sources: ["Role requirement"] },
        { skillName: "Cloud Architecture", category: "Technical", importance: 4, currentLevel: 0, sources: ["Role requirement"] },
        { skillName: "Python", category: "Technical", importance: 3, currentLevel: 0, sources: ["Project: Data Analysis Project"] }
      ]
    },
    recommendations: [
      {
        type: "role_skill_acquisition",
        priority: "high",
        description: "Acquire DevOps and Cloud Architecture skills needed for your role",
        details: "These skills are critical for your current role expectations",
        skills: [
          { name: "DevOps", category: "Technical", importance: 4 },
          { name: "Cloud Architecture", category: "Technical", importance: 4 }
        ]
      },
      {
        type: "project_skill_gaps",
        priority: "high",
        description: "Learn Python for the Data Analysis Project",
        details: "This skill is required for your current project assignment",
        projectName: "Data Analysis Project",
        skills: [
          { name: "Python", category: "Technical", gapType: "missing", importance: 3 }
        ]
      }
    ],
    aiInsights: [
      "Your JavaScript expertise is valuable, but expanding into DevOps and Cloud would significantly enhance your role alignment",
      "Learning Python would improve your immediate project contributions",
      "Consider a training plan that balances immediate project needs with long-term career growth in cloud technologies"
    ],
    analyzedAt: new Date().toISOString(),
    usingFallbackData: true
  };
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
      SELECT s.SkillID as id, s.Name as name, s.Category as category, COUNT(rs.ResourceID) AS resource_count,
             AVG(CAST(rs.ProficiencyLevelID AS FLOAT)) AS avg_proficiency,
             SUM(CASE WHEN rs.ProficiencyLevelID = 4 THEN 1 ELSE 0 END) AS certified_count
      FROM Skills s
      LEFT JOIN ResourceSkills rs ON s.SkillID = rs.SkillID
      LEFT JOIN Resources r ON rs.ResourceID = r.ResourceID
      WHERE 1=1
    `;
    
    const pool = await poolPromise;
    const request = pool.request();
    
    // Add department filter if specified
    if (departmentId) {
      skillsQuery += ' AND r.DepartmentID = @departmentId';
      request.input('departmentId', sql.VarChar, departmentId);
    }
    
    // Add skill category filter if specified
    if (skillCategories && skillCategories.length > 0) {
      // Use parameterized queries to prevent SQL injection
      const paramNames = [];
      
      // Create a parameter for each category
      skillCategories.forEach((category, index) => {
        const paramName = `category${index}`;
        request.input(paramName, sql.NVarChar, category);
        paramNames.push(`@${paramName}`);
      });
      
      // Add the IN clause with parameterized values
      skillsQuery += ` AND s.Category IN (${paramNames.join(',')})`;
    }
    
    skillsQuery += ' GROUP BY s.SkillID, s.Name, s.Category ORDER BY resource_count DESC';
    
    // Execute the query
    const skillsResult = await request.query(skillsQuery);
    const skillsResults = skillsResult.recordset;
    
    // Get resource count (total, or by department)
    let resourceCountQuery = 'SELECT COUNT(*) AS total FROM Resources';
    const resourceCountRequest = pool.request();
    
    if (departmentId) {
      resourceCountQuery += ' WHERE DepartmentID = @departmentId';
      resourceCountRequest.input('departmentId', sql.VarChar, departmentId);
    }
    
    const resourceCountResult = await resourceCountRequest.query(resourceCountQuery);
    const resourceCountResults = resourceCountResult.recordset;
    
    const totalResources = resourceCountResults[0].total;
    
    // Process skills data
    const skills = skillsResults.map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      resourceCount: skill.resource_count,
      coveragePercentage: totalResources ? (skill.resource_count / totalResources) * 100 : 0,
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
      avgSkillsPerResource: totalResources ? skills.reduce((sum, skill) => sum + skill.resourceCount, 0) / totalResources : 0,
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
      SELECT ps.SkillID, s.Name, s.Category, 
             COUNT(DISTINCT ps.ProjectID) AS project_count,
             AVG(CAST(ps.Priority AS FLOAT)) AS avg_importance
      FROM ProjectSkills ps
      JOIN Skills s ON ps.SkillID = s.SkillID
      JOIN Projects p ON ps.ProjectID = p.ProjectID
      WHERE p.StartDate <= @endDate AND p.EndDate >= @startDate
    `;
    
    const pool = await poolPromise;
    const request = pool.request();
    
    // Add date parameters
    request.input('endDate', sql.Date, endDate);
    request.input('startDate', sql.Date, startDate);
    
    // Add department filter if specified
    if (departmentId) {
      projectSkillsQuery += ' AND p.DepartmentID = @departmentId';
      request.input('departmentId', sql.VarChar, departmentId);
    }
    
    projectSkillsQuery += ' GROUP BY ps.SkillID, s.Name, s.Category ORDER BY project_count DESC';
    
    // Execute the query
    const projectSkillsResult = await request.query(projectSkillsQuery);
    const projectSkillsResults = projectSkillsResult.recordset;
    
    // Get project count
    let projectCountQuery = `
      SELECT COUNT(*) AS total 
      FROM Projects 
      WHERE StartDate <= @endDate AND EndDate >= @startDate
    `;
    
    const projectCountRequest = pool.request();
    projectCountRequest.input('endDate', sql.Date, endDate);
    projectCountRequest.input('startDate', sql.Date, startDate);
    
    if (departmentId) {
      projectCountQuery += ' AND DepartmentID = @departmentId';
      projectCountRequest.input('departmentId', sql.VarChar, departmentId);
    }
    
    const projectCountResult = await projectCountRequest.query(projectCountQuery);
    const projectCountResults = projectCountResult.recordset;
    
    const totalProjects = projectCountResults[0].total;
    
    // Process project requirements data
    const requirements = projectSkillsResults.map(req => ({
      skillId: req.SkillID,
      skillName: req.Name,
      category: req.Category,
      projectCount: req.project_count,
      demandPercentage: totalProjects ? (req.project_count / totalProjects) * 100 : 0,
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
      SELECT TOP 50 * 
      FROM market_skill_trends
      WHERE trend_date <= GETDATE()
      ORDER BY trend_date DESC, demand_score DESC
    `;
    
    let marketTrends = [];
    
    try {
      const pool = await poolPromise;
      // First check if table exists
      const tableExistsResult = await pool.request().query(
        `SELECT OBJECT_ID('market_skill_trends') as table_id`
      );
      
      if (tableExistsResult.recordset[0].table_id) {
        const result = await pool.request().query(query);
        marketTrends = result.recordset;
      } else {
        throw new Error("market_skill_trends table does not exist");
      }
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
  try {
    // Record API call in telemetry
    telemetry.recordRequest('skills_gap_analysis');
    
    // Prepare data for AI prompt
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

    // Try to use Claude API if available
    if (claude) {
      try {
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
        return parseAIResponse(aiContent);
      } catch (claudeError) {
        console.error('Claude API error:', claudeError);
        // Continue to fallback mechanism
      }
    }
    
    // If Claude API isn't available or failed, use rule-based approach
    console.log('Using rule-based insights and recommendations (no AI provider available)');
    return generateRuleBasedInsights(currentSkills, projectRequirements, gapAnalysis);
    
  } catch (error) {
    console.error('Error generating AI insights for skills gap analysis:', error);
    telemetry.recordError(error);
    // Generate basic insights based on gap analysis as fallback
    return generateRuleBasedInsights(currentSkills, projectRequirements, gapAnalysis);
  }
};

/**
 * Parse AI response text to extract insights and recommendations
 * @param {string} aiContent - Raw AI response text
 * @returns {Object} - Parsed insights and recommendations
 */
const parseAIResponse = (aiContent) => {
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
};

/**
 * Generate rule-based insights and recommendations when AI services are unavailable
 * @param {Object} currentSkills - Current organizational skills
 * @param {Object} projectRequirements - Project skill requirements
 * @param {Object} gapAnalysis - Skills gap analysis
 * @returns {Object} - Generated insights and recommendations
 */
const generateRuleBasedInsights = (currentSkills, projectRequirements, gapAnalysis) => {
  const insights = [];
  const recommendations = [];
  
  // Generate insights based on gap analysis
  if (gapAnalysis.overallGapScore > 0.3) {
    insights.push(`The organization has a significant skills gap (${(gapAnalysis.overallGapScore * 100).toFixed(1)}%), requiring strategic attention to workforce development and hiring.`);
  } else {
    insights.push(`The organization's overall skills gap (${(gapAnalysis.overallGapScore * 100).toFixed(1)}%) is manageable, suggesting a reasonably well-aligned workforce.`);
  }
  
  // Gap by category insight
  const categoriesWithHighGap = Object.entries(gapAnalysis.categoryGapScores)
    .filter(([_, score]) => score.gapScore > 0.4 && !score.oversupply)
    .map(([category, _]) => category);
  
  if (categoriesWithHighGap.length > 0) {
    insights.push(`${categoriesWithHighGap.join(', ')} ${categoriesWithHighGap.length === 1 ? 'is a category' : 'are categories'} with significant skill gaps requiring focused attention.`);
  }
  
  // Critical gaps insight
  const criticalGaps = gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'critical');
  if (criticalGaps.length > 0) {
    const criticalSkills = criticalGaps.map(g => g.skillName).slice(0, 3);
    insights.push(`Critical skill gaps in ${criticalSkills.join(', ')}${criticalGaps.length > 3 ? ' and others' : ''} present immediate project delivery risks.`);
  }
  
  // Recommendations based on analysis
  if (criticalGaps.length > 0) {
    recommendations.push({
      type: 'rule_based',
      priority: 'high',
      description: `Address critical skill gaps through targeted hiring and upskilling in ${criticalGaps.map(g => g.skillName).slice(0, 3).join(', ')}${criticalGaps.length > 3 ? ' and other critical areas' : ''}.`,
      details: 'These gaps present immediate risks to project delivery and should be addressed urgently.'
    });
  }
  
  // High demand areas
  const highDemandGaps = gapAnalysis.immediateGaps.filter(g => g.gapSeverity === 'high' && g.coveragePercentage && g.coveragePercentage < 20);
  if (highDemandGaps.length > 0) {
    recommendations.push({
      type: 'rule_based',
      priority: 'medium',
      description: `Increase coverage in high-demand skills like ${highDemandGaps.map(g => g.skillName).slice(0, 3).join(', ')}.`,
      details: 'These skills have high project demand but low organizational coverage.'
    });
  }
  
  // Future-focused recommendation
  const emergingGaps = gapAnalysis.emergingGaps.filter(g => g.demandScore > 8);
  if (emergingGaps.length > 0) {
    recommendations.push({
      type: 'rule_based',
      priority: 'medium',
      description: `Develop capabilities in emerging market trends: ${emergingGaps.map(g => g.skillName).slice(0, 3).join(', ')}.`,
      details: 'These skills show high growth rates in the market and will be increasingly important.'
    });
  }
  
  // Add a general recommendation about skills tracking
  recommendations.push({
    type: 'rule_based',
    priority: 'medium',
    description: 'Implement a formal skills tracking system to continuously monitor skill development and gaps.',
    details: 'Regular tracking will help measure progress and adjust strategies as needed.'
  });
  
  return {
    insights,
    recommendations
  };
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
Name: ${resource.Name}
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
    // Check if required tables exist
    try {
      const pool = await poolPromise;
      const tableExistsResult = await pool.request().query(`
        SELECT 
          OBJECT_ID('Departments') as departments_table,
          OBJECT_ID('ResourceSkills') as resource_skills_table,
          OBJECT_ID('ProjectSkills') as project_skills_table
      `);
      
      const tablesExist = tableExistsResult.recordset[0].departments_table;
      
      if (!tablesExist) {
        console.warn('Required departments table does not exist, using fallback data');
        return [
          { departmentName: "Engineering", overallGapScore: 0.65, criticalGapsCount: 3, highGapsCount: 5 },
          { departmentName: "Design", overallGapScore: 0.45, criticalGapsCount: 1, highGapsCount: 3 },
          { departmentName: "Product", overallGapScore: 0.35, criticalGapsCount: 0, highGapsCount: 2 }
        ];
      }
    } catch (error) {
      console.error('Error checking for required tables:', error);
      return [];
    }
    
    // Get all departments
    const departmentQuery = `
      SELECT DepartmentID as id, Name as name
      FROM Departments
    `;
    
    const pool = await poolPromise;
    const departmentResult = await pool.request().query(departmentQuery);
    const departments = departmentResult.recordset;
    
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
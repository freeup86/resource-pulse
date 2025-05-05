/**
 * Project Risk Analysis Service
 * Provides AI-driven risk assessment for projects based on various factors
 */
const db = require('../db/config');
const { Anthropic } = require('@anthropic-ai/sdk');
const telemetry = require('./aiTelemetry');

// Initialize Claude client if API key is available
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const claude = CLAUDE_API_KEY ? new Anthropic({
  apiKey: CLAUDE_API_KEY,
}) : null;

// Fallback risk threshold values if AI is unavailable
const DEFAULT_RISK_THRESHOLDS = {
  skillGap: 0.3,        // 30% skill gap is concerning
  allocation: 0.7,      // 70% allocation is minimum for critical roles
  timeline: 0.2,        // 20% timeline buffer is minimum
  budget: 0.15,         // 15% budget buffer is minimum
  complexity: 0.7,      // 70% complexity score is high risk
  dependencies: 0.5,    // 50% dependency risk is concerning
  teamExperience: 0.4,  // 40% team experience with similar projects is minimum
};

/**
 * Analyze project risk using AI and deterministic factors
 * @param {string} projectId - The ID of the project to analyze
 * @param {Object} options - Options for risk analysis
 * @returns {Promise<Object>} - Risk analysis results
 */
const analyzeProjectRisk = async (projectId, options = {}) => {
  try {
    // Get project details
    const project = await getProjectDetails(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Get resource allocations for the project
    const allocations = await getProjectAllocations(projectId);
    
    // Get skill requirements and team skills
    const { skillRequirements, teamSkills } = await getSkillsAnalysis(projectId, allocations);
    
    // Get project complexity factors
    const complexityFactors = await getProjectComplexity(projectId);
    
    // Get project timeline and milestone data
    const timelineData = await getProjectTimeline(projectId);
    
    // Get project dependencies
    const dependencies = await getProjectDependencies(projectId);
    
    // Calculate deterministic risk scores
    const deterministicScores = calculateDeterministicRiskScores({
      project,
      allocations,
      skillRequirements,
      teamSkills,
      complexityFactors,
      timelineData,
      dependencies
    });
    
    // If AI is available and enabled, enhance with AI insights
    let aiRiskAssessment = null;
    if (claude && (options.includeAIInsights !== false)) {
      aiRiskAssessment = await generateAIRiskAssessment({
        project,
        allocations,
        skillRequirements,
        teamSkills,
        complexityFactors,
        timelineData,
        dependencies,
        deterministicScores
      });
    }
    
    // Combine deterministic scores with AI insights
    const riskAssessment = {
      projectId,
      projectName: project.name,
      overallRiskScore: calculateOverallRiskScore(deterministicScores),
      riskLevel: determineRiskLevel(deterministicScores),
      riskFactors: deterministicScores,
      riskTrend: calculateRiskTrend(projectId),
      recommendations: aiRiskAssessment ? aiRiskAssessment.recommendations : generateFallbackRecommendations(deterministicScores),
      aiInsights: aiRiskAssessment ? aiRiskAssessment.insights : null,
      analyzedAt: new Date().toISOString(),
    };
    
    // Save risk assessment to database for trend analysis
    await saveRiskAssessment(projectId, riskAssessment);
    
    return riskAssessment;
  } catch (error) {
    console.error('Error analyzing project risk:', error);
    throw new Error(`Failed to analyze project risk: ${error.message}`);
  }
};

/**
 * Get detailed project information
 * @param {string} projectId - The project ID
 * @returns {Promise<Object>} - Project details
 */
const getProjectDetails = async (projectId) => {
  try {
    const query = `
      SELECT p.*, 
             c.target_date AS completion_date,
             c.budget,
             c.actual_spend
      FROM projects p
      LEFT JOIN project_financials c ON p.id = c.project_id
      WHERE p.id = ?
    `;
    
    const [results] = await db.promise().query(query, [projectId]);
    
    if (results.length === 0) {
      return null;
    }
    
    return results[0];
  } catch (error) {
    console.error('Error getting project details:', error);
    throw error;
  }
};

/**
 * Get all resource allocations for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} - List of allocations
 */
const getProjectAllocations = async (projectId) => {
  try {
    const query = `
      SELECT a.*, r.name AS resource_name, r.role_id, ro.name AS role_name
      FROM allocations a
      JOIN resources r ON a.resource_id = r.id
      JOIN roles ro ON r.role_id = ro.id
      WHERE a.project_id = ?
    `;
    
    const [results] = await db.promise().query(query, [projectId]);
    return results;
  } catch (error) {
    console.error('Error getting project allocations:', error);
    throw error;
  }
};

/**
 * Analyze skill requirements vs. team skills
 * @param {string} projectId - The project ID
 * @param {Array} allocations - List of resource allocations
 * @returns {Promise<Object>} - Skill requirements and team skills
 */
const getSkillsAnalysis = async (projectId, allocations) => {
  try {
    // Get project skill requirements
    const reqQuery = `
      SELECT ps.skill_id, s.name AS skill_name, ps.importance_level
      FROM project_skills ps
      JOIN skills s ON ps.skill_id = s.id
      WHERE ps.project_id = ?
    `;
    
    const [requirements] = await db.promise().query(reqQuery, [projectId]);
    
    // Get allocated resources' skills
    const resourceIds = allocations.map(a => a.resource_id);
    
    if (resourceIds.length === 0) {
      return { skillRequirements: requirements, teamSkills: [] };
    }
    
    const teamQuery = `
      SELECT rs.resource_id, rs.skill_id, s.name AS skill_name, rs.proficiency_level
      FROM resource_skills rs
      JOIN skills s ON rs.skill_id = s.id
      WHERE rs.resource_id IN (?)
    `;
    
    const [teamSkills] = await db.promise().query(teamQuery, [resourceIds]);
    
    return {
      skillRequirements: requirements,
      teamSkills
    };
  } catch (error) {
    console.error('Error analyzing skills:', error);
    throw error;
  }
};

/**
 * Get project complexity factors
 * @param {string} projectId - The project ID
 * @returns {Promise<Object>} - Complexity metrics
 */
const getProjectComplexity = async (projectId) => {
  try {
    // This would ideally pull from a project_complexity table
    // For now, we'll use a simple estimate based on project data
    
    const query = `
      SELECT 
        p.id,
        COUNT(DISTINCT a.resource_id) AS team_size,
        DATEDIFF(p.end_date, p.start_date) AS project_duration,
        (SELECT COUNT(*) FROM project_dependencies WHERE dependent_project_id = p.id) AS dependency_count,
        p.complexity_score
      FROM projects p
      LEFT JOIN allocations a ON p.id = a.project_id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    
    const [results] = await db.promise().query(query, [projectId]);
    
    if (results.length === 0) {
      return {
        teamSize: 0,
        projectDuration: 0,
        dependencyCount: 0,
        complexityScore: 0.5 // Default medium complexity
      };
    }
    
    const result = results[0];
    
    return {
      teamSize: result.team_size || 0,
      projectDuration: result.project_duration || 0,
      dependencyCount: result.dependency_count || 0,
      complexityScore: result.complexity_score || 0.5
    };
  } catch (error) {
    console.error('Error getting project complexity:', error);
    throw error;
  }
};

/**
 * Get project timeline and milestone data
 * @param {string} projectId - The project ID
 * @returns {Promise<Object>} - Timeline metrics
 */
const getProjectTimeline = async (projectId) => {
  try {
    const projectQuery = `
      SELECT 
        p.start_date,
        p.end_date,
        DATEDIFF(p.end_date, CURDATE()) AS days_remaining,
        DATEDIFF(p.end_date, p.start_date) AS total_days,
        p.percent_complete
      FROM projects p
      WHERE p.id = ?
    `;
    
    const [projectResults] = await db.promise().query(projectQuery, [projectId]);
    
    if (projectResults.length === 0) {
      return {
        daysRemaining: 0,
        totalDays: 0,
        percentComplete: 0,
        timelineRisk: 1.0, // High risk if no project data
        milestones: []
      };
    }
    
    const project = projectResults[0];
    const daysElapsed = project.total_days - project.days_remaining;
    
    // Calculate timeline risk (if percent complete is less than days elapsed percentage)
    const expectedCompletion = daysElapsed / project.total_days;
    const timelineRisk = project.percent_complete < expectedCompletion ? 
      (expectedCompletion - project.percent_complete) : 0;
    
    // Get milestone data 
    // This assumes a milestones table exists - adjust query as needed
    const milestoneQuery = `
      SELECT 
        m.id,
        m.name,
        m.due_date,
        m.completed_date,
        m.status
      FROM project_milestones m
      WHERE m.project_id = ?
      ORDER BY m.due_date
    `;
    
    let milestones = [];
    try {
      const [milestoneResults] = await db.promise().query(milestoneQuery, [projectId]);
      milestones = milestoneResults;
    } catch (error) {
      // If table doesn't exist or other error, continue with empty milestones
      console.warn('Could not retrieve milestone data:', error.message);
    }
    
    return {
      daysRemaining: project.days_remaining,
      totalDays: project.total_days,
      percentComplete: project.percent_complete,
      timelineRisk,
      milestones
    };
    
  } catch (error) {
    console.error('Error getting project timeline:', error);
    throw error;
  }
};

/**
 * Get project dependencies
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} - Project dependencies
 */
const getProjectDependencies = async (projectId) => {
  try {
    const query = `
      SELECT 
        pd.id,
        pd.dependent_project_id,
        p.name AS dependent_project_name,
        p.status AS dependent_project_status,
        p.percent_complete AS dependent_project_completion,
        pd.dependency_type,
        pd.criticality
      FROM project_dependencies pd
      JOIN projects p ON pd.dependent_project_id = p.id
      WHERE pd.project_id = ?
    `;
    
    try {
      const [results] = await db.promise().query(query, [projectId]);
      return results;
    } catch (error) {
      // If table doesn't exist or other error, return empty array
      console.warn('Could not retrieve dependency data:', error.message);
      return [];
    }
  } catch (error) {
    console.error('Error getting project dependencies:', error);
    throw error;
  }
};

/**
 * Calculate deterministic risk scores based on project data
 * @param {Object} projectData - All project related data
 * @returns {Object} - Risk scores for different factors
 */
const calculateDeterministicRiskScores = (projectData) => {
  const { 
    project, 
    allocations, 
    skillRequirements, 
    teamSkills, 
    complexityFactors,
    timelineData, 
    dependencies 
  } = projectData;
  
  // Calculate skill gap risk
  const skillGapRisk = calculateSkillGapRisk(skillRequirements, teamSkills);
  
  // Calculate allocation risk
  const allocationRisk = calculateAllocationRisk(allocations, project);
  
  // Calculate timeline risk
  const timelineRisk = calculateTimelineRisk(timelineData, project);
  
  // Calculate budget risk
  const budgetRisk = calculateBudgetRisk(project);
  
  // Calculate dependency risk
  const dependencyRisk = calculateDependencyRisk(dependencies);
  
  return {
    skillGap: skillGapRisk,
    allocation: allocationRisk,
    timeline: timelineRisk,
    budget: budgetRisk,
    complexity: complexityFactors.complexityScore || 0.5,
    dependencies: dependencyRisk
  };
};

/**
 * Calculate skill gap risk score
 * @param {Array} requirements - Required skills
 * @param {Array} teamSkills - Team's skills
 * @returns {number} - Risk score from 0-1
 */
const calculateSkillGapRisk = (requirements, teamSkills) => {
  if (!requirements || requirements.length === 0) {
    return 0.5; // Medium risk if no skill data
  }
  
  // Group team skills by skill ID
  const skillMap = {};
  teamSkills.forEach(skill => {
    if (!skillMap[skill.skill_id]) {
      skillMap[skill.skill_id] = [];
    }
    skillMap[skill.skill_id].push(skill.proficiency_level);
  });
  
  let totalRisk = 0;
  let totalWeight = 0;
  
  // Calculate risk for each required skill
  requirements.forEach(req => {
    const importanceWeight = req.importance_level || 3; // 1-5 scale
    totalWeight += importanceWeight;
    
    // If team has the skill, use highest proficiency level
    if (skillMap[req.skill_id] && skillMap[req.skill_id].length > 0) {
      const highestProficiency = Math.max(...skillMap[req.skill_id]);
      // Convert to 0-1 risk scale (5 is high proficiency, so low risk)
      const skillRisk = Math.max(0, 1 - (highestProficiency / 5));
      totalRisk += skillRisk * importanceWeight;
    } else {
      // Missing skill is high risk
      totalRisk += 1 * importanceWeight;
    }
  });
  
  return totalWeight > 0 ? (totalRisk / totalWeight) : 0.5;
};

/**
 * Calculate allocation risk score
 * @param {Array} allocations - Resource allocations
 * @param {Object} project - Project details
 * @returns {number} - Risk score from 0-1
 */
const calculateAllocationRisk = (allocations, project) => {
  if (!allocations || allocations.length === 0) {
    return 1.0; // High risk if no resources allocated
  }
  
  // Calculate total allocated hours vs. estimated needs
  const totalAllocatedPercentage = allocations.reduce((sum, a) => sum + (a.percentage || 0), 0);
  
  // This is a very simplified calculation
  // In a real scenario, you'd compare against project staffing requirements
  
  // If we have estimated_hours in the project, use that for comparison
  let allocationRisk = 0.5; // Default medium risk
  
  if (project.estimated_hours) {
    // Assuming 40 hours per week per 100% allocation
    const weeksBetween = Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / (7 * 24 * 60 * 60 * 1000));
    const totalAllocatedHours = (totalAllocatedPercentage / 100) * 40 * weeksBetween;
    allocationRisk = Math.max(0, Math.min(1, 1 - (totalAllocatedHours / project.estimated_hours)));
  } else {
    // Simple heuristic: projects typically need at least 1 FTE
    allocationRisk = Math.max(0, Math.min(1, 1 - (totalAllocatedPercentage / 100)));
  }
  
  return allocationRisk;
};

/**
 * Calculate timeline risk score
 * @param {Object} timelineData - Timeline and milestone data
 * @param {Object} project - Project details
 * @returns {number} - Risk score from 0-1
 */
const calculateTimelineRisk = (timelineData, project) => {
  if (!timelineData) {
    return 0.5; // Medium risk if no timeline data
  }
  
  let timelineRisk = 0;
  
  // Factor 1: Behind schedule risk
  if (timelineData.timelineRisk > 0) {
    timelineRisk += timelineData.timelineRisk * 0.6; // 60% weight to being behind schedule
  }
  
  // Factor 2: Approaching deadline risk
  const daysRemainingRatio = timelineData.daysRemaining / timelineData.totalDays;
  if (daysRemainingRatio < 0.2 && timelineData.percentComplete < 0.8) {
    // Less than 20% time left but less than 80% complete
    timelineRisk += 0.3; // Add 30% risk
  }
  
  // Factor 3: Missed milestones risk
  if (timelineData.milestones && timelineData.milestones.length > 0) {
    const missedMilestones = timelineData.milestones.filter(m => 
      new Date(m.due_date) < new Date() && m.status !== 'completed'
    );
    
    if (missedMilestones.length > 0) {
      timelineRisk += 0.1 * Math.min(1, missedMilestones.length / timelineData.milestones.length);
    }
  }
  
  return Math.min(1, timelineRisk);
};

/**
 * Calculate budget risk score
 * @param {Object} project - Project details with budget data
 * @returns {number} - Risk score from 0-1
 */
const calculateBudgetRisk = (project) => {
  if (!project.budget || project.budget <= 0) {
    return 0.5; // Medium risk if no budget data
  }
  
  // Calculate budget risk based on spend vs. completion
  const actualSpend = project.actual_spend || 0;
  const spendRatio = actualSpend / project.budget;
  const completionRatio = project.percent_complete / 100;
  
  if (completionRatio === 0) {
    return 0.5; // Medium risk if no completion data
  }
  
  // If spending faster than completion
  if (spendRatio > completionRatio) {
    const overspendRatio = spendRatio / completionRatio;
    return Math.min(1, (overspendRatio - 1) * 2); // Scale to 0-1
  }
  
  // If very little budget used compared to completion
  if (spendRatio < completionRatio * 0.5) {
    return 0.3; // Some risk - might indicate scope reduction
  }
  
  // Healthy spending
  return 0.1;
};

/**
 * Calculate dependency risk score
 * @param {Array} dependencies - Project dependencies
 * @returns {number} - Risk score from 0-1
 */
const calculateDependencyRisk = (dependencies) => {
  if (!dependencies || dependencies.length === 0) {
    return 0; // No risk if no dependencies
  }
  
  let totalRisk = 0;
  let totalWeight = 0;
  
  dependencies.forEach(dep => {
    const criticality = dep.criticality || 3; // 1-5 scale
    totalWeight += criticality;
    
    let dependencyRisk = 0;
    
    // Calculate risk based on dependent project status
    if (dep.dependent_project_status === 'completed') {
      dependencyRisk = 0; // No risk
    } else if (dep.dependent_project_status === 'at_risk' || dep.dependent_project_status === 'delayed') {
      dependencyRisk = 0.8; // High risk
    } else {
      // For active projects, risk based on completion percentage
      const completion = dep.dependent_project_completion / 100;
      dependencyRisk = Math.max(0, 1 - completion);
    }
    
    totalRisk += dependencyRisk * criticality;
  });
  
  return totalWeight > 0 ? (totalRisk / totalWeight) : 0;
};

/**
 * Calculate overall risk score
 * @param {Object} riskFactors - Individual risk scores
 * @returns {number} - Overall risk score from 0-1
 */
const calculateOverallRiskScore = (riskFactors) => {
  // Define weights for each risk factor
  const weights = {
    skillGap: 0.2,
    allocation: 0.15,
    timeline: 0.25,
    budget: 0.15,
    complexity: 0.1,
    dependencies: 0.15
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [factor, risk] of Object.entries(riskFactors)) {
    if (weights[factor]) {
      weightedSum += risk * weights[factor];
      totalWeight += weights[factor];
    }
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
};

/**
 * Determine risk level category based on score
 * @param {Object} riskFactors - Risk scores
 * @returns {string} - Risk level (low, medium, high, critical)
 */
const determineRiskLevel = (riskFactors) => {
  const overallRisk = calculateOverallRiskScore(riskFactors);
  
  if (overallRisk < 0.25) {
    return 'low';
  } else if (overallRisk < 0.5) {
    return 'medium';
  } else if (overallRisk < 0.75) {
    return 'high';
  } else {
    return 'critical';
  }
};

/**
 * Calculate risk trend by comparing with previous assessments
 * @param {string} projectId - The project ID
 * @returns {string} - Trend (improving, stable, deteriorating)
 */
const calculateRiskTrend = async (projectId) => {
  try {
    const query = `
      SELECT overall_risk_score, created_at
      FROM project_risk_assessments
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT 2
    `;
    
    try {
      const [results] = await db.promise().query(query, [projectId]);
      
      if (results.length < 2) {
        return 'stable'; // Not enough data to determine trend
      }
      
      const currentRisk = results[0].overall_risk_score;
      const previousRisk = results[1].overall_risk_score;
      
      const difference = currentRisk - previousRisk;
      
      if (difference < -0.05) {
        return 'improving';
      } else if (difference > 0.05) {
        return 'deteriorating';
      } else {
        return 'stable';
      }
    } catch (error) {
      // If table doesn't exist or other error
      console.warn('Could not determine risk trend:', error.message);
      return 'stable';
    }
  } catch (error) {
    console.error('Error calculating risk trend:', error);
    return 'stable';
  }
};

/**
 * Generate fallback recommendations when AI is unavailable
 * @param {Object} riskFactors - Risk scores
 * @returns {Array} - List of recommendations
 */
const generateFallbackRecommendations = (riskFactors) => {
  const recommendations = [];
  
  // Check each risk factor against thresholds
  if (riskFactors.skillGap > DEFAULT_RISK_THRESHOLDS.skillGap) {
    recommendations.push({
      factor: 'skillGap',
      recommendation: 'Address skill gaps by training or adding resources with required skills.',
      priority: riskFactors.skillGap > 0.6 ? 'high' : 'medium'
    });
  }
  
  if (riskFactors.allocation > DEFAULT_RISK_THRESHOLDS.allocation) {
    recommendations.push({
      factor: 'allocation',
      recommendation: 'Increase resource allocation to meet project needs.',
      priority: riskFactors.allocation > 0.8 ? 'high' : 'medium'
    });
  }
  
  if (riskFactors.timeline > DEFAULT_RISK_THRESHOLDS.timeline) {
    recommendations.push({
      factor: 'timeline',
      recommendation: 'Review project timeline and adjust deadlines or increase resources.',
      priority: riskFactors.timeline > 0.6 ? 'high' : 'medium'
    });
  }
  
  if (riskFactors.budget > DEFAULT_RISK_THRESHOLDS.budget) {
    recommendations.push({
      factor: 'budget',
      recommendation: 'Review project spending and adjust budget or scope.',
      priority: riskFactors.budget > 0.6 ? 'high' : 'medium'
    });
  }
  
  if (riskFactors.complexity > DEFAULT_RISK_THRESHOLDS.complexity) {
    recommendations.push({
      factor: 'complexity',
      recommendation: 'Consider breaking the project into smaller, manageable components.',
      priority: riskFactors.complexity > 0.8 ? 'high' : 'medium'
    });
  }
  
  if (riskFactors.dependencies > DEFAULT_RISK_THRESHOLDS.dependencies) {
    recommendations.push({
      factor: 'dependencies',
      recommendation: 'Monitor dependent projects closely and develop contingency plans.',
      priority: riskFactors.dependencies > 0.7 ? 'high' : 'medium'
    });
  }
  
  return recommendations;
};

/**
 * Generate AI-enhanced risk assessment
 * @param {Object} projectData - All project related data
 * @returns {Promise<Object>} - AI insights and recommendations
 */
const generateAIRiskAssessment = async (projectData) => {
  const { 
    project, 
    deterministicScores,
    timelineData,
    allocations,
    skillRequirements,
    teamSkills,
    dependencies
  } = projectData;
  
  if (!claude) {
    throw new Error('Claude API client not initialized');
  }
  
  // Prepare prompt with project data
  const prompt = `<instructions>
You are a project risk analyst with expertise in resource management and project delivery. Analyze the following project data and provide insights about risks and specific recommendations.
</instructions>

<project_data>
Project: ${project.name}
Status: ${project.status}
Timeline: ${project.start_date} to ${project.end_date}
Days Remaining: ${timelineData.daysRemaining}
Percent Complete: ${timelineData.percentComplete || 0}%

Risk Scores (0 = low risk, 1 = high risk):
- Skill Gap: ${deterministicScores.skillGap.toFixed(2)}
- Resource Allocation: ${deterministicScores.allocation.toFixed(2)}
- Timeline: ${deterministicScores.timeline.toFixed(2)}
- Budget: ${deterministicScores.budget.toFixed(2)}
- Complexity: ${deterministicScores.complexity.toFixed(2)}
- Dependencies: ${deterministicScores.dependencies.toFixed(2)}

Team Size: ${allocations.length} resources
</project_data>

Based on the above data, please provide:
1. Three key risk insights - specific factors that could impact project success
2. Four actionable recommendations to mitigate identified risks, in priority order
3. A specific risk level assessment of this project (low, medium, high, or critical)

Your response should be detailed but concise, focused on actionable insights.`;

  try {
    // Record API call in telemetry
    telemetry.recordRequest('claude_risk_assessment');
    
    // Call Claude API
    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: "You are a project risk analyst assistant that analyzes project data and provides specific, actionable risk insights and recommendations."
    });
    
    // Record successful API response
    telemetry.recordSuccess(response);
    
    // Parse insights and recommendations from Claude's response
    const aiContent = response.content[0].text;
    
    // Parse the response into structured format
    const insights = [];
    const recommendations = [];
    let riskLevel = 'medium'; // Default
    
    // Very basic parsing - in production this would be more robust
    const insightsMatch = aiContent.match(/key risk insights[:\s\n]+([\s\S]+?)(?=actionable recommendations|$)/i);
    if (insightsMatch && insightsMatch[1]) {
      const insightText = insightsMatch[1].trim();
      insightText.split(/\d+\./).filter(Boolean).forEach(insight => {
        insights.push(insight.trim());
      });
    }
    
    const recommendationsMatch = aiContent.match(/actionable recommendations[:\s\n]+([\s\S]+?)(?=risk level|$)/i);
    if (recommendationsMatch && recommendationsMatch[1]) {
      const recommendationText = recommendationsMatch[1].trim();
      recommendationText.split(/\d+\./).filter(Boolean).forEach((rec, index) => {
        recommendations.push({
          recommendation: rec.trim(),
          priority: index < 2 ? 'high' : 'medium'
        });
      });
    }
    
    const riskLevelMatch = aiContent.match(/risk level[^:]*: *([a-z]+)/i) || 
                            aiContent.match(/a (low|medium|high|critical) risk/i);
    if (riskLevelMatch && riskLevelMatch[1]) {
      riskLevel = riskLevelMatch[1].toLowerCase();
    }
    
    return {
      insights,
      recommendations,
      suggestedRiskLevel: riskLevel
    };
  } catch (error) {
    console.error('Error generating AI risk assessment:', error);
    telemetry.recordError(error);
    
    // Return null to indicate AI assessment failed
    return null;
  }
};

/**
 * Save risk assessment to database for historical tracking
 * @param {string} projectId - The project ID
 * @param {Object} assessment - The risk assessment data
 */
const saveRiskAssessment = async (projectId, assessment) => {
  try {
    // Check if table exists, create if it doesn't
    await ensureRiskAssessmentTable();
    
    const query = `
      INSERT INTO project_risk_assessments (
        project_id,
        overall_risk_score,
        risk_level,
        skill_gap_risk,
        allocation_risk,
        timeline_risk,
        budget_risk,
        complexity_risk,
        dependency_risk,
        recommendations,
        ai_insights,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const params = [
      projectId,
      assessment.overallRiskScore,
      assessment.riskLevel,
      assessment.riskFactors.skillGap,
      assessment.riskFactors.allocation,
      assessment.riskFactors.timeline,
      assessment.riskFactors.budget,
      assessment.riskFactors.complexity,
      assessment.riskFactors.dependencies,
      JSON.stringify(assessment.recommendations),
      assessment.aiInsights ? JSON.stringify(assessment.aiInsights) : null
    ];
    
    await db.promise().query(query, params);
  } catch (error) {
    console.error('Error saving risk assessment:', error);
    // Don't throw - this is a non-critical operation
  }
};

/**
 * Ensure the risk assessment table exists
 */
const ensureRiskAssessmentTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS project_risk_assessments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(36) NOT NULL,
        overall_risk_score FLOAT NOT NULL,
        risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
        skill_gap_risk FLOAT NOT NULL,
        allocation_risk FLOAT NOT NULL,
        timeline_risk FLOAT NOT NULL,
        budget_risk FLOAT NOT NULL,
        complexity_risk FLOAT NOT NULL,
        dependency_risk FLOAT NOT NULL,
        recommendations JSON,
        ai_insights JSON,
        created_at DATETIME NOT NULL,
        INDEX (project_id, created_at)
      )
    `;
    
    await db.promise().query(query);
  } catch (error) {
    console.error('Error creating risk assessment table:', error);
  }
};

/**
 * Get risk trend data for a project over time
 * @param {string} projectId - The project ID
 * @param {Object} options - Options for trend analysis
 * @returns {Promise<Object>} - Risk trend data
 */
const getProjectRiskTrend = async (projectId, options = {}) => {
  try {
    const { timeRange = '3months' } = options;
    
    // Convert timeRange to a date
    const startDate = new Date();
    if (timeRange === '1month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeRange === '3months') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (timeRange === '6months') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (timeRange === '1year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const query = `
      SELECT 
        DATE(created_at) AS assessment_date,
        overall_risk_score,
        risk_level,
        skill_gap_risk,
        allocation_risk,
        timeline_risk,
        budget_risk,
        complexity_risk,
        dependency_risk,
        recommendations,
        ai_insights
      FROM project_risk_assessments
      WHERE project_id = ? AND created_at >= ?
      ORDER BY created_at
    `;
    
    try {
      const [results] = await db.promise().query(query, [projectId, startDate]);
      
      // Group by date if multiple assessments per day
      const assessmentsByDate = {};
      results.forEach(result => {
        const dateStr = result.assessment_date.toISOString().split('T')[0];
        if (!assessmentsByDate[dateStr]) {
          assessmentsByDate[dateStr] = result;
        }
      });
      
      return {
        projectId,
        riskTrend: Object.values(assessmentsByDate),
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Could not retrieve risk trend data:', error.message);
      return {
        projectId,
        riskTrend: [],
        analyzedAt: new Date().toISOString(),
        error: 'No historical risk data available'
      };
    }
  } catch (error) {
    console.error('Error getting project risk trend:', error);
    throw new Error(`Failed to get project risk trend: ${error.message}`);
  }
};

/**
 * Compare risks across multiple projects
 * @param {Array} projectIds - List of project IDs to compare
 * @returns {Promise<Object>} - Comparative risk analysis
 */
const compareProjectRisks = async (projectIds) => {
  try {
    if (!projectIds || projectIds.length === 0) {
      throw new Error('No project IDs provided for comparison');
    }
    
    const projectRisks = [];
    
    // Get risk assessments for each project
    for (const projectId of projectIds) {
      try {
        const riskAssessment = await analyzeProjectRisk(projectId, { includeAIInsights: false });
        projectRisks.push({
          projectId,
          projectName: riskAssessment.projectName,
          overallRiskScore: riskAssessment.overallRiskScore,
          riskLevel: riskAssessment.riskLevel,
          riskFactors: riskAssessment.riskFactors
        });
      } catch (error) {
        console.error(`Error analyzing risk for project ${projectId}:`, error);
        projectRisks.push({
          projectId,
          error: error.message
        });
      }
    }
    
    // Sort by risk level (highest risk first)
    projectRisks.sort((a, b) => {
      if (a.error || b.error) return a.error ? 1 : -1;
      return b.overallRiskScore - a.overallRiskScore;
    });
    
    return {
      projectRisks,
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error comparing project risks:', error);
    throw new Error(`Failed to compare project risks: ${error.message}`);
  }
};

/**
 * Get projects at risk based on risk thresholds
 * @param {Object} options - Options for filtering projects at risk
 * @returns {Promise<Array>} - Projects at risk
 */
const getProjectsAtRisk = async (options = {}) => {
  try {
    const { 
      riskThreshold = 0.7, 
      departmentId,
      limit = 10,
      includeRiskFactors = true
    } = options;
    
    // Get active projects
    let query = `
      SELECT id, name, start_date, end_date, status, percent_complete
      FROM projects
      WHERE status != 'completed' AND status != 'cancelled'
    `;
    
    const params = [];
    
    if (departmentId) {
      query += ' AND department_id = ?';
      params.push(departmentId);
    }
    
    const [projects] = await db.promise().query(query, params);
    
    if (projects.length === 0) {
      return [];
    }
    
    const projectsAtRisk = [];
    
    // Analyze risk for each project
    for (const project of projects) {
      try {
        const riskAssessment = await analyzeProjectRisk(project.id, {
          includeAIInsights: false // Skip AI for bulk operations
        });
        
        if (riskAssessment.overallRiskScore >= riskThreshold) {
          const projectRisk = {
            projectId: project.id,
            projectName: project.name,
            startDate: project.start_date,
            endDate: project.end_date,
            status: project.status,
            percentComplete: project.percent_complete,
            overallRiskScore: riskAssessment.overallRiskScore,
            riskLevel: riskAssessment.riskLevel,
            riskTrend: riskAssessment.riskTrend
          };
          
          if (includeRiskFactors) {
            projectRisk.riskFactors = riskAssessment.riskFactors;
            projectRisk.topRecommendations = riskAssessment.recommendations.slice(0, 2);
          }
          
          projectsAtRisk.push(projectRisk);
        }
      } catch (error) {
        console.error(`Error analyzing risk for project ${project.id}:`, error);
      }
    }
    
    // Sort by risk level (highest risk first)
    projectsAtRisk.sort((a, b) => b.overallRiskScore - a.overallRiskScore);
    
    // Limit the number of results
    return projectsAtRisk.slice(0, limit);
  } catch (error) {
    console.error('Error getting projects at risk:', error);
    throw new Error(`Failed to get projects at risk: ${error.message}`);
  }
};

module.exports = {
  analyzeProjectRisk,
  getProjectRiskTrend,
  compareProjectRisks,
  getProjectsAtRisk
};
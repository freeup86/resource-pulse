// projectRiskController.js
const { poolPromise, sql } = require('../db/config');

/**
 * Get risk analysis for all projects
 * Calculates risk scores based on various project factors
 */
exports.getAllProjectRisks = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get all active projects with their key metrics
    const projectsResult = await pool.request()
      .query(`
        SELECT 
          p.ProjectID,
          p.Name,
          p.Client,
          p.Status,
          p.StartDate,
          p.EndDate,
          p.Budget,
          p.ActualCost,
          p.BudgetUtilization,
          COUNT(DISTINCT a.ResourceID) as TeamSize
        FROM Projects p
        LEFT JOIN Allocations a ON p.ProjectID = a.ProjectID AND a.EndDate >= GETDATE()
        WHERE p.Status NOT IN ('Completed', 'Cancelled')
        GROUP BY 
          p.ProjectID, p.Name, p.Client, p.Status, p.StartDate, p.EndDate, 
          p.Budget, p.ActualCost, p.BudgetUtilization
      `);
    
    const projects = projectsResult.recordset;
    
    // Calculate risk scores for each project
    const projectRisks = await Promise.all(projects.map(async (project) => {
      // Get project allocations and issues
      const allocationsQuery = await pool.request()
        .input('projectId', sql.Int, project.ProjectID)
        .query(`
          SELECT 
            a.ResourceID,
            a.StartDate,
            a.EndDate,
            a.Utilization
          FROM Allocations a
          WHERE a.ProjectID = @projectId
            AND a.EndDate >= GETDATE()
        `);
        
      const allocations = allocationsQuery.recordset;
      
      // Calculate risk factors
      const today = new Date();
      const endDate = new Date(project.EndDate);
      const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
      
      const teamSize = project.TeamSize || 0;
      const budget = project.Budget || 0;
      const actualCost = project.ActualCost || 0;
      const budgetUtilization = project.BudgetUtilization || 0;
      
      // Budget risk (higher when over budget)
      let budgetRisk = 0;
      if (budget > 0) {
        budgetRisk = Math.min(100, Math.max(0, (actualCost / budget) * 100 - 80));
      }
      
      // Timeline risk (higher when end date is close)
      let timelineRisk = 0;
      if (daysRemaining < 30) {
        timelineRisk = Math.min(100, Math.max(0, 100 - (daysRemaining * 3)));
      }
      
      // Team risk (higher when team is small or utilization is high)
      let teamRisk = 0;
      if (teamSize < 3) {
        teamRisk += 30;
      }
      
      // Calculate average utilization
      let avgUtilization = 0;
      if (allocations.length > 0) {
        avgUtilization = allocations.reduce((sum, alloc) => sum + alloc.Utilization, 0) / allocations.length;
        if (avgUtilization > 90) {
          teamRisk += 30;
        } else if (avgUtilization > 80) {
          teamRisk += 15;
        }
      }
      
      // Calculate overall risk score
      const riskScore = Math.min(100, Math.round((budgetRisk * 0.4) + (timelineRisk * 0.4) + (teamRisk * 0.2)));
      
      // Determine risk level
      let riskLevel = 'Low';
      if (riskScore >= 75) {
        riskLevel = 'High';
      } else if (riskScore >= 40) {
        riskLevel = 'Medium';
      }
      
      // Generate top risk factors
      const topRiskFactors = [];
      
      if (budgetRisk > 30) {
        topRiskFactors.push({
          name: 'Budget Overrun',
          score: Math.round(budgetRisk),
          impact: budgetRisk > 60 ? 'High' : 'Medium'
        });
      }
      
      if (timelineRisk > 30) {
        topRiskFactors.push({
          name: 'Timeline Pressure',
          score: Math.round(timelineRisk),
          impact: timelineRisk > 60 ? 'High' : 'Medium'
        });
      }
      
      if (teamRisk > 20) {
        topRiskFactors.push({
          name: 'Team Constraints',
          score: Math.round(teamRisk),
          impact: teamRisk > 40 ? 'High' : 'Medium'
        });
      }
      
      // Sort risk factors by score (descending)
      topRiskFactors.sort((a, b) => b.score - a.score);
      
      // Generate simple recommendations based on risk factors
      const recommendations = [];
      
      if (budgetRisk > 50) {
        recommendations.push('Review project scope to identify potential cost-saving opportunities');
      }
      
      if (timelineRisk > 50) {
        recommendations.push('Consider timeline extension or prioritize critical deliverables');
      }
      
      if (teamSize < 3) {
        recommendations.push('Evaluate team capacity and consider adding resources');
      }
      
      if (avgUtilization > 90) {
        recommendations.push('Team is overallocated, redistribute workload or add resources');
      }
      
      return {
        id: project.ProjectID,
        name: project.Name,
        client: project.Client,
        status: project.Status,
        startDate: project.StartDate,
        endDate: project.EndDate,
        daysRemaining,
        teamSize,
        budget,
        actualCost,
        budgetUtilization,
        riskScore,
        riskLevel,
        topRiskFactors: topRiskFactors.slice(0, 3), // Limit to top 3 factors
        recommendations: recommendations.slice(0, 3), // Limit to top 3 recommendations
        analysisTimestamp: new Date()
      };
    }));
    
    // Sort by risk score (descending)
    projectRisks.sort((a, b) => b.riskScore - a.riskScore);
    
    res.json(projectRisks);
  } catch (err) {
    console.error('Error getting project risks:', err);
    res.status(500).json({
      message: 'Error retrieving project risks',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

/**
 * Get detailed risk analysis for a specific project
 */
exports.getProjectRisk = async (req, res) => {
  try {
    const { projectId } = req.params;
    const pool = await poolPromise;
    
    // Get project details
    const projectResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          p.ProjectID,
          p.Name,
          p.Client,
          p.Status,
          p.StartDate,
          p.EndDate,
          p.Budget,
          p.ActualCost,
          p.BudgetUtilization,
          COUNT(DISTINCT a.ResourceID) as TeamSize
        FROM Projects p
        LEFT JOIN Allocations a ON p.ProjectID = a.ProjectID AND a.EndDate >= GETDATE()
        WHERE p.ProjectID = @projectId
        GROUP BY 
          p.ProjectID, p.Name, p.Client, p.Status, p.StartDate, p.EndDate, 
          p.Budget, p.ActualCost, p.BudgetUtilization
      `);
    
    if (projectResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = projectResult.recordset[0];
    
    // Get project allocations
    const allocationsQuery = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          a.ResourceID,
          a.StartDate,
          a.EndDate,
          a.Utilization,
          r.Name as ResourceName
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        WHERE a.ProjectID = @projectId
          AND a.EndDate >= GETDATE()
      `);
      
    const allocations = allocationsQuery.recordset;
    
    // Calculate risk metrics
    const today = new Date();
    const endDate = new Date(project.EndDate);
    const startDate = new Date(project.StartDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
    const totalDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const completionPercentage = totalDuration > 0 ? 
      Math.min(100, Math.max(0, Math.round(100 - (daysRemaining / totalDuration * 100)))) : 0;
    
    const teamSize = project.TeamSize || 0;
    const budget = project.Budget || 0;
    const actualCost = project.ActualCost || 0;
    const budgetUtilization = project.BudgetUtilization || 0;
    
    // Calculate detailed risk factors
    
    // 1. Budget risk
    let budgetRisk = 0;
    let budgetRiskDetails = 'Budget is on track.';
    
    if (budget > 0) {
      const budgetPercentage = (actualCost / budget) * 100;
      
      if (budgetPercentage > 100) {
        budgetRisk = 100;
        budgetRiskDetails = `Project is over budget by ${Math.round(budgetPercentage - 100)}%.`;
      } else if (budgetPercentage > 80) {
        budgetRisk = Math.round((budgetPercentage - 80) * 5); // Scale 80-100% to 0-100 risk
        budgetRiskDetails = `Project has used ${Math.round(budgetPercentage)}% of budget with ${completionPercentage}% completion.`;
      } else {
        budgetRiskDetails = `Project has used ${Math.round(budgetPercentage)}% of budget with ${completionPercentage}% completion.`;
      }
      
      // Comparison with completion percentage
      if (budgetPercentage > completionPercentage + 15) {
        budgetRisk += 20;
        budgetRiskDetails += ' Budget consumption is significantly ahead of project completion.';
      }
    }
    
    // 2. Timeline risk
    let timelineRisk = 0;
    let timelineRiskDetails = 'Timeline is on track.';
    
    if (daysRemaining < 30) {
      timelineRisk = Math.min(100, Math.max(0, 100 - (daysRemaining * 3)));
      
      if (daysRemaining < 7) {
        timelineRiskDetails = `Project is ending very soon (${daysRemaining} days remaining).`;
      } else {
        timelineRiskDetails = `Project has ${daysRemaining} days remaining.`;
      }
      
      // Check if we might be behind schedule
      if (completionPercentage < 80 && daysRemaining < 15) {
        timelineRisk += 20;
        timelineRiskDetails += ' Project may be behind schedule.';
      }
    }
    
    // 3. Team risk
    let teamRisk = 0;
    let teamRiskDetails = 'Team composition appears adequate.';
    
    if (teamSize < 3) {
      teamRisk += 30;
      teamRiskDetails = `Small team size (${teamSize} resources) may limit project capacity.`;
    }
    
    // Calculate average utilization
    let avgUtilization = 0;
    if (allocations.length > 0) {
      avgUtilization = allocations.reduce((sum, alloc) => sum + alloc.Utilization, 0) / allocations.length;
      
      if (avgUtilization > 90) {
        teamRisk += 30;
        teamRiskDetails += ` Team is heavily allocated (${Math.round(avgUtilization)}% average utilization).`;
      } else if (avgUtilization > 80) {
        teamRisk += 15;
        teamRiskDetails += ` Team utilization is high (${Math.round(avgUtilization)}%).`;
      }
    }
    
    // Calculate overall risk score
    const riskScore = Math.min(100, Math.round((budgetRisk * 0.4) + (timelineRisk * 0.4) + (teamRisk * 0.2)));
    
    // Determine risk level
    let riskLevel = 'Low';
    if (riskScore >= 75) {
      riskLevel = 'High';
    } else if (riskScore >= 40) {
      riskLevel = 'Medium';
    }
    
    // Generate AI assessment
    let aiAssessment = `This project has an overall risk score of ${riskScore}/100, categorized as ${riskLevel} risk. `;
    
    if (riskScore >= 75) {
      aiAssessment += 'Immediate attention is required to address critical risk factors. ';
    } else if (riskScore >= 40) {
      aiAssessment += 'Regular monitoring and proactive management is recommended. ';
    } else {
      aiAssessment += 'The project appears to be progressing well with minimal risk factors. ';
    }
    
    // Add specific risk highlights
    if (budgetRisk > 50) {
      aiAssessment += `Budget concerns are a major risk factor (${Math.round(budgetRisk)}/100). `;
    }
    
    if (timelineRisk > 50) {
      aiAssessment += `Timeline pressure is significant (${Math.round(timelineRisk)}/100). `;
    }
    
    if (teamRisk > 30) {
      aiAssessment += `Team constraints may impact delivery (${Math.round(teamRisk)}/100). `;
    }
    
    // Generate fake risk history (last 5 data points)
    const riskHistory = [];
    const currentDate = new Date();
    let prevRiskScore = riskScore;
    
    for (let i = 4; i >= 0; i--) {
      const historyDate = new Date(currentDate);
      historyDate.setDate(historyDate.getDate() - (i * 7)); // weekly data points
      
      // Add some random variation but with a trend toward current score
      const randomVariation = Math.floor(Math.random() * 20) - 10; // -10 to +10
      let historicalScore = Math.max(0, Math.min(100, prevRiskScore + randomVariation));
      
      // More recent points should be closer to current score
      if (i <= 2) {
        historicalScore = prevRiskScore * 0.8 + historicalScore * 0.2;
      }
      
      historicalScore = Math.round(historicalScore);
      prevRiskScore = historicalScore;
      
      riskHistory.push({
        date: historyDate.toISOString().split('T')[0],
        score: historicalScore
      });
    }
    
    // Add current score as last point
    riskHistory.push({
      date: currentDate.toISOString().split('T')[0], 
      score: riskScore
    });
    
    // Compile response
    const riskAnalysis = {
      id: project.ProjectID,
      name: project.Name,
      client: project.Client,
      status: project.Status,
      startDate: project.StartDate,
      endDate: project.EndDate,
      daysRemaining,
      completionPercentage,
      teamSize,
      allocations: allocations.map(a => ({
        resourceId: a.ResourceID,
        resourceName: a.ResourceName,
        startDate: a.StartDate,
        endDate: a.EndDate,
        utilization: a.Utilization
      })),
      budget,
      actualCost,
      budgetUtilization,
      riskScore,
      riskLevel,
      riskSummary: `This project has a ${riskLevel.toLowerCase()} risk level with a score of ${riskScore}/100.`,
      aiAssessment,
      riskHistory,
      analysisTimestamp: new Date()
    };
    
    res.json(riskAnalysis);
  } catch (err) {
    console.error(`Error getting risk for project ${req.params.projectId}:`, err);
    res.status(500).json({
      message: 'Error retrieving project risk',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

/**
 * Get risk factors for a project
 */
exports.getProjectRiskFactors = async (req, res) => {
  try {
    const { projectId } = req.params;
    const pool = await poolPromise;
    
    // Get project details (to calculate risk factors)
    const projectResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          p.ProjectID,
          p.Name,
          p.Client,
          p.Status,
          p.StartDate,
          p.EndDate,
          p.Budget,
          p.ActualCost,
          p.BudgetUtilization,
          COUNT(DISTINCT a.ResourceID) as TeamSize
        FROM Projects p
        LEFT JOIN Allocations a ON p.ProjectID = a.ProjectID AND a.EndDate >= GETDATE()
        WHERE p.ProjectID = @projectId
        GROUP BY 
          p.ProjectID, p.Name, p.Client, p.Status, p.StartDate, p.EndDate, 
          p.Budget, p.ActualCost, p.BudgetUtilization
      `);
    
    if (projectResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = projectResult.recordset[0];
    
    // Get project allocations
    const allocationsQuery = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          a.ResourceID,
          a.Utilization,
          r.Name as ResourceName
        FROM Allocations a
        INNER JOIN Resources r ON a.ResourceID = r.ResourceID
        WHERE a.ProjectID = @projectId
          AND a.EndDate >= GETDATE()
      `);
      
    const allocations = allocationsQuery.recordset;
    
    // Calculate risk metrics
    const today = new Date();
    const endDate = new Date(project.EndDate);
    const startDate = new Date(project.StartDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
    const totalDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const completionPercentage = totalDuration > 0 ? 
      Math.min(100, Math.max(0, Math.round(100 - (daysRemaining / totalDuration * 100)))) : 0;
    
    const teamSize = project.TeamSize || 0;
    const budget = project.Budget || 0;
    const actualCost = project.ActualCost || 0;
    
    // Calculate detailed risk factors
    const factors = [];
    
    // 1. Budget Risk
    if (budget > 0) {
      const budgetPercentage = (actualCost / budget) * 100;
      let budgetRisk = 0;
      let budgetImpact = 'Low';
      
      if (budgetPercentage > 100) {
        budgetRisk = 100;
        budgetImpact = 'High';
      } else if (budgetPercentage > 80) {
        budgetRisk = Math.round((budgetPercentage - 80) * 5); // Scale 80-100% to 0-100 risk
        budgetImpact = budgetRisk > 60 ? 'High' : 'Medium';
      }
      
      // Compare with completion percentage
      if (budgetPercentage > completionPercentage + 15) {
        budgetRisk = Math.min(100, budgetRisk + 20);
        budgetImpact = 'High';
      }
      
      factors.push({
        name: 'Budget Risk',
        score: budgetRisk,
        impact: budgetImpact,
        description: `Budget consumption is at ${Math.round(budgetPercentage)}% while project completion is at ${completionPercentage}%.`,
        details: [
          `Project budget: $${budget.toLocaleString()}`,
          `Current spend: $${actualCost.toLocaleString()}`,
          `${budgetPercentage > 100 ? 'Over budget by' : 'Budget remaining'}: ${budgetPercentage > 100 ? 
            '$' + (actualCost - budget).toLocaleString() : 
            '$' + (budget - actualCost).toLocaleString()}`
        ]
      });
    }
    
    // 2. Timeline Risk
    let timelineRisk = 0;
    let timelineImpact = 'Low';
    
    if (daysRemaining < 30) {
      timelineRisk = Math.min(100, Math.max(0, 100 - (daysRemaining * 3)));
      timelineImpact = timelineRisk > 60 ? 'High' : 'Medium';
    }
    
    // Check if we might be behind schedule
    if (completionPercentage < 80 && daysRemaining < 15) {
      timelineRisk = Math.min(100, timelineRisk + 20);
      timelineImpact = 'High';
    }
    
    factors.push({
      name: 'Timeline Risk',
      score: timelineRisk,
      impact: timelineImpact,
      description: `Project has ${daysRemaining} days remaining with ${completionPercentage}% completion.`,
      details: [
        `Project end date: ${new Date(project.EndDate).toISOString().split('T')[0]}`,
        `Days remaining: ${daysRemaining}`,
        `Completion percentage: ${completionPercentage}%`
      ]
    });
    
    // 3. Team Risk
    let teamRisk = 0;
    let teamImpact = 'Low';
    
    if (teamSize < 3) {
      teamRisk += 30;
      teamImpact = 'Medium';
    }
    
    // Calculate average utilization
    let avgUtilization = 0;
    if (allocations.length > 0) {
      avgUtilization = allocations.reduce((sum, alloc) => sum + alloc.Utilization, 0) / allocations.length;
      
      if (avgUtilization > 90) {
        teamRisk += 30;
        teamImpact = 'High';
      } else if (avgUtilization > 80) {
        teamRisk += 15;
        teamImpact = teamRisk > 30 ? 'High' : 'Medium';
      }
    }
    
    teamRisk = Math.min(100, teamRisk);
    
    factors.push({
      name: 'Team Constraints',
      score: teamRisk,
      impact: teamImpact,
      description: `Team has ${teamSize} members with average utilization of ${Math.round(avgUtilization)}%.`,
      details: [
        `Team size: ${teamSize} resources`,
        `Average utilization: ${Math.round(avgUtilization)}%`,
        `${teamSize < 3 ? 'Warning: Small team size may limit capacity' : ''}`,
        `${avgUtilization > 90 ? 'Warning: Team is overallocated' : ''}`
      ].filter(Boolean)
    });
    
    // 4. Add a resource complexity risk factor
    let complexityRisk = 0;
    let complexityDetails = [];
    
    if (teamSize > 10) {
      complexityRisk += 30;
      complexityDetails.push('Large team size increases coordination complexity');
    }
    
    // More complexity for shorter timeline with many resources
    if (teamSize > 5 && daysRemaining < 30) {
      complexityRisk += 20;
      complexityDetails.push('Coordinating multiple resources on a tight timeline adds complexity');
    }
    
    // More complexity for higher budget projects
    if (budget > 500000) {
      complexityRisk += 20;
      complexityDetails.push('High budget project requires additional governance and oversight');
    }
    
    complexityRisk = Math.min(100, complexityRisk);
    let complexityImpact = 'Low';
    if (complexityRisk > 60) {
      complexityImpact = 'High';
    } else if (complexityRisk > 30) {
      complexityImpact = 'Medium';
    }
    
    factors.push({
      name: 'Project Complexity',
      score: complexityRisk,
      impact: complexityImpact,
      description: 'Assessment of project structural complexity and management overhead.',
      details: complexityDetails.length > 0 ? complexityDetails : ['Project complexity appears manageable']
    });
    
    // Sort factors by score (descending)
    factors.sort((a, b) => b.score - a.score);
    
    res.json({
      projectId: project.ProjectID,
      projectName: project.Name,
      factors
    });
  } catch (err) {
    console.error(`Error getting risk factors for project ${req.params.projectId}:`, err);
    res.status(500).json({
      message: 'Error retrieving project risk factors',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

/**
 * Get risk mitigation recommendations
 */
exports.getRiskMitigations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const pool = await poolPromise;
    
    // Get project details
    const projectResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          p.ProjectID,
          p.Name,
          p.Client,
          p.Status,
          p.StartDate,
          p.EndDate,
          p.Budget,
          p.ActualCost,
          p.BudgetUtilization,
          COUNT(DISTINCT a.ResourceID) as TeamSize
        FROM Projects p
        LEFT JOIN Allocations a ON p.ProjectID = a.ProjectID AND a.EndDate >= GETDATE()
        WHERE p.ProjectID = @projectId
        GROUP BY 
          p.ProjectID, p.Name, p.Client, p.Status, p.StartDate, p.EndDate, 
          p.Budget, p.ActualCost, p.BudgetUtilization
      `);
    
    if (projectResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = projectResult.recordset[0];
    
    // Calculate risk metrics
    const today = new Date();
    const endDate = new Date(project.EndDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
    const teamSize = project.TeamSize || 0;
    const budget = project.Budget || 0;
    const actualCost = project.ActualCost || 0;
    
    // Generate risk mitigation recommendations based on project metrics
    const mitigations = [];
    
    // Budget-related recommendations
    if (budget > 0 && actualCost > budget * 0.8) {
      mitigations.push({
        title: 'Budget Optimization',
        description: 'Project is approaching or exceeding budget limits. Consider a detailed cost review and optimization.',
        impactAreas: ['Cost', 'Planning'],
        expectedRiskReduction: 20
      });
      
      mitigations.push({
        title: 'Scope Adjustment',
        description: 'Review and potentially reduce project scope to align with available budget. Focus on must-have vs. nice-to-have features.',
        impactAreas: ['Scope', 'Cost'],
        expectedRiskReduction: 15
      });
    }
    
    // Timeline-related recommendations
    if (daysRemaining < 30) {
      mitigations.push({
        title: 'Timeline Extension Assessment',
        description: 'Evaluate the impact of extending the project timeline. Calculate the cost-benefit ratio of an extension.',
        impactAreas: ['Timeline', 'Planning'],
        expectedRiskReduction: 25
      });
      
      mitigations.push({
        title: 'Deliverable Prioritization',
        description: 'Prioritize remaining deliverables by critical importance. Consider phasing less critical items into a future release.',
        impactAreas: ['Scope', 'Timeline'],
        expectedRiskReduction: 20
      });
    }
    
    // Team-related recommendations
    if (teamSize < 3) {
      mitigations.push({
        title: 'Resource Allocation Review',
        description: 'Team size appears insufficient for project scope. Consider adding resources or adjusting project expectations.',
        impactAreas: ['Resources', 'Capacity'],
        expectedRiskReduction: 30
      });
    }
    
    // Add some general recommendations
    mitigations.push({
      title: 'Risk Monitoring Cadence',
      description: 'Implement a weekly risk review meeting with key stakeholders to proactively identify and address emerging issues.',
      impactAreas: ['Governance', 'Communication'],
      expectedRiskReduction: 15
    });
    
    mitigations.push({
      title: 'Client Expectation Management',
      description: 'Ensure regular client updates with transparent status reports and proactive identification of potential issues.',
      impactAreas: ['Communication', 'Stakeholder Management'],
      expectedRiskReduction: 10
    });
    
    res.json(mitigations);
  } catch (err) {
    console.error(`Error getting risk mitigations for project ${req.params.projectId}:`, err);
    res.status(500).json({
      message: 'Error retrieving risk mitigation recommendations',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};
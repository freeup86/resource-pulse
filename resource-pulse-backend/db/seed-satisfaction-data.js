/**
 * Client Satisfaction Data Seed Script
 * 
 * This script populates client satisfaction data for the ResourcePulse database.
 * It creates realistic predictions for client satisfaction based on project allocations.
 */

const { poolPromise, sql } = require('./config');

// Helper function to get random number in range (inclusive)
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to get random item from array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to get risk level based on satisfaction score
const getRiskLevel = (satisfactionScore) => {
  if (satisfactionScore >= 75) return 'low';
  if (satisfactionScore >= 50) return 'medium';
  return 'high';
};

// Mock factors data
const positiveFactorsByRisk = {
  low: [
    "Strong technical skills match project requirements",
    "Excellent communication with client stakeholders",
    "Consistent on-time delivery of milestones",
    "Proactive problem-solving approach",
    "High quality of deliverables",
    "Detailed documentation and knowledge sharing",
    "Flexibility in accommodating requirement changes",
    "Previous positive experience with this client",
    "Strong understanding of client's business domain",
    "Regular status updates and transparency"
  ],
  medium: [
    "Adequate technical skills for project requirements",
    "Satisfactory communication with stakeholders",
    "Generally on-time deliveries with occasional delays",
    "Ability to solve problems when identified",
    "Acceptable quality of deliverables",
    "Sufficient documentation provided",
    "Some flexibility in handling changes",
    "Some familiarity with client's business domain",
    "Consistent status reporting"
  ],
  high: [
    "Technical skills partially match requirements",
    "Communication is present but inconsistent",
    "Occasionally meets deadlines",
    "Responds to clearly defined problems"
  ]
};

const negativeFactorsByRisk = {
  low: [
    "Occasional minor delays in response time",
    "Slight learning curve with new technologies"
  ],
  medium: [
    "Some delays in milestone deliveries",
    "Occasional communication gaps",
    "Moderate learning curve with project technologies",
    "Variable quality in documentation",
    "Reactive rather than proactive approach to issues",
    "Limited experience with client's business domain"
  ],
  high: [
    "Significant delays in milestone deliveries",
    "Frequent communication gaps with stakeholders",
    "Technical skills gap affecting deliverables",
    "Quality issues requiring rework",
    "Poor documentation practices",
    "Limited understanding of requirements",
    "Difficulties adapting to requirement changes",
    "Lack of proactive issue identification",
    "Limited availability due to competing priorities",
    "History of missed deadlines with this client"
  ]
};

const recommendationsByRisk = {
  low: [
    "Continue regular status updates to maintain transparency",
    "Proactively identify opportunities for process improvements",
    "Document successful approaches for knowledge sharing",
    "Schedule periodic client satisfaction reviews",
    "Look for opportunities to exceed expectations"
  ],
  medium: [
    "Increase communication frequency with key stakeholders",
    "Provide more detailed status updates on milestones",
    "Implement additional quality assurance measures",
    "Schedule training for identified skill gap areas",
    "Improve documentation quality and consistency",
    "Hold weekly internal reviews to catch issues early",
    "Assign a backup resource for knowledge sharing"
  ],
  high: [
    "Establish daily check-ins with client stakeholders",
    "Develop detailed improvement plan for deliverables",
    "Provide additional senior resource support",
    "Implement rigorous quality review process",
    "Create comprehensive documentation standards",
    "Consider resource reassignment if issues persist",
    "Schedule urgent client expectation reset meeting",
    "Develop skills improvement plan for identified gaps",
    "Implement pair programming or shadowing",
    "Increase oversight from project management"
  ]
};

// Generate random satisfaction predictions
const generateSatisfactionPrediction = (projectId, resourceId, allocationData) => {
  // Base satisfaction is random but weighted by:
  // 1. Utilization - higher utilization might lead to lower satisfaction (over-allocation)
  // 2. Project duration - shorter remaining time might increase pressure
  
  const utilization = allocationData.utilization;
  const daysAllocated = Math.floor((new Date(allocationData.endDate) - new Date(allocationData.startDate)) / (1000 * 60 * 60 * 24));
  const utilizationFactor = utilization > 80 ? -10 : utilization < 40 ? -5 : 5;
  const durationFactor = daysAllocated < 30 ? -5 : daysAllocated > 90 ? 5 : 0;
  
  // Random base satisfaction between 30 and 90
  const baseSatisfaction = getRandomInt(30, 90);
  
  // Adjusted satisfaction with factors
  let satisfactionScore = Math.min(100, Math.max(0, baseSatisfaction + utilizationFactor + durationFactor));
  
  // Determine risk level
  const riskLevel = getRiskLevel(satisfactionScore);
  
  // Generate random factors based on risk level
  const numPositiveFactors = getRandomInt(1, riskLevel === 'high' ? 2 : (riskLevel === 'medium' ? 3 : 5));
  const numNegativeFactors = getRandomInt(riskLevel === 'high' ? 3 : (riskLevel === 'medium' ? 2 : 1), 
                                         riskLevel === 'high' ? 5 : (riskLevel === 'medium' ? 3 : 2));
  
  // Randomly select factors without duplicates
  const positiveFactors = [];
  const negativeFactors = [];
  
  // Helper to get unique random factors
  const getUniqueRandomFactors = (factorArray, count) => {
    const shuffled = [...factorArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };
  
  // Get positive factors
  const posFactorsPool = positiveFactorsByRisk[riskLevel];
  positiveFactors.push(...getUniqueRandomFactors(posFactorsPool, numPositiveFactors));
  
  // Get negative factors
  const negFactorsPool = negativeFactorsByRisk[riskLevel];
  negativeFactors.push(...getUniqueRandomFactors(negFactorsPool, numNegativeFactors));
  
  // Get recommendations
  const numRecommendations = getRandomInt(2, 4);
  const recommendationsPool = recommendationsByRisk[riskLevel];
  const recommendations = getUniqueRandomFactors(recommendationsPool, numRecommendations);
  
  // Calculate confidence score (higher for extreme values, lower for middle values)
  const distanceFromMiddle = Math.abs(satisfactionScore - 50) / 50; // 0 at middle, 1 at extremes
  const confidenceScore = 0.6 + (distanceFromMiddle * 0.3); // Range 0.6 - 0.9
  
  return {
    projectId,
    resourceId,
    satisfactionProbability: Math.round(satisfactionScore),
    positiveFactors: JSON.stringify(positiveFactors),
    negativeFactors: JSON.stringify(negativeFactors),
    recommendations: JSON.stringify(recommendations),
    riskLevel,
    confidenceScore: parseFloat(confidenceScore.toFixed(2)),
    aiGenerated: Math.random() > 0.5 ? 1 : 0 // Randomly mark some as AI generated
  };
};

// Generate random client satisfaction ratings (actual feedback)
const generateSatisfactionRatings = (projectId, resourceId, predictionScore) => {
  // Determine if we should generate a rating (70% chance)
  if (Math.random() > 0.7) return null;
  
  // Generate rating based on prediction but with some randomness
  // This creates a realistic scenario where predictions aren't always perfect
  const predictionDeviation = getRandomInt(-1, 1);
  const baseRating = Math.round(predictionScore / 20); // Convert 0-100 to 0-5 scale
  const rating = Math.min(5, Math.max(1, baseRating + predictionDeviation));
  
  // Generate random feedback based on rating
  const positiveComments = [
    "Excellent work and communication throughout the project.",
    "Very satisfied with the quality of work delivered.",
    "Exceeded our expectations in both delivery and quality.",
    "Great technical skills and problem-solving abilities.",
    "Very responsive and proactive in addressing our needs."
  ];
  
  const neutralComments = [
    "Satisfactory work with room for improvement in communication.",
    "Met expectations but deadlines were tight at times.",
    "Adequate technical skills for the project requirements.",
    "Work was completed as expected with some minor issues.",
    "Generally good quality with occasional inconsistencies."
  ];
  
  const negativeComments = [
    "Multiple issues with deliverable quality requiring revisions.",
    "Communication gaps created challenges throughout the project.",
    "Deadlines were consistently missed without proper notification.",
    "Technical skills gap was evident and affected project progress.",
    "Documentation was insufficient and created knowledge transfer issues."
  ];
  
  let feedback = '';
  if (rating >= 4) {
    feedback = getRandomItem(positiveComments);
  } else if (rating >= 3) {
    feedback = getRandomItem(neutralComments);
  } else {
    feedback = getRandomItem(negativeComments);
  }
  
  // Random rater names
  const raters = [
    "Client PM",
    "Project Sponsor",
    "Department Head",
    "Technical Lead",
    "Product Owner"
  ];
  
  return {
    projectId,
    resourceId,
    rating,
    feedback,
    ratedBy: getRandomItem(raters)
  };
};

// Main function to seed satisfaction data
const seedSatisfactionData = async () => {
  try {
    console.log('======================================================');
    console.log('SEEDING CLIENT SATISFACTION DATA');
    console.log('======================================================');
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // First run the SQL script to create tables if they don't exist
      console.log('Checking and creating required tables...');
      
      // Check if SatisfactionPredictions table exists
      const tableCheck = await transaction.request().query(`
        SELECT 1 FROM sys.tables WHERE name = 'SatisfactionPredictions'
      `);
      
      if (tableCheck.recordset.length === 0) {
        console.log('Tables need to be created. Please run client-satisfaction-tables.sql first.');
        await transaction.rollback();
        return;
      }
      
      // Check if predictions already exist
      const predictionsCheck = await transaction.request().query(`
        SELECT COUNT(*) as count FROM SatisfactionPredictions
      `);
      
      if (predictionsCheck.recordset[0].count > 0) {
        console.log('Your database already contains satisfaction predictions.');
        console.log('Do you want to remove existing predictions and generate new ones? (Y/N)');
        console.log('Proceeding with clearing existing data and generating new predictions...');
        
        // Clear existing predictions
        await transaction.request().query(`
          DELETE FROM SatisfactionPredictions;
          DELETE FROM SatisfactionRatings;
        `);
        
        console.log('Existing satisfaction data cleared.');
      }
      
      // Get all active allocations
      console.log('Fetching current allocations...');
      const allocationsResult = await transaction.request().query(`
        SELECT a.AllocationID, a.ProjectID, a.ResourceID, 
               a.StartDate, a.EndDate, a.Utilization,
               p.Name AS ProjectName, r.Name AS ResourceName
        FROM Allocations a
        JOIN Projects p ON a.ProjectID = p.ProjectID
        JOIN Resources r ON a.ResourceID = r.ResourceID
        WHERE a.EndDate >= GETDATE()
      `);
      
      const allocations = allocationsResult.recordset;
      console.log(`Found ${allocations.length} active allocations.`);
      
      if (allocations.length === 0) {
        console.log('No active allocations found. Please create allocations first.');
        await transaction.rollback();
        return;
      }
      
      // Generate predictions for each allocation
      console.log('Generating satisfaction predictions...');
      let predictionsAdded = 0;
      let ratingsAdded = 0;
      
      for (const allocation of allocations) {
        // Generate prediction
        const prediction = generateSatisfactionPrediction(
          allocation.ProjectID,
          allocation.ResourceID,
          allocation
        );
        
        // Insert prediction
        try {
          await transaction.request()
            .input('projectId', sql.Int, prediction.projectId)
            .input('resourceId', sql.Int, prediction.resourceId)
            .input('satisfactionProbability', sql.Int, prediction.satisfactionProbability)
            .input('positiveFactors', sql.NVarChar(sql.MAX), prediction.positiveFactors)
            .input('negativeFactors', sql.NVarChar(sql.MAX), prediction.negativeFactors)
            .input('recommendations', sql.NVarChar(sql.MAX), prediction.recommendations)
            .input('riskLevel', sql.NVarChar(20), prediction.riskLevel)
            .input('confidenceScore', sql.Float, prediction.confidenceScore)
            .input('aiGenerated', sql.Bit, prediction.aiGenerated)
            .query(`
              INSERT INTO SatisfactionPredictions (
                ProjectID, ResourceID, SatisfactionProbability, 
                PositiveFactors, NegativeFactors, Recommendations, 
                RiskLevel, ConfidenceScore, AIGenerated, 
                PredictionDate
              )
              VALUES (
                @projectId, @resourceId, @satisfactionProbability, 
                @positiveFactors, @negativeFactors, @recommendations, 
                @riskLevel, @confidenceScore, @aiGenerated, 
                DATEADD(day, -${getRandomInt(0, 14)}, GETDATE())
              )
            `);
          
          predictionsAdded++;
          
          // Generate possible ratings
          const rating = generateSatisfactionRatings(
            allocation.ProjectID,
            allocation.ResourceID,
            prediction.satisfactionProbability
          );
          
          if (rating) {
            await transaction.request()
              .input('projectId', sql.Int, rating.projectId)
              .input('resourceId', sql.Int, rating.resourceId)
              .input('rating', sql.Int, rating.rating)
              .input('feedback', sql.NVarChar(sql.MAX), rating.feedback)
              .input('ratedBy', sql.NVarChar(100), rating.ratedBy)
              .query(`
                INSERT INTO SatisfactionRatings (
                  ProjectID, ResourceID, Rating, Feedback, RatedBy, RatingDate
                )
                VALUES (
                  @projectId, @resourceId, @rating, @feedback, @ratedBy,
                  DATEADD(day, -${getRandomInt(1, 30)}, GETDATE())
                )
              `);
            
            ratingsAdded++;
          }
        } catch (err) {
          console.warn(`Warning: Could not add prediction for ${allocation.ResourceName} on ${allocation.ProjectName}: ${err.message}`);
        }
      }
      
      // Generate client preferences
      console.log('Generating client preferences...');
      
      // Get all clients
      const clientsResult = await transaction.request().query(`
        SELECT ClientID, Name FROM Clients
      `);
      
      const clients = clientsResult.recordset;
      let preferencesAdded = 0;
      
      for (const client of clients) {
        // Random preferences
        const communicationFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
        const workStyles = ['agile', 'waterfall', 'hybrid'];
        const experienceOptions = ['required', 'preferred', 'not_important'];
        
        // Get random skills for preferences
        const skillsResult = await transaction.request().query(`
          SELECT TOP 5 SkillID, Name FROM Skills ORDER BY NEWID()
        `);
        
        const preferredSkills = skillsResult.recordset.map(skill => ({
          id: skill.SkillID,
          name: skill.Name
        }));
        
        // Get random roles for preferences
        const roles = ['Frontend Developer', 'Backend Developer', 'Project Manager', 'Designer', 'DevOps Engineer'];
        const preferredRoles = roles.filter(() => Math.random() > 0.5);
        
        try {
          await transaction.request()
            .input('clientId', sql.Int, client.ClientID)
            .input('communicationFrequency', sql.NVarChar(20), getRandomItem(communicationFrequencies))
            .input('preferredSkills', sql.NVarChar(sql.MAX), JSON.stringify(preferredSkills))
            .input('preferredRoles', sql.NVarChar(sql.MAX), JSON.stringify(preferredRoles))
            .input('preferredWorkStyle', sql.NVarChar(20), getRandomItem(workStyles))
            .input('industryExperience', sql.NVarChar(20), getRandomItem(experienceOptions))
            .query(`
              IF NOT EXISTS (SELECT 1 FROM ClientPreferences WHERE ClientID = @clientId)
              BEGIN
                INSERT INTO ClientPreferences (
                  ClientID, CommunicationFrequency, PreferredSkills, 
                  PreferredRoles, PreferredWorkStyle, IndustryExperience
                )
                VALUES (
                  @clientId, @communicationFrequency, @preferredSkills,
                  @preferredRoles, @preferredWorkStyle, @industryExperience
                )
              END
              ELSE
              BEGIN
                UPDATE ClientPreferences
                SET CommunicationFrequency = @communicationFrequency,
                    PreferredSkills = @preferredSkills,
                    PreferredRoles = @preferredRoles,
                    PreferredWorkStyle = @preferredWorkStyle,
                    IndustryExperience = @industryExperience,
                    LastUpdated = GETDATE()
                WHERE ClientID = @clientId
              END
            `);
          
          preferencesAdded++;
        } catch (err) {
          console.warn(`Warning: Could not add preferences for client ${client.Name}: ${err.message}`);
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      console.log('\n======================================================');
      console.log('CLIENT SATISFACTION DATA SEEDING COMPLETE');
      console.log('======================================================');
      console.log(`Added ${predictionsAdded} satisfaction predictions`);
      console.log(`Added ${ratingsAdded} satisfaction ratings`);
      console.log(`Added/updated ${preferencesAdded} client preferences`);
      console.log('\nYou can now access real client satisfaction data in the application.');
      
    } catch (err) {
      // If there's an error, roll back the transaction
      await transaction.rollback();
      throw err;
    }
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding satisfaction data:', err);
    process.exit(1);
  }
};

// Run the seed script
seedSatisfactionData();
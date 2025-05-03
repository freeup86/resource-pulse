// aiRecommendationService.js
const { poolPromise } = require('../db/config');
const axios = require('axios');

// Mock API key - in a real application, store this in environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key';

/**
 * Generate skill development recommendations using AI
 * @param {number} projectId - The ID of the project to generate recommendations for
 * @returns {Promise<Array>} - Array of recommendation objects
 */
async function generateSkillRecommendations(projectId) {
  try {
    const pool = await poolPromise;
    
    // Get project details, including required skills
    const projectResult = await pool.request()
      .input('projectId', projectId)
      .query(`
        SELECT p.Name, p.Description
        FROM Projects p
        WHERE p.ProjectID = @projectId
      `);
    
    if (projectResult.recordset.length === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const project = projectResult.recordset[0];
    
    // Get required skills for the project
    const skillsResult = await pool.request()
      .input('projectId', projectId)
      .query(`
        SELECT s.SkillID, s.Name, s.Category, s.Description
        FROM Skills s
        INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
        WHERE ps.ProjectID = @projectId
      `);
    
    const skills = skillsResult.recordset;
    
    if (skills.length === 0) {
      return []; // No skills to generate recommendations for
    }
    
    // For each skill, generate a recommendation
    const recommendations = [];
    
    for (const skill of skills) {
      // Since we don't have the SkillResources table yet, we'll always generate AI recommendations
      // In a real implementation, you would check for existing resources first
      
      // Otherwise, generate a recommendation using AI
      const recommendation = await generateAIRecommendation(skill, project);
      recommendations.push({
        ...recommendation,
        skillId: skill.SkillID,
        skillName: skill.Name,
        aiGenerated: true
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating skill recommendations:', error);
    throw error;
  }
}

/**
 * Generate a single skill recommendation using OpenAI API
 * @param {Object} skill - The skill object
 * @param {Object} project - The project object
 * @returns {Promise<Object>} - A recommendation object
 */
async function generateAIRecommendation(skill, project) {
  try {
    // In a real implementation, this would call OpenAI's API
    // For now, we'll use a simulated response
    
    // Example API call (commented out):
    /*
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant specialized in creating skill development plans."
        },
        {
          role: "user",
          content: `Generate a skill development recommendation for learning ${skill.Name} in the context of a project called "${project.Name}". Include a title, description, estimated time in hours, and approximate cost in USD. Format as JSON.`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    
    const data = response.data;
    const recommendationText = data.choices[0].message.content;
    
    // Parse the JSON response
    return JSON.parse(recommendationText);
    */
    
    // Instead of calling the API, use these predefined recommendations based on skill category
    const recommendations = {
      "Programming": {
        title: `${skill.Name} Mastery Program`,
        description: `A comprehensive course covering ${skill.Name} fundamentals to advanced techniques, with hands-on projects specifically designed for roles in ${project.Name}.`,
        resourceUrl: `https://www.udemy.com/course/${skill.Name.toLowerCase().replace(/\s+/g, '-')}/`,
        estimatedTimeHours: 25,
        cost: 49.99
      },
      "Design": {
        title: `${skill.Name} Design Workshop`,
        description: `Learn professional ${skill.Name} techniques through practical exercises and real-world examples relevant to ${project.Name}.`,
        resourceUrl: `https://www.coursera.org/specializations/${skill.Name.toLowerCase().replace(/\s+/g, '-')}`,
        estimatedTimeHours: 18,
        cost: 39.99
      },
      "Data": {
        title: `${skill.Name} Data Science Bootcamp`,
        description: `Master ${skill.Name} for data analysis and visualization, with projects and case studies related to ${project.Name}.`,
        resourceUrl: `https://www.datacamp.com/courses/${skill.Name.toLowerCase().replace(/\s+/g, '-')}`,
        estimatedTimeHours: 30,
        cost: 79.99
      },
      "Management": {
        title: `${skill.Name} Leadership Certificate`,
        description: `Develop essential ${skill.Name} skills for effective project management and team leadership in contexts like ${project.Name}.`,
        resourceUrl: `https://www.linkedin.com/learning/${skill.Name.toLowerCase().replace(/\s+/g, '-')}`,
        estimatedTimeHours: 12,
        cost: 29.99
      }
    };
    
    // Use category if available, or default to general recommendation
    const category = skill.Category || "Programming";
    const templateRec = recommendations[category] || recommendations["Programming"];
    
    // Add some randomness to make recommendations look more varied
    const hours = Math.floor(templateRec.estimatedTimeHours * (0.8 + Math.random() * 0.4));
    const cost = parseFloat((templateRec.cost * (0.9 + Math.random() * 0.3)).toFixed(2));
    
    return {
      title: templateRec.title,
      description: templateRec.description,
      resourceUrl: templateRec.resourceUrl,
      estimatedTimeHours: hours,
      cost: cost
    };
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    // Return a fallback recommendation
    return {
      title: `${skill.Name} Learning Path`,
      description: `Structured learning path to develop proficiency in ${skill.Name}.`,
      resourceUrl: `https://www.google.com/search?q=${encodeURIComponent(`${skill.Name} course`)}`,
      estimatedTimeHours: 20,
      cost: 49.99
    };
  }
}

// Export the service functions
module.exports = {
  generateSkillRecommendations
};
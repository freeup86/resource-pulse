// skillRecommendationController.js
const { poolPromise, sql } = require('../db/config');

/**
 * Add a skill recommendation to a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addSkillRecommendation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      skillId,
      title,
      description,
      resourceUrl,
      estimatedTimeHours,
      cost,
      aiGenerated
    } = req.body;

    if (!projectId || !skillId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and Skill ID are required'
      });
    }

    const pool = await poolPromise;

    // Check if project exists
    const projectCheck = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT ProjectID FROM Projects WHERE ProjectID = @projectId');

    if (projectCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if skill exists
    const skillCheck = await pool.request()
      .input('skillId', sql.Int, skillId)
      .query('SELECT SkillID, Name FROM Skills WHERE SkillID = @skillId');

    if (skillCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    const skillName = skillCheck.recordset[0].Name;

    console.log('Inserting recommendation with data:', {
      projectId,
      skillId,
      title,
      description,
      resourceUrl,
      estimatedTimeHours,
      cost,
      aiGenerated
    });

    // Insert the recommendation
    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .input('skillId', sql.Int, skillId)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description || null)
      .input('resourceUrl', sql.NVarChar(500), resourceUrl || null)
      .input('estimatedTimeHours', sql.Int, estimatedTimeHours || null)
      .input('cost', sql.Decimal(10, 2), cost || null)
      .input('aiGenerated', sql.Bit, aiGenerated || false)
      .query(`
        INSERT INTO SkillRecommendations (
          ProjectID,
          SkillID,
          Title,
          Description,
          ResourceURL,
          EstimatedTimeHours,
          Cost,
          AIGenerated
        )
        VALUES (
          @projectId,
          @skillId,
          @title,
          @description,
          @resourceUrl,
          @estimatedTimeHours,
          @cost,
          @aiGenerated
        );
        
        SELECT SCOPE_IDENTITY() AS RecommendationID;
      `);

    const recommendationId = result.recordset[0].RecommendationID;
    console.log('Recommendation inserted with ID:', recommendationId);

    res.status(201).json({
      success: true,
      message: 'Skill recommendation added successfully',
      recommendation: {
        id: recommendationId,
        projectId: parseInt(projectId),
        skillId: skillId,
        skillName: skillName,
        title,
        description,
        resourceUrl,
        estimatedTimeHours,
        cost,
        aiGenerated: aiGenerated || false
      }
    });
  } catch (error) {
    console.error('Error adding skill recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding skill recommendation',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Get all skill recommendations for a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjectSkillRecommendations = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    const pool = await poolPromise;

    // Get all recommendations for the project
    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          sr.RecommendationID,
          sr.ProjectID,
          sr.SkillID,
          s.Name as SkillName,
          sr.Title,
          sr.Description,
          sr.ResourceURL,
          sr.EstimatedTimeHours,
          sr.Cost,
          sr.AIGenerated,
          sr.CreatedAt
        FROM SkillRecommendations sr
        INNER JOIN Skills s ON sr.SkillID = s.SkillID
        WHERE sr.ProjectID = @projectId
        ORDER BY sr.CreatedAt DESC
      `);

    const recommendations = result.recordset.map(rec => ({
      id: rec.RecommendationID,
      projectId: rec.ProjectID,
      skillId: rec.SkillID,
      skillName: rec.SkillName,
      title: rec.Title,
      description: rec.Description,
      resourceUrl: rec.ResourceURL,
      estimatedTimeHours: rec.EstimatedTimeHours,
      cost: rec.Cost,
      aiGenerated: rec.AIGenerated,
      createdAt: rec.CreatedAt
    }));

    console.log(`Returning ${recommendations.length} recommendations for project ${projectId}:`, recommendations.map(r => ({ id: r.id, title: r.title })));

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error getting skill recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting skill recommendations',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * Delete a skill recommendation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSkillRecommendation = async (req, res) => {
  try {
    const { recommendationId } = req.params;

    if (!recommendationId) {
      return res.status(400).json({
        success: false,
        message: 'Recommendation ID is required'
      });
    }

    const pool = await poolPromise;

    // Check if recommendation exists
    const recommendationCheck = await pool.request()
      .input('recommendationId', sql.Int, recommendationId)
      .query('SELECT RecommendationID, ProjectID FROM SkillRecommendations WHERE RecommendationID = @recommendationId');

    if (recommendationCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    const projectId = recommendationCheck.recordset[0].ProjectID;

    // Delete the recommendation
    await pool.request()
      .input('recommendationId', sql.Int, recommendationId)
      .query('DELETE FROM SkillRecommendations WHERE RecommendationID = @recommendationId');

    res.json({
      success: true,
      message: 'Skill recommendation deleted successfully',
      data: {
        recommendationId: parseInt(recommendationId),
        projectId
      }
    });
  } catch (error) {
    console.error('Error deleting skill recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting skill recommendation',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

module.exports = {
  addSkillRecommendation,
  getProjectSkillRecommendations,
  deleteSkillRecommendation
};
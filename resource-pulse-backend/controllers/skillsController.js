const { poolPromise, sql } = require('../db/config');

// Helper method to get or create a skill and return its ID
exports.getSkillId = async (transaction, skillName, category = null) => {
  if (!skillName) return null;
  
  // Check if skill exists
  const skillResult = await transaction.request()
    .input('skillName', sql.NVarChar, skillName)
    .query(`
      SELECT SkillID FROM Skills WHERE Name = @skillName
    `);
  
  if (skillResult.recordset.length > 0) {
    return skillResult.recordset[0].SkillID;
  } else {
    // Create new skill
    const newSkillResult = await transaction.request()
      .input('skillName', sql.NVarChar, skillName)
      .input('category', sql.NVarChar, category)
      .query(`
        INSERT INTO Skills (Name, Category)
        OUTPUT INSERTED.SkillID
        VALUES (@skillName, @category)
      `);
    
    return newSkillResult.recordset[0].SkillID;
  }
};

// Get all skills
exports.getAllSkills = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query skills with category, proficiency levels and active status
    const result = await pool.request()
      .query(`
        SELECT 
          s.SkillID, 
          s.Name, 
          s.Category,
          s.Description,
          s.IsActive,
          sc.Name AS CategoryName
        FROM Skills s
        LEFT JOIN SkillCategories sc ON s.Category = sc.Name
        ORDER BY s.Category, s.Name
      `);
    
    // Get skills usage statistics for each skill
    const skills = await Promise.all(result.recordset.map(async skill => {
      // Get resource count
      const resourceCountResult = await pool.request()
        .input('skillId', sql.Int, skill.SkillID)
        .query(`
          SELECT COUNT(DISTINCT ResourceID) as ResourceCount
          FROM ResourceSkills WHERE SkillID = @skillId
        `);
      
      // Get project count
      const projectCountResult = await pool.request()
        .input('skillId', sql.Int, skill.SkillID)
        .query(`
          SELECT COUNT(DISTINCT ProjectID) as ProjectCount
          FROM ProjectSkills WHERE SkillID = @skillId
        `);
      
      // Get proficiency distribution
      const proficiencyResult = await pool.request()
        .input('skillId', sql.Int, skill.SkillID)
        .query(`
          SELECT 
            pl.Name as ProficiencyLevel,
            COUNT(rs.ResourceID) as ResourceCount
          FROM ResourceSkills rs
          JOIN SkillProficiencyLevels pl ON rs.ProficiencyLevelID = pl.ProficiencyLevelID
          WHERE rs.SkillID = @skillId
          GROUP BY pl.Name, pl.SortOrder
          ORDER BY pl.SortOrder
        `);
      
      // Format the response
      return {
        id: skill.SkillID,
        name: skill.Name,
        category: skill.Category,
        categoryName: skill.CategoryName,
        description: skill.Description,
        isActive: skill.IsActive,
        resourceCount: resourceCountResult.recordset[0]?.ResourceCount || 0,
        projectCount: projectCountResult.recordset[0]?.ProjectCount || 0,
        proficiencyDistribution: proficiencyResult.recordset.map(p => ({
          level: p.ProficiencyLevel,
          count: p.ResourceCount
        }))
      };
    }));
    
    res.json(skills);
  } catch (err) {
    console.error('Error getting skills:', err);
    res.status(500).json({
      message: 'Error retrieving skills',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get a single skill by ID
exports.getSkillById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Query skill
    const result = await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        SELECT 
          s.SkillID, 
          s.Name, 
          s.Category,
          s.Description,
          s.IsActive,
          sc.Name AS CategoryName
        FROM Skills s
        LEFT JOIN SkillCategories sc ON s.Category = sc.Name
        WHERE s.SkillID = @skillId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    const skill = result.recordset[0];
    
    // Get resources with this skill
    const resourcesResult = await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        SELECT 
          r.ResourceID,
          r.Name,
          r.Role,
          pl.Name as ProficiencyLevel,
          rs.Notes
        FROM Resources r
        JOIN ResourceSkills rs ON r.ResourceID = rs.ResourceID
        LEFT JOIN SkillProficiencyLevels pl ON rs.ProficiencyLevelID = pl.ProficiencyLevelID
        WHERE rs.SkillID = @skillId
        ORDER BY pl.SortOrder DESC, r.Name
      `);
    
    // Get projects requiring this skill
    const projectsResult = await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        SELECT 
          p.ProjectID,
          p.Name,
          p.Status,
          pl.Name as RequiredProficiencyLevel,
          ps.Priority
        FROM Projects p
        JOIN ProjectSkills ps ON p.ProjectID = ps.ProjectID
        LEFT JOIN SkillProficiencyLevels pl ON ps.ProficiencyLevelID = pl.ProficiencyLevelID
        WHERE ps.SkillID = @skillId
        ORDER BY p.Name
      `);
    
    // Get skill development recommendations
    const recommendationsResult = await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        SELECT 
          RecommendationID as id,
          Title as title,
          Description as description,
          ResourceURL as url,
          EstimatedTimeHours as hours,
          Cost as cost
        FROM SkillDevelopmentRecommendations
        WHERE SkillID = @skillId
        ORDER BY Title
      `);
    
    // Format the response
    const formattedSkill = {
      id: skill.SkillID,
      name: skill.Name,
      category: skill.Category,
      categoryName: skill.CategoryName,
      description: skill.Description,
      isActive: skill.IsActive,
      resources: resourcesResult.recordset.map(resource => ({
        id: resource.ResourceID,
        name: resource.Name,
        role: resource.Role,
        proficiencyLevel: resource.ProficiencyLevel,
        notes: resource.Notes
      })),
      projects: projectsResult.recordset.map(project => ({
        id: project.ProjectID,
        name: project.Name,
        status: project.Status,
        requiredProficiencyLevel: project.RequiredProficiencyLevel,
        priority: project.Priority
      })),
      developmentRecommendations: recommendationsResult.recordset
    };
    
    res.json(formattedSkill);
  } catch (err) {
    console.error('Error getting skill:', err);
    res.status(500).json({
      message: 'Error retrieving skill',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Create a new skill
exports.createSkill = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { name, category, description, isActive } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }
    
    // Check if skill with same name already exists
    const existingSkill = await pool.request()
      .input('name', sql.NVarChar, name)
      .query(`
        SELECT SkillID FROM Skills WHERE Name = @name
      `);
    
    if (existingSkill.recordset.length > 0) {
      return res.status(409).json({ message: 'A skill with this name already exists' });
    }
    
    // Insert skill
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('category', sql.NVarChar, category || null)
      .input('description', sql.NVarChar, description || null)
      .input('isActive', sql.Bit, isActive === undefined ? true : isActive)
      .query(`
        INSERT INTO Skills (Name, Category, Description, IsActive)
        OUTPUT INSERTED.SkillID, INSERTED.Name, INSERTED.Category, INSERTED.Description, INSERTED.IsActive
        VALUES (@name, @category, @description, @isActive)
      `);
    
    const newSkill = result.recordset[0];
    
    // Get category name if it exists
    let categoryName = null;
    if (category) {
      const categoryResult = await pool.request()
        .input('category', sql.NVarChar, category)
        .query(`
          SELECT Name FROM SkillCategories WHERE Name = @category
        `);
      
      if (categoryResult.recordset.length > 0) {
        categoryName = categoryResult.recordset[0].Name;
      }
    }
    
    // Format the response
    const formattedSkill = {
      id: newSkill.SkillID,
      name: newSkill.Name,
      category: newSkill.Category,
      categoryName: categoryName,
      description: newSkill.Description,
      isActive: newSkill.IsActive,
      resources: [],
      projects: [],
      developmentRecommendations: []
    };
    
    res.status(201).json(formattedSkill);
  } catch (err) {
    console.error('Error creating skill:', err);
    res.status(500).json({
      message: 'Error creating skill',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Update a skill
exports.updateSkill = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { name, category, description, isActive } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }
    
    // Check if skill exists
    const existingSkill = await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        SELECT SkillID FROM Skills WHERE SkillID = @skillId
      `);
    
    if (existingSkill.recordset.length === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    // Check if skill name is unique (if name is being changed)
    const nameCheck = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('skillId', sql.Int, id)
      .query(`
        SELECT SkillID FROM Skills 
        WHERE Name = @name AND SkillID <> @skillId
      `);
    
    if (nameCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'A skill with this name already exists' });
    }
    
    // Update skill
    await pool.request()
      .input('skillId', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('category', sql.NVarChar, category || null)
      .input('description', sql.NVarChar, description || null)
      .input('isActive', sql.Bit, isActive === undefined ? true : isActive)
      .input('updatedAt', sql.DateTime2, new Date())
      .query(`
        UPDATE Skills
        SET Name = @name,
            Category = @category,
            Description = @description,
            IsActive = @isActive,
            UpdatedAt = @updatedAt
        WHERE SkillID = @skillId
      `);
    
    // Get updated skill for response
    const result = await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        SELECT 
          s.SkillID, 
          s.Name, 
          s.Category,
          s.Description,
          s.IsActive,
          sc.Name AS CategoryName
        FROM Skills s
        LEFT JOIN SkillCategories sc ON s.Category = sc.Name
        WHERE s.SkillID = @skillId
      `);
    
    const skill = result.recordset[0];
    
    // Format the response
    const formattedSkill = {
      id: skill.SkillID,
      name: skill.Name,
      category: skill.Category,
      categoryName: skill.CategoryName,
      description: skill.Description,
      isActive: skill.IsActive
    };
    
    res.json(formattedSkill);
  } catch (err) {
    console.error('Error updating skill:', err);
    res.status(500).json({
      message: 'Error updating skill',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Delete a skill
exports.deleteSkill = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Check if skill exists
    const existingSkill = await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        SELECT SkillID FROM Skills WHERE SkillID = @skillId
      `);
    
    if (existingSkill.recordset.length === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    // Check if skill is used by resources or projects
    const usageCheck = await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM ResourceSkills WHERE SkillID = @skillId) as ResourceCount,
          (SELECT COUNT(*) FROM ProjectSkills WHERE SkillID = @skillId) as ProjectCount
      `);
    
    const { ResourceCount, ProjectCount } = usageCheck.recordset[0];
    
    if (ResourceCount > 0 || ProjectCount > 0) {
      return res.status(409).json({ 
        message: 'Cannot delete skill that is in use',
        usedBy: {
          resources: ResourceCount,
          projects: ProjectCount
        }
      });
    }
    
    // Delete skill (cascade will handle related records)
    await pool.request()
      .input('skillId', sql.Int, id)
      .query(`
        DELETE FROM Skills
        WHERE SkillID = @skillId
      `);
    
    res.json({ message: 'Skill deleted successfully' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({
      message: 'Error deleting skill',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get skill categories
exports.getSkillCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT 
          CategoryID as id,
          Name as name,
          Description as description
        FROM SkillCategories
        ORDER BY Name
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error getting skill categories:', err);
    res.status(500).json({
      message: 'Error retrieving skill categories',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get skill proficiency levels
exports.getSkillProficiencyLevels = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT 
          ProficiencyLevelID as id,
          Name as name,
          Description as description,
          SortOrder as sortOrder
        FROM SkillProficiencyLevels
        ORDER BY SortOrder
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error getting skill proficiency levels:', err);
    res.status(500).json({
      message: 'Error retrieving skill proficiency levels',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Get skills gap analysis
exports.getSkillsGapAnalysis = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT 
          SkillID as id,
          SkillName as name,
          Category as category,
          ProficiencyLevel as proficiencyLevel,
          ResourcesCount as resourcesCount,
          ProjectRequirementsCount as projectsCount,
          ResourcesAtProficiencyCount as resourcesAtProficiencyCount,
          ProjectsRequiringProficiencyCount as projectsRequiringProficiencyCount,
          (ResourcesAtProficiencyCount - ProjectsRequiringProficiencyCount) as gap
        FROM 
          vw_SkillsGapAnalysis
        ORDER BY 
          gap
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error getting skills gap analysis:', err);
    res.status(500).json({
      message: 'Error retrieving skills gap analysis',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Create skill certification
exports.createSkillCertification = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { resourceId, skillId, certificationName, issueDate, expiryDate, issuer, certificationUrl, notes } = req.body;
    
    // Validate required fields
    if (!resourceId || !skillId || !certificationName) {
      return res.status(400).json({ message: 'Resource ID, Skill ID, and certification name are required' });
    }
    
    // Check if resource and skill exist
    const validateResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('skillId', sql.Int, skillId)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Resources WHERE ResourceID = @resourceId) as ResourceExists,
          (SELECT COUNT(*) FROM Skills WHERE SkillID = @skillId) as SkillExists
      `);
    
    const { ResourceExists, SkillExists } = validateResult.recordset[0];
    
    if (ResourceExists === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    if (SkillExists === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    // Insert certification
    const result = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('skillId', sql.Int, skillId)
      .input('certificationName', sql.NVarChar, certificationName)
      .input('issueDate', sql.Date, issueDate ? new Date(issueDate) : null)
      .input('expiryDate', sql.Date, expiryDate ? new Date(expiryDate) : null)
      .input('issuer', sql.NVarChar, issuer || null)
      .input('certificationUrl', sql.NVarChar, certificationUrl || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO SkillCertifications (
          ResourceID, SkillID, CertificationName, 
          IssueDate, ExpiryDate, Issuer, 
          CertificationURL, Notes
        )
        OUTPUT 
          INSERTED.CertificationID, 
          INSERTED.ResourceID, 
          INSERTED.SkillID, 
          INSERTED.CertificationName,
          INSERTED.IssueDate,
          INSERTED.ExpiryDate,
          INSERTED.Issuer,
          INSERTED.CertificationURL,
          INSERTED.Notes
        VALUES (
          @resourceId, @skillId, @certificationName,
          @issueDate, @expiryDate, @issuer,
          @certificationUrl, @notes
        )
      `);
    
    const newCertification = result.recordset[0];
    
    // Get resource and skill names for the response
    const namesResult = await pool.request()
      .input('resourceId', sql.Int, resourceId)
      .input('skillId', sql.Int, skillId)
      .query(`
        SELECT 
          r.Name as ResourceName,
          s.Name as SkillName
        FROM 
          Resources r, Skills s
        WHERE 
          r.ResourceID = @resourceId
          AND s.SkillID = @skillId
      `);
    
    // Format the response
    const formattedCertification = {
      id: newCertification.CertificationID,
      resourceId: newCertification.ResourceID,
      resourceName: namesResult.recordset[0].ResourceName,
      skillId: newCertification.SkillID,
      skillName: namesResult.recordset[0].SkillName,
      certificationName: newCertification.CertificationName,
      issueDate: newCertification.IssueDate,
      expiryDate: newCertification.ExpiryDate,
      issuer: newCertification.Issuer,
      certificationUrl: newCertification.CertificationURL,
      notes: newCertification.Notes
    };
    
    res.status(201).json(formattedCertification);
  } catch (err) {
    console.error('Error creating skill certification:', err);
    res.status(500).json({
      message: 'Error creating skill certification',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};

// Create skill development recommendation
exports.createSkillRecommendation = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { skillId, title, description, resourceUrl, estimatedTimeHours, cost } = req.body;
    
    // Validate required fields
    if (!skillId || !title) {
      return res.status(400).json({ message: 'Skill ID and title are required' });
    }
    
    // Check if skill exists
    const skillExists = await pool.request()
      .input('skillId', sql.Int, skillId)
      .query(`
        SELECT COUNT(*) as SkillExists
        FROM Skills 
        WHERE SkillID = @skillId
      `);
    
    if (skillExists.recordset[0].SkillExists === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    // Insert recommendation
    const result = await pool.request()
      .input('skillId', sql.Int, skillId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description || null)
      .input('resourceUrl', sql.NVarChar, resourceUrl || null)
      .input('estimatedTimeHours', sql.Int, estimatedTimeHours || null)
      .input('cost', sql.Decimal(10, 2), cost || null)
      .query(`
        INSERT INTO SkillDevelopmentRecommendations (
          SkillID, Title, Description, 
          ResourceURL, EstimatedTimeHours, Cost
        )
        OUTPUT 
          INSERTED.RecommendationID, 
          INSERTED.SkillID, 
          INSERTED.Title, 
          INSERTED.Description,
          INSERTED.ResourceURL,
          INSERTED.EstimatedTimeHours,
          INSERTED.Cost
        VALUES (
          @skillId, @title, @description,
          @resourceUrl, @estimatedTimeHours, @cost
        )
      `);
    
    const newRecommendation = result.recordset[0];
    
    // Get skill name for the response
    const skillNameResult = await pool.request()
      .input('skillId', sql.Int, skillId)
      .query(`
        SELECT Name as SkillName
        FROM Skills
        WHERE SkillID = @skillId
      `);
    
    // Format the response
    const formattedRecommendation = {
      id: newRecommendation.RecommendationID,
      skillId: newRecommendation.SkillID,
      skillName: skillNameResult.recordset[0].SkillName,
      title: newRecommendation.Title,
      description: newRecommendation.Description,
      resourceUrl: newRecommendation.ResourceURL,
      estimatedTimeHours: newRecommendation.EstimatedTimeHours,
      cost: newRecommendation.Cost
    };
    
    res.status(201).json(formattedRecommendation);
  } catch (err) {
    console.error('Error creating skill development recommendation:', err);
    res.status(500).json({
      message: 'Error creating skill development recommendation',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
};
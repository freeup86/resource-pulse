const { sql } = require('../db/config');

// Helper method to get or create a skill and return its ID
exports.getSkillId = async (transaction, skillName) => {
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
      .query(`
        INSERT INTO Skills (Name)
        OUTPUT INSERTED.SkillID
        VALUES (@skillName)
      `);
    
    return newSkillResult.recordset[0].SkillID;
  }
};
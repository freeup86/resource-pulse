-- Create the view as a separate script after all tables and columns exist
CREATE VIEW vw_SkillsGapAnalysis AS
SELECT 
    s.SkillID,
    s.Name AS SkillName,
    s.Category,
    p.ProficiencyLevelID,
    p.Name AS ProficiencyLevel,
    (
        SELECT COUNT(*)
        FROM ResourceSkills rs
        WHERE rs.SkillID = s.SkillID
    ) AS ResourcesCount,
    (
        SELECT COUNT(*)
        FROM ProjectSkills ps
        WHERE ps.SkillID = s.SkillID
    ) AS ProjectRequirementsCount,
    (
        SELECT COUNT(*)
        FROM ResourceSkills rs
        WHERE rs.SkillID = s.SkillID
        AND rs.ProficiencyLevelID = p.ProficiencyLevelID
    ) AS ResourcesAtProficiencyCount,
    (
        SELECT COUNT(*)
        FROM ProjectSkills ps
        WHERE ps.SkillID = s.SkillID
        AND ps.ProficiencyLevelID = p.ProficiencyLevelID
    ) AS ProjectsRequiringProficiencyCount
FROM 
    Skills s
CROSS JOIN 
    SkillProficiencyLevels p;
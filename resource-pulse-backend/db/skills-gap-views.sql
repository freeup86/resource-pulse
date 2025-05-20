-- Views for skills gap analysis

-- View to get resource skills with coverage
IF EXISTS (SELECT * FROM sys.views WHERE name = 'ResourceSkillsCoverage')
    DROP VIEW ResourceSkillsCoverage;

CREATE VIEW ResourceSkillsCoverage AS
SELECT 
    s.SkillID AS SkillID,
    s.Name AS SkillName,
    s.Category,
    COUNT(rs.ResourceID) AS ResourceCount,
    CASE 
        WHEN (SELECT COUNT(*) FROM Resources) = 0 THEN 0
        ELSE (COUNT(rs.ResourceID) * 100.0 / (SELECT COUNT(*) FROM Resources)) 
    END AS CoveragePercentage,
    AVG(CAST(rs.ProficiencyLevel AS FLOAT)) AS AvgProficiency,
    0 AS CertifiedCount -- Simplified since IsCertified column is not available
FROM 
    Skills s
LEFT JOIN 
    ResourceSkills rs ON s.SkillID = rs.SkillID
GROUP BY 
    s.SkillID, s.Name, s.Category;

-- View to get project skills demand
IF EXISTS (SELECT * FROM sys.views WHERE name = 'ProjectSkillsDemand')
    DROP VIEW ProjectSkillsDemand;

CREATE VIEW ProjectSkillsDemand AS
SELECT 
    s.SkillID AS SkillID,
    s.Name AS SkillName,
    s.Category,
    COUNT(DISTINCT ps.ProjectID) AS ProjectCount,
    CASE 
        WHEN (SELECT COUNT(*) FROM Projects WHERE EndDate >= GETDATE()) = 0 THEN 0
        ELSE (COUNT(DISTINCT ps.ProjectID) * 100.0 / 
              (SELECT COUNT(*) FROM Projects WHERE EndDate >= GETDATE())) 
    END AS DemandPercentage,
    AVG(CAST(ps.Priority AS FLOAT)) AS AvgImportance -- Using Priority column instead of ImportanceLevel
FROM 
    Skills s
JOIN 
    ProjectSkills ps ON s.SkillID = ps.SkillID
JOIN 
    Projects p ON ps.ProjectID = p.ProjectID -- Updated to p.ProjectID instead of p.ID
WHERE 
    p.EndDate >= GETDATE()
GROUP BY 
    s.SkillID, s.Name, s.Category;

-- View for skills gap calculation
IF EXISTS (SELECT * FROM sys.views WHERE name = 'SkillsGapView')
    DROP VIEW SkillsGapView;

CREATE VIEW SkillsGapView AS
SELECT 
    sc.SkillID,
    sc.SkillName,
    sc.Category,
    sc.ResourceCount,
    sc.CoveragePercentage,
    sc.AvgProficiency,
    sd.ProjectCount,
    sd.DemandPercentage,
    sd.AvgImportance,
    CASE 
        WHEN sd.DemandPercentage IS NULL THEN 0
        WHEN sc.CoveragePercentage IS NULL THEN sd.DemandPercentage
        ELSE IIF(sd.DemandPercentage - sc.CoveragePercentage > 0, 
                 sd.DemandPercentage - sc.CoveragePercentage, 0)
    END AS GapPercentage,
    CASE
        WHEN sd.DemandPercentage IS NULL THEN 'none'
        WHEN sc.CoveragePercentage IS NULL THEN 'critical'
        WHEN (sd.DemandPercentage - sc.CoveragePercentage) > 50 THEN 'critical'
        WHEN (sd.DemandPercentage - sc.CoveragePercentage) > 30 THEN 'high'
        WHEN (sd.DemandPercentage - sc.CoveragePercentage) > 10 THEN 'medium'
        ELSE 'low'
    END AS GapSeverity
FROM 
    ResourceSkillsCoverage sc
LEFT JOIN 
    ProjectSkillsDemand sd ON sc.SkillID = sd.SkillID;
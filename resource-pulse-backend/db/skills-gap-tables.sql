-- Skills Gap Analysis Database Schema (Updated for SQL Server)

-- Market trends table to store market skills demand and growth
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'market_skill_trends')
BEGIN
  CREATE TABLE market_skill_trends (
    id INT IDENTITY(1,1) PRIMARY KEY,
    skill_name NVARCHAR(100) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    demand_score DECIMAL(3,1) NOT NULL, -- Scale of 0-10
    growth_rate DECIMAL(5,2) NOT NULL, -- Percentage growth rate
    trend_date DATE NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
  );
  
  CREATE INDEX idx_skill_name ON market_skill_trends(skill_name);
  CREATE INDEX idx_category ON market_skill_trends(category);
  CREATE INDEX idx_trend_date ON market_skill_trends(trend_date);
END

-- Sample data for market trends
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'market_skill_trends')
BEGIN
  IF (SELECT COUNT(*) FROM market_skill_trends) = 0
  BEGIN
    DECLARE @CurrentDate DATE = GETDATE();

    INSERT INTO market_skill_trends 
      (skill_name, category, demand_score, growth_rate, trend_date)
    VALUES
      ('Cloud Computing', 'Technical', 9.2, 27.0, @CurrentDate),
      ('Data Science', 'Technical', 9.0, 35.0, @CurrentDate),
      ('Machine Learning', 'Technical', 8.9, 32.0, @CurrentDate),
      ('DevOps', 'Technical', 8.7, 24.0, @CurrentDate),
      ('Cybersecurity', 'Technical', 8.6, 28.0, @CurrentDate),
      ('Agile Methodology', 'Process', 8.5, 18.0, @CurrentDate),
      ('Big Data', 'Technical', 8.4, 21.0, @CurrentDate),
      ('Artificial Intelligence', 'Technical', 8.3, 30.0, @CurrentDate),
      ('React', 'Technical', 8.2, 20.0, @CurrentDate),
      ('Node.js', 'Technical', 8.1, 17.0, @CurrentDate),
      ('Python', 'Technical', 8.0, 22.0, @CurrentDate),
      ('AWS', 'Technical', 7.9, 25.0, @CurrentDate),
      ('Azure', 'Technical', 7.8, 23.0, @CurrentDate),
      ('Docker', 'Technical', 7.7, 19.0, @CurrentDate),
      ('Kubernetes', 'Technical', 7.6, 26.0, @CurrentDate),
      ('Blockchain', 'Technical', 7.5, 15.0, @CurrentDate),
      ('UI/UX Design', 'Design', 7.4, 18.0, @CurrentDate),
      ('Product Management', 'Business', 7.3, 16.0, @CurrentDate),
      ('Business Analysis', 'Business', 7.2, 14.0, @CurrentDate),
      ('Project Management', 'Business', 7.1, 12.0, @CurrentDate);
  END
END

-- Skills gap analysis cache table - for storing computed gap analysis results
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'skills_gap_analysis_cache')
BEGIN
  CREATE TABLE skills_gap_analysis_cache (
    id INT IDENTITY(1,1) PRIMARY KEY,
    analysis_type NVARCHAR(20) NOT NULL, -- 'organization', 'department', 'resource'
    entity_id INT NULL, -- Department ID or Resource ID, NULL for organization-wide
    parameters NVARCHAR(MAX) NOT NULL, -- JSON storing analysis parameters
    result NVARCHAR(MAX) NOT NULL, -- JSON storing the complete analysis results
    created_at DATETIME2 DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL -- When this cache entry expires
  );
  
  CREATE INDEX idx_analysis_type_entity ON skills_gap_analysis_cache(analysis_type, entity_id);
  CREATE INDEX idx_expires_at ON skills_gap_analysis_cache(expires_at);
END

-- Skills gap recommendations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'skills_gap_recommendations')
BEGIN
  CREATE TABLE skills_gap_recommendations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    analysis_id INT NOT NULL,
    recommendation_type NVARCHAR(50) NOT NULL, -- e.g., "training", "hiring", "critical_gap"
    description NVARCHAR(MAX) NOT NULL,
    details NVARCHAR(MAX) NULL,
    priority NVARCHAR(10) NOT NULL, -- 'low', 'medium', 'high'
    metadata NVARCHAR(MAX) NULL, -- Additional data like skills, categories, etc.
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (analysis_id) REFERENCES skills_gap_analysis_cache(id) ON DELETE CASCADE
  );
END

-- Create a procedure to create a view for resource skills coverage 
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'create_resource_skills_coverage_view')
BEGIN
  DROP PROCEDURE create_resource_skills_coverage_view;
END

IF EXISTS (SELECT * FROM sys.views WHERE name = 'resource_skills_coverage')
BEGIN
  DROP VIEW resource_skills_coverage;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Skills') AND EXISTS (SELECT * FROM sys.tables WHERE name = 'ResourceSkills')
BEGIN
  EXEC('
  CREATE PROCEDURE create_resource_skills_coverage_view
  AS
  BEGIN
    IF EXISTS (SELECT * FROM sys.views WHERE name = ''resource_skills_coverage'')
      DROP VIEW resource_skills_coverage;
      
    EXEC(''
    CREATE VIEW resource_skills_coverage AS
    SELECT 
      s.SkillID AS skill_id,
      s.Name AS skill_name,
      s.Category,
      COUNT(rs.ResourceID) AS resource_count,
      (COUNT(rs.ResourceID) * 100.0 / (SELECT COUNT(*) FROM Resources)) AS coverage_percentage,
      AVG(CAST(rs.ProficiencyLevelID AS FLOAT)) AS avg_proficiency,
      SUM(CASE WHEN rs.ProficiencyLevelID = 4 THEN 1 ELSE 0 END) AS certified_count
    FROM 
      Skills s
    LEFT JOIN 
      ResourceSkills rs ON s.SkillID = rs.SkillID
    GROUP BY 
      s.SkillID, s.Name, s.Category;
    '');
  END
  ');
  
  EXEC create_resource_skills_coverage_view;
END

-- Create a procedure to create a view for project skills demand
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'create_project_skills_demand_view')
BEGIN
  DROP PROCEDURE create_project_skills_demand_view;
END

IF EXISTS (SELECT * FROM sys.views WHERE name = 'project_skills_demand')
BEGIN
  DROP VIEW project_skills_demand;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Skills') AND EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectSkills')
BEGIN
  EXEC('
  CREATE PROCEDURE create_project_skills_demand_view
  AS
  BEGIN
    IF EXISTS (SELECT * FROM sys.views WHERE name = ''project_skills_demand'')
      DROP VIEW project_skills_demand;
      
    EXEC(''
    CREATE VIEW project_skills_demand AS
    SELECT 
      s.SkillID AS skill_id,
      s.Name AS skill_name,
      s.Category,
      COUNT(DISTINCT ps.ProjectID) AS project_count,
      (COUNT(DISTINCT ps.ProjectID) * 100.0 / 
        CASE 
          WHEN (SELECT COUNT(*) FROM Projects WHERE EndDate >= GETDATE()) = 0 THEN 1 
          ELSE (SELECT COUNT(*) FROM Projects WHERE EndDate >= GETDATE()) 
        END
      ) AS demand_percentage,
      AVG(CAST(ps.Priority AS FLOAT)) AS avg_importance
    FROM 
      Skills s
    JOIN 
      ProjectSkills ps ON s.SkillID = ps.SkillID
    JOIN 
      Projects p ON ps.ProjectID = p.ProjectID
    WHERE 
      p.EndDate >= GETDATE()
    GROUP BY 
      s.SkillID, s.Name, s.Category;
    '');
  END
  ');
  
  EXEC create_project_skills_demand_view;
END

-- Create a procedure to create a view for skills gap calculation
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'create_skills_gap_view')
BEGIN
  DROP PROCEDURE create_skills_gap_view;
END

IF EXISTS (SELECT * FROM sys.views WHERE name = 'skills_gap_view')
BEGIN
  DROP VIEW skills_gap_view;
END

IF EXISTS (SELECT * FROM sys.views WHERE name = 'resource_skills_coverage') AND EXISTS (SELECT * FROM sys.views WHERE name = 'project_skills_demand')
BEGIN
  EXEC('
  CREATE PROCEDURE create_skills_gap_view
  AS
  BEGIN
    IF EXISTS (SELECT * FROM sys.views WHERE name = ''skills_gap_view'')
      DROP VIEW skills_gap_view;
      
    EXEC(''
    CREATE VIEW skills_gap_view AS
    SELECT 
      sc.skill_id,
      sc.skill_name,
      sc.category,
      sc.resource_count,
      sc.coverage_percentage,
      sc.avg_proficiency,
      sd.project_count,
      sd.demand_percentage,
      sd.avg_importance,
      CASE 
        WHEN sd.demand_percentage IS NULL THEN 0
        WHEN sc.coverage_percentage IS NULL THEN sd.demand_percentage
        ELSE (CASE WHEN sd.demand_percentage - sc.coverage_percentage > 0 THEN sd.demand_percentage - sc.coverage_percentage ELSE 0 END)
      END AS gap_percentage,
      CASE
        WHEN sd.demand_percentage IS NULL THEN ''''none''''
        WHEN sc.coverage_percentage IS NULL THEN ''''critical''''
        WHEN (sd.demand_percentage - sc.coverage_percentage) > 50 THEN ''''critical''''
        WHEN (sd.demand_percentage - sc.coverage_percentage) > 30 THEN ''''high''''
        WHEN (sd.demand_percentage - sc.coverage_percentage) > 10 THEN ''''medium''''
        ELSE ''''low''''
      END AS gap_severity
    FROM 
      resource_skills_coverage sc
    LEFT JOIN 
      project_skills_demand sd ON sc.skill_id = sd.skill_id;
    '');
  END
  ');
  
  EXEC create_skills_gap_view;
END
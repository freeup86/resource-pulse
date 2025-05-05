-- Skills Gap Analysis Database Schema

-- Market trends table to store market skills demand and growth
CREATE TABLE IF NOT EXISTS market_skill_trends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  skill_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  demand_score DECIMAL(3,1) NOT NULL, -- Scale of 0-10
  growth_rate DECIMAL(5,2) NOT NULL, -- Percentage growth rate
  trend_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_skill_name (skill_name),
  INDEX idx_category (category),
  INDEX idx_trend_date (trend_date)
);

-- Sample data for market trends
INSERT INTO market_skill_trends 
  (skill_name, category, demand_score, growth_rate, trend_date)
VALUES
  ('Cloud Computing', 'Technical', 9.2, 27.0, CURDATE()),
  ('Data Science', 'Technical', 9.0, 35.0, CURDATE()),
  ('Machine Learning', 'Technical', 8.9, 32.0, CURDATE()),
  ('DevOps', 'Technical', 8.7, 24.0, CURDATE()),
  ('Cybersecurity', 'Technical', 8.6, 28.0, CURDATE()),
  ('Agile Methodology', 'Process', 8.5, 18.0, CURDATE()),
  ('Big Data', 'Technical', 8.4, 21.0, CURDATE()),
  ('Artificial Intelligence', 'Technical', 8.3, 30.0, CURDATE()),
  ('React', 'Technical', 8.2, 20.0, CURDATE()),
  ('Node.js', 'Technical', 8.1, 17.0, CURDATE()),
  ('Python', 'Technical', 8.0, 22.0, CURDATE()),
  ('AWS', 'Technical', 7.9, 25.0, CURDATE()),
  ('Azure', 'Technical', 7.8, 23.0, CURDATE()),
  ('Docker', 'Technical', 7.7, 19.0, CURDATE()),
  ('Kubernetes', 'Technical', 7.6, 26.0, CURDATE()),
  ('Blockchain', 'Technical', 7.5, 15.0, CURDATE()),
  ('UI/UX Design', 'Design', 7.4, 18.0, CURDATE()),
  ('Product Management', 'Business', 7.3, 16.0, CURDATE()),
  ('Business Analysis', 'Business', 7.2, 14.0, CURDATE()),
  ('Project Management', 'Business', 7.1, 12.0, CURDATE())
ON DUPLICATE KEY UPDATE
  demand_score = VALUES(demand_score),
  growth_rate = VALUES(growth_rate),
  updated_at = CURRENT_TIMESTAMP;

-- Skills gap analysis cache table - for storing computed gap analysis results
CREATE TABLE IF NOT EXISTS skills_gap_analysis_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_type ENUM('organization', 'department', 'resource') NOT NULL,
  entity_id INT NULL, -- Department ID or Resource ID, NULL for organization-wide
  parameters JSON NOT NULL, -- JSON storing analysis parameters
  result JSON NOT NULL, -- JSON storing the complete analysis results
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- When this cache entry expires
  INDEX idx_analysis_type_entity (analysis_type, entity_id),
  INDEX idx_expires_at (expires_at)
);

-- Skills gap recommendations table
CREATE TABLE IF NOT EXISTS skills_gap_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL, -- e.g., "training", "hiring", "critical_gap"
  description TEXT NOT NULL,
  details TEXT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL,
  metadata JSON NULL, -- Additional data like skills, categories, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES skills_gap_analysis_cache(id) ON DELETE CASCADE
);

-- Add views and functions to simplify skills gap queries

-- View to get resource skills with coverage
CREATE OR REPLACE VIEW resource_skills_coverage AS
SELECT 
  s.id AS skill_id,
  s.name AS skill_name,
  s.category,
  COUNT(rs.resource_id) AS resource_count,
  (COUNT(rs.resource_id) / (SELECT COUNT(*) FROM resources)) * 100 AS coverage_percentage,
  AVG(rs.proficiency_level) AS avg_proficiency,
  SUM(CASE WHEN rs.is_certified = 1 THEN 1 ELSE 0 END) AS certified_count
FROM 
  skills s
LEFT JOIN 
  resource_skills rs ON s.id = rs.skill_id
GROUP BY 
  s.id;
  
-- View to get project skills demand
CREATE OR REPLACE VIEW project_skills_demand AS
SELECT 
  s.id AS skill_id,
  s.name AS skill_name,
  s.category,
  COUNT(DISTINCT ps.project_id) AS project_count,
  (COUNT(DISTINCT ps.project_id) / (SELECT COUNT(*) FROM projects WHERE end_date >= CURDATE())) * 100 AS demand_percentage,
  AVG(ps.importance_level) AS avg_importance
FROM 
  skills s
JOIN 
  project_skills ps ON s.id = ps.skill_id
JOIN 
  projects p ON ps.project_id = p.id
WHERE 
  p.end_date >= CURDATE()
GROUP BY 
  s.id;

-- View for skills gap calculation
CREATE OR REPLACE VIEW skills_gap_view AS
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
    ELSE GREATEST(0, sd.demand_percentage - sc.coverage_percentage)
  END AS gap_percentage,
  CASE
    WHEN sd.demand_percentage IS NULL THEN 'none'
    WHEN sc.coverage_percentage IS NULL THEN 'critical'
    WHEN (sd.demand_percentage - sc.coverage_percentage) > 50 THEN 'critical'
    WHEN (sd.demand_percentage - sc.coverage_percentage) > 30 THEN 'high'
    WHEN (sd.demand_percentage - sc.coverage_percentage) > 10 THEN 'medium'
    ELSE 'low'
  END AS gap_severity
FROM 
  resource_skills_coverage sc
LEFT JOIN 
  project_skills_demand sd ON sc.skill_id = sd.skill_id;
-- Enhanced Skills Management Schema Updates

-- Add columns to Skills table
ALTER TABLE Skills 
ADD ProficiencyLevel NVARCHAR(50) NULL,
ADD Category NVARCHAR(100) NULL,
ADD Description NVARCHAR(500) NULL,
ADD IsActive BIT DEFAULT 1;

-- Skill Proficiency table
CREATE TABLE SkillProficiencyLevels (
    ProficiencyLevelID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL,
    SortOrder INT NOT NULL DEFAULT 0
);

-- Insert default proficiency levels
INSERT INTO SkillProficiencyLevels (Name, Description, SortOrder)
VALUES
    ('Beginner', 'Limited experience or knowledge', 1),
    ('Intermediate', 'Working knowledge and some practical experience', 2),
    ('Advanced', 'Thorough understanding and extensive experience', 3),
    ('Expert', 'Comprehensive expertise and recognized authority', 4);

-- Skill Categories table
CREATE TABLE SkillCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL
);

-- Insert default categories
INSERT INTO SkillCategories (Name, Description)
VALUES
    ('Technical', 'Programming languages, tools, and technical frameworks'),
    ('Business', 'Business analysis, domain knowledge, and industry expertise'),
    ('Soft Skills', 'Communication, leadership, and interpersonal skills');

-- Update ResourceSkills table to include proficiency
ALTER TABLE ResourceSkills
ADD ProficiencyLevelID INT NULL,
ADD Notes NVARCHAR(255) NULL,
FOREIGN KEY (ProficiencyLevelID) REFERENCES SkillProficiencyLevels(ProficiencyLevelID);

-- Skill Certifications table
CREATE TABLE SkillCertifications (
    CertificationID INT IDENTITY(1,1) PRIMARY KEY,
    ResourceID INT NOT NULL,
    SkillID INT NOT NULL,
    CertificationName NVARCHAR(200) NOT NULL,
    IssueDate DATE NULL,
    ExpiryDate DATE NULL,
    Issuer NVARCHAR(200) NULL,
    CertificationURL NVARCHAR(500) NULL,
    Notes NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE CASCADE,
    FOREIGN KEY (SkillID) REFERENCES Skills(SkillID) ON DELETE CASCADE
);

-- Project Required Skills with proficiency
ALTER TABLE ProjectSkills
ADD ProficiencyLevelID INT NULL,
ADD Priority INT DEFAULT 0,
FOREIGN KEY (ProficiencyLevelID) REFERENCES SkillProficiencyLevels(ProficiencyLevelID);

-- Skill Development Recommendations
CREATE TABLE SkillDevelopmentRecommendations (
    RecommendationID INT IDENTITY(1,1) PRIMARY KEY,
    SkillID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500) NULL,
    ResourceURL NVARCHAR(500) NULL,
    EstimatedTimeHours INT NULL,
    Cost DECIMAL(10, 2) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SkillID) REFERENCES Skills(SkillID) ON DELETE CASCADE
);

-- View for skills gap analysis
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
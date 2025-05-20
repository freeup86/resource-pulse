-- Skills Gap Analysis Database Schema for SQL Server

-- Market trends table to store market skills demand and growth
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MarketSkillTrends]') AND type in (N'U'))
BEGIN
    CREATE TABLE MarketSkillTrends (
        MarketSkillTrendID INT IDENTITY(1,1) PRIMARY KEY,
        SkillName NVARCHAR(100) NOT NULL,
        Category NVARCHAR(50) NOT NULL,
        DemandScore DECIMAL(3,1) NOT NULL, -- Scale of 0-10
        GrowthRate DECIMAL(5,2) NOT NULL, -- Percentage growth rate
        TrendDate DATE NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );

    -- Create indexes for better performance
    CREATE INDEX idx_skill_name ON MarketSkillTrends(SkillName);
    CREATE INDEX idx_category ON MarketSkillTrends(Category);
    CREATE INDEX idx_trend_date ON MarketSkillTrends(TrendDate);
END

-- Add sample data for market trends
-- First check if data already exists to avoid duplicates
IF NOT EXISTS (SELECT TOP 1 1 FROM MarketSkillTrends)
BEGIN
    INSERT INTO MarketSkillTrends 
        (SkillName, Category, DemandScore, GrowthRate, TrendDate)
    VALUES
        ('Cloud Computing', 'Technical', 9.2, 27.0, GETDATE()),
        ('Data Science', 'Technical', 9.0, 35.0, GETDATE()),
        ('Machine Learning', 'Technical', 8.9, 32.0, GETDATE()),
        ('DevOps', 'Technical', 8.7, 24.0, GETDATE()),
        ('Cybersecurity', 'Technical', 8.6, 28.0, GETDATE()),
        ('Agile Methodology', 'Process', 8.5, 18.0, GETDATE()),
        ('Big Data', 'Technical', 8.4, 21.0, GETDATE()),
        ('Artificial Intelligence', 'Technical', 8.3, 30.0, GETDATE()),
        ('React', 'Technical', 8.2, 20.0, GETDATE()),
        ('Node.js', 'Technical', 8.1, 17.0, GETDATE()),
        ('Python', 'Technical', 8.0, 22.0, GETDATE()),
        ('AWS', 'Technical', 7.9, 25.0, GETDATE()),
        ('Azure', 'Technical', 7.8, 23.0, GETDATE()),
        ('Docker', 'Technical', 7.7, 19.0, GETDATE()),
        ('Kubernetes', 'Technical', 7.6, 26.0, GETDATE()),
        ('Blockchain', 'Technical', 7.5, 15.0, GETDATE()),
        ('UI/UX Design', 'Design', 7.4, 18.0, GETDATE()),
        ('Product Management', 'Business', 7.3, 16.0, GETDATE()),
        ('Business Analysis', 'Business', 7.2, 14.0, GETDATE()),
        ('Project Management', 'Business', 7.1, 12.0, GETDATE());
END;

-- Skills gap analysis cache table - for storing computed gap analysis results
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SkillsGapAnalysisCache]') AND type in (N'U'))
BEGIN
    CREATE TABLE SkillsGapAnalysisCache (
        SkillsGapAnalysisCacheID INT IDENTITY(1,1) PRIMARY KEY,
        AnalysisType NVARCHAR(20) NOT NULL CHECK (AnalysisType IN ('organization', 'department', 'resource')),
        EntityID INT NULL, -- Department ID or Resource ID, NULL for organization-wide
        Parameters NVARCHAR(MAX) NOT NULL, -- JSON storing analysis parameters
        Result NVARCHAR(MAX) NOT NULL, -- JSON storing the complete analysis results
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        ExpiresAt DATETIME2 NOT NULL -- When this cache entry expires
    );

    -- Create indexes for better performance
    CREATE INDEX idx_analysis_type_entity ON SkillsGapAnalysisCache(AnalysisType, EntityID);
    CREATE INDEX idx_expires_at ON SkillsGapAnalysisCache(ExpiresAt);
END;

-- Skills gap recommendations table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SkillsGapRecommendations]') AND type in (N'U'))
BEGIN
    CREATE TABLE SkillsGapRecommendations (
        SkillsGapRecommendationID INT IDENTITY(1,1) PRIMARY KEY,
        AnalysisID INT NOT NULL,
        RecommendationType NVARCHAR(50) NOT NULL, -- e.g., "training", "hiring", "critical_gap"
        Description NVARCHAR(MAX) NOT NULL,
        Details NVARCHAR(MAX) NULL,
        Priority NVARCHAR(10) NOT NULL CHECK (Priority IN ('low', 'medium', 'high')),
        Metadata NVARCHAR(MAX) NULL, -- Additional data like skills, categories, etc.
        CreatedAt DATETIME2 DEFAULT GETDATE()
        -- Removing the foreign key constraint for now to simplify setup
        -- CONSTRAINT FK_SkillsGapRecommendations_AnalysisCache FOREIGN KEY (AnalysisID) 
        --    REFERENCES SkillsGapAnalysisCache(SkillsGapAnalysisCacheID) ON DELETE CASCADE
    );
END;
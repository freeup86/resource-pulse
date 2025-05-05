-- Client Satisfaction Tables for ResourcePulse

-- Clients table (if not already exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clients')
BEGIN
    CREATE TABLE Clients (
        ClientID INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL UNIQUE,
        Industry NVARCHAR(100) NULL,
        ContactName NVARCHAR(200) NULL,
        ContactEmail NVARCHAR(200) NULL,
        ContactPhone NVARCHAR(50) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );
    
    -- Add a note about the Clients table creation
    PRINT 'Created Clients table';
    
    -- Migrate existing client names from Projects
    INSERT INTO Clients (Name, Industry)
    SELECT DISTINCT Client, 'Unknown' FROM Projects;
    
    PRINT 'Migrated existing client names from Projects table';
    
    -- Add ClientID column to Projects if needed
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'ClientID' AND object_id = OBJECT_ID('Projects'))
    BEGIN
        ALTER TABLE Projects
        ADD ClientID INT NULL;
        
        PRINT 'Added ClientID column to Projects table';
        
        -- Update the ClientID values
        UPDATE p
        SET p.ClientID = c.ClientID
        FROM Projects p
        JOIN Clients c ON p.Client = c.Name;
        
        PRINT 'Updated ClientID references in Projects table';
    END
END
ELSE
BEGIN
    PRINT 'Clients table already exists';
END

-- Client Satisfaction Ratings table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SatisfactionRatings')
BEGIN
    CREATE TABLE SatisfactionRatings (
        RatingID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        ResourceID INT NOT NULL,
        Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
        Feedback NVARCHAR(MAX) NULL,
        RatingDate DATETIME2 DEFAULT GETDATE(),
        RatedBy NVARCHAR(100) NULL,
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE,
        FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE CASCADE
    );
    
    PRINT 'Created SatisfactionRatings table';
END
ELSE
BEGIN
    PRINT 'SatisfactionRatings table already exists';
END

-- Client Satisfaction Predictions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SatisfactionPredictions')
BEGIN
    CREATE TABLE SatisfactionPredictions (
        PredictionID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        ResourceID INT NOT NULL,
        SatisfactionProbability INT NOT NULL CHECK (SatisfactionProbability BETWEEN 0 AND 100),
        PositiveFactors NVARCHAR(MAX) NULL,
        NegativeFactors NVARCHAR(MAX) NULL,
        Recommendations NVARCHAR(MAX) NULL,
        RiskLevel NVARCHAR(20) NOT NULL CHECK (RiskLevel IN ('low', 'medium', 'high')),
        ConfidenceScore FLOAT NOT NULL,
        AIGenerated BIT DEFAULT 0,
        PredictionDate DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE,
        FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE CASCADE
    );
    
    PRINT 'Created SatisfactionPredictions table';
END
ELSE
BEGIN
    PRINT 'SatisfactionPredictions table already exists';
END

-- Create index on SatisfactionPredictions
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SatisfactionPredictions_ProjectResource' AND object_id = OBJECT_ID('SatisfactionPredictions'))
BEGIN
    CREATE INDEX IX_SatisfactionPredictions_ProjectResource 
    ON SatisfactionPredictions(ProjectID, ResourceID);
    
    PRINT 'Created index on SatisfactionPredictions';
END

-- Create index on SatisfactionRatings
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SatisfactionRatings_ProjectResource' AND object_id = OBJECT_ID('SatisfactionRatings'))
BEGIN
    CREATE INDEX IX_SatisfactionRatings_ProjectResource 
    ON SatisfactionRatings(ProjectID, ResourceID);
    
    PRINT 'Created index on SatisfactionRatings';
END

-- Client Preferences table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ClientPreferences')
BEGIN
    CREATE TABLE ClientPreferences (
        ClientPreferenceID INT IDENTITY(1,1) PRIMARY KEY,
        ClientID INT NOT NULL,
        CommunicationFrequency NVARCHAR(20) DEFAULT 'weekly' CHECK (CommunicationFrequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
        PreferredSkills NVARCHAR(MAX) NULL, -- Stored as JSON
        PreferredRoles NVARCHAR(MAX) NULL, -- Stored as JSON
        PreferredWorkStyle NVARCHAR(20) DEFAULT 'agile' CHECK (PreferredWorkStyle IN ('agile', 'waterfall', 'hybrid')),
        IndustryExperience NVARCHAR(20) DEFAULT 'preferred' CHECK (IndustryExperience IN ('required', 'preferred', 'not_important')),
        LastUpdated DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ClientID) REFERENCES Clients(ClientID) ON DELETE CASCADE,
        CONSTRAINT UQ_ClientPreferences_ClientID UNIQUE (ClientID)
    );
    
    PRINT 'Created ClientPreferences table';
END
ELSE
BEGIN
    PRINT 'ClientPreferences table already exists';
END
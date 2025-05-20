-- SQL Schema for Enhanced What-If Scenario Planning

-- 1. Check if CapacityScenarios table exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CapacityScenarios')
BEGIN
    -- Create CapacityScenarios table
    CREATE TABLE CapacityScenarios (
        ScenarioID INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Type NVARCHAR(50) DEFAULT 'CAPACITY' NOT NULL,
        BaseScenarioID INT NULL,
        StartDate DATE NULL,
        EndDate DATE NULL,
        MetricsData NVARCHAR(MAX) NULL,
        ComparisonData NVARCHAR(MAX) NULL,
        CreatedBy INT NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );
END
ELSE
BEGIN
    -- Check and add columns to CapacityScenarios if they don't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CapacityScenarios' AND COLUMN_NAME = 'Type')
    BEGIN
        ALTER TABLE CapacityScenarios
        ADD Type NVARCHAR(50) DEFAULT 'CAPACITY' NOT NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CapacityScenarios' AND COLUMN_NAME = 'BaseScenarioID')
    BEGIN
        ALTER TABLE CapacityScenarios
        ADD BaseScenarioID INT NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CapacityScenarios' AND COLUMN_NAME = 'StartDate')
    BEGIN
        ALTER TABLE CapacityScenarios
        ADD StartDate DATE NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CapacityScenarios' AND COLUMN_NAME = 'EndDate')
    BEGIN
        ALTER TABLE CapacityScenarios
        ADD EndDate DATE NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CapacityScenarios' AND COLUMN_NAME = 'MetricsData')
    BEGIN
        ALTER TABLE CapacityScenarios
        ADD MetricsData NVARCHAR(MAX) NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CapacityScenarios' AND COLUMN_NAME = 'ComparisonData')
    BEGIN
        ALTER TABLE CapacityScenarios
        ADD ComparisonData NVARCHAR(MAX) NULL;
    END
    
    -- Add foreign key constraint for self-referencing scenarios if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_BaseScenario')
    BEGIN
        ALTER TABLE CapacityScenarios
        ADD CONSTRAINT FK_BaseScenario FOREIGN KEY (BaseScenarioID)
            REFERENCES CapacityScenarios(ScenarioID);
    END
END

-- 2. Check if ScenarioAllocations table exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ScenarioAllocations')
BEGIN
    -- Create ScenarioAllocations table
    CREATE TABLE ScenarioAllocations (
        ScenarioAllocationID INT IDENTITY(1,1) PRIMARY KEY,
        ScenarioID INT NOT NULL,
        ResourceID INT NOT NULL,
        ProjectID INT NOT NULL,
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        Utilization INT NOT NULL CHECK (Utilization BETWEEN 1 AND 100),
        BillableRate MONEY NULL,
        HourlyRate MONEY NULL,
        TotalHours INT NULL,
        SkillsRequired NVARCHAR(MAX) NULL,
        RolesRequired NVARCHAR(MAX) NULL,
        Notes NVARCHAR(MAX) NULL,
        IsTemporary BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ScenarioID) REFERENCES CapacityScenarios(ScenarioID) ON DELETE CASCADE,
        FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
    );
END
ELSE
BEGIN
    -- Check and add columns to ScenarioAllocations if they don't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ScenarioAllocations' AND COLUMN_NAME = 'BillableRate')
    BEGIN
        ALTER TABLE ScenarioAllocations
        ADD BillableRate MONEY NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ScenarioAllocations' AND COLUMN_NAME = 'HourlyRate')
    BEGIN
        ALTER TABLE ScenarioAllocations
        ADD HourlyRate MONEY NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ScenarioAllocations' AND COLUMN_NAME = 'TotalHours')
    BEGIN
        ALTER TABLE ScenarioAllocations
        ADD TotalHours INT NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ScenarioAllocations' AND COLUMN_NAME = 'SkillsRequired')
    BEGIN
        ALTER TABLE ScenarioAllocations
        ADD SkillsRequired NVARCHAR(MAX) NULL;
    END
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ScenarioAllocations' AND COLUMN_NAME = 'RolesRequired')
    BEGIN
        ALTER TABLE ScenarioAllocations
        ADD RolesRequired NVARCHAR(MAX) NULL;
    END
END

-- 3. Create ScenarioTimelineChanges table if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ScenarioTimelineChanges')
BEGIN
    CREATE TABLE ScenarioTimelineChanges (
        ChangeID INT IDENTITY(1,1) PRIMARY KEY,
        ScenarioID INT NOT NULL,
        ProjectID INT NOT NULL,
        OriginalStartDate DATE NULL,
        OriginalEndDate DATE NULL,
        NewStartDate DATE NOT NULL,
        NewEndDate DATE NOT NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ScenarioID) REFERENCES CapacityScenarios(ScenarioID) ON DELETE CASCADE,
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
    );
END

-- 4. Create ScenarioResourceChanges table if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ScenarioResourceChanges')
BEGIN
    CREATE TABLE ScenarioResourceChanges (
        ChangeID INT IDENTITY(1,1) PRIMARY KEY,
        ScenarioID INT NOT NULL,
        ResourceID INT NULL,
        ResourceName NVARCHAR(200) NULL,
        ResourceRole NVARCHAR(100) NULL,
        Skills NVARCHAR(MAX) NULL,
        HourlyRate MONEY NULL,
        BillableRate MONEY NULL,
        ChangeType NVARCHAR(50) NOT NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ScenarioID) REFERENCES CapacityScenarios(ScenarioID) ON DELETE CASCADE,
        FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID)
    );
END

-- 5. Create ScenarioComparisons table if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ScenarioComparisons')
BEGIN
    CREATE TABLE ScenarioComparisons (
        ComparisonID INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Scenarios NVARCHAR(MAX) NOT NULL,
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        MetricsToCompare NVARCHAR(MAX) NOT NULL,
        ComparisonData NVARCHAR(MAX) NULL,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );
END

-- 6. Add settings for what-if scenario planning if they don't exist
IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = 'whatIfMaxYears')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, Description)
    VALUES ('whatIfMaxYears', '5', 'Maximum years for what-if scenario planning');
END

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = 'whatIfDefaultPeriodMonths')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, Description)
    VALUES ('whatIfDefaultPeriodMonths', '12', 'Default period length in months for what-if scenarios');
END

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = 'enableWhatIfSkillsTracking')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, Description)
    VALUES ('enableWhatIfSkillsTracking', 'true', 'Enable skills coverage tracking in what-if scenarios');
END
-- SQL Schema for Enhanced What-If Scenario Planning

-- 1. Enhance the CapacityScenarios table with new fields
ALTER TABLE CapacityScenarios
ADD Type NVARCHAR(50) DEFAULT 'CAPACITY' NOT NULL, -- 'CAPACITY', 'WHATIF', etc.
    BaseScenarioID INT NULL, -- Reference to a parent scenario if this is a variant
    StartDate DATE NULL, -- Planning period start
    EndDate DATE NULL, -- Planning period end
    MetricsData NVARCHAR(MAX) NULL, -- Cached metrics calculations in JSON format
    ComparisonData NVARCHAR(MAX) NULL; -- Scenario comparison data

-- Add foreign key constraint for self-referencing scenarios
ALTER TABLE CapacityScenarios
ADD CONSTRAINT FK_BaseScenario FOREIGN KEY (BaseScenarioID)
    REFERENCES CapacityScenarios(ScenarioID);

-- 2. Enhance ScenarioAllocations table with cost tracking
ALTER TABLE ScenarioAllocations
ADD BillableRate MONEY NULL, -- Billable rate for this allocation
    HourlyRate MONEY NULL, -- Cost rate for this allocation
    TotalHours INT NULL, -- Estimated total hours
    SkillsRequired NVARCHAR(MAX) NULL, -- JSON array of required skills for this allocation
    RolesRequired NVARCHAR(MAX) NULL; -- JSON array of required roles for this allocation

-- 3. Create Scenario Timeline Changes table
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

-- 4. Create Scenario Resource Changes table (for adding/removing resources)
CREATE TABLE ScenarioResourceChanges (
    ChangeID INT IDENTITY(1,1) PRIMARY KEY,
    ScenarioID INT NOT NULL,
    ResourceID INT NULL, -- NULL for hypothetical/new resources
    ResourceName NVARCHAR(200) NULL, -- Name for hypothetical resources
    ResourceRole NVARCHAR(100) NULL, -- Role for hypothetical resources
    Skills NVARCHAR(MAX) NULL, -- JSON array of skills
    HourlyRate MONEY NULL,
    BillableRate MONEY NULL,
    ChangeType NVARCHAR(50) NOT NULL, -- 'ADD', 'REMOVE', 'MODIFY'
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ScenarioID) REFERENCES CapacityScenarios(ScenarioID) ON DELETE CASCADE,
    FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID)
);

-- 5. Create Scenario Comparison table
CREATE TABLE ScenarioComparisons (
    ComparisonID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Scenarios NVARCHAR(MAX) NOT NULL, -- JSON array of scenario IDs being compared
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    MetricsToCompare NVARCHAR(MAX) NOT NULL, -- JSON array of metrics to include in comparison
    ComparisonData NVARCHAR(MAX) NULL, -- JSON containing full comparison data
    CreatedBy INT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- 6. Add settings for what-if scenario planning
IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = 'whatIfMaxYears')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, SettingDescription)
    VALUES ('whatIfMaxYears', '5', 'Maximum years for what-if scenario planning');
END

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = 'whatIfDefaultPeriodMonths')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, SettingDescription)
    VALUES ('whatIfDefaultPeriodMonths', '12', 'Default period length in months for what-if scenarios');
END

IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = 'enableWhatIfSkillsTracking')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, SettingDescription)
    VALUES ('enableWhatIfSkillsTracking', 'true', 'Enable skills coverage tracking in what-if scenarios');
END
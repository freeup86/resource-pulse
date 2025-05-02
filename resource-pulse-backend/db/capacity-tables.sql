-- SQL Schema for Resource Capacity Planning

-- Capacity Scenarios table
CREATE TABLE CapacityScenarios (
    ScenarioID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedBy INT NULL, -- User who created the scenario
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Scenario Allocations table (for "what-if" temporary assignments)
CREATE TABLE ScenarioAllocations (
    ScenarioAllocationID INT IDENTITY(1,1) PRIMARY KEY,
    ScenarioID INT NOT NULL,
    ResourceID INT NOT NULL,
    ProjectID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Utilization INT NOT NULL CHECK (Utilization BETWEEN 1 AND 100),
    Notes NVARCHAR(MAX) NULL,
    IsTemporary BIT DEFAULT 1, -- Indicates this is a "what-if" allocation
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ScenarioID) REFERENCES CapacityScenarios(ScenarioID) ON DELETE CASCADE,
    FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID),
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
);

-- Resource Capacity table (to track available capacity over time)
CREATE TABLE ResourceCapacity (
    CapacityID INT IDENTITY(1,1) PRIMARY KEY,
    ResourceID INT NOT NULL,
    Year INT NOT NULL,
    Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
    AvailableCapacity INT NOT NULL DEFAULT 100, -- Maximum capacity percentage
    PlannedTimeOff INT DEFAULT 0, -- Time off percentage (vacations, holidays)
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE CASCADE,
    CONSTRAINT UQ_ResourceCapacity UNIQUE (ResourceID, Year, Month)
);

-- Capacity Reports table
CREATE TABLE CapacityReports (
    ReportID INT IDENTITY(1,1) PRIMARY KEY,
    ReportName NVARCHAR(200) NOT NULL,
    ScenarioID INT NULL, -- If report is based on a specific scenario
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    ReportData NVARCHAR(MAX) NULL, -- JSON representation of the report data
    CreatedBy INT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ScenarioID) REFERENCES CapacityScenarios(ScenarioID)
);

-- Add settings for capacity planning
-- Check if the setting already exists
IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = 'capacityForecastMonths')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, SettingDescription)
    VALUES ('capacityForecastMonths', '6', 'Number of months to include in capacity forecasting');
END
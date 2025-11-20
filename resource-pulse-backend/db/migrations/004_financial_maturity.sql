-- Create ProjectBudgetItems table for non-labor expenses
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProjectBudgetItems' and xtype='U')
BEGIN
    CREATE TABLE ProjectBudgetItems (
        BudgetItemID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        Category NVARCHAR(100) NOT NULL, -- e.g., Software, Travel, Hardware
        Description NVARCHAR(255) NULL,
        PlannedAmount DECIMAL(14, 2) NOT NULL DEFAULT 0,
        ActualAmount DECIMAL(14, 2) NULL DEFAULT 0,
        DateCreated DATETIME2 DEFAULT GETDATE(),
        LastUpdated DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
    );
    CREATE INDEX IX_ProjectBudgetItems_Project ON ProjectBudgetItems(ProjectID);
END;

-- Create ProjectFinancialSnapshots table for historical tracking
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProjectFinancialSnapshots' and xtype='U')
BEGIN
    CREATE TABLE ProjectFinancialSnapshots (
        SnapshotID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        SnapshotDate DATETIME2 DEFAULT GETDATE(),
        SnapshotName NVARCHAR(100) NULL, -- e.g., "Baseline Q1", "Month End Jan"
        PlannedBudget DECIMAL(14, 2) NULL,
        ActualCost DECIMAL(14, 2) NULL,
        ForecastedCost DECIMAL(14, 2) NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedBy NVARCHAR(100) NULL,
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
    );
    CREATE INDEX IX_ProjectFinancialSnapshots_Project ON ProjectFinancialSnapshots(ProjectID);
END;

-- Create ExchangeRates table for multi-currency support
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExchangeRates' and xtype='U')
BEGIN
    CREATE TABLE ExchangeRates (
        RateID INT IDENTITY(1,1) PRIMARY KEY,
        SourceCurrency NVARCHAR(3) NOT NULL, -- e.g., EUR
        TargetCurrency NVARCHAR(3) NOT NULL DEFAULT 'USD',
        Rate DECIMAL(18, 6) NOT NULL,
        EffectiveDate DATE NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX IX_ExchangeRates_Currency_Date ON ExchangeRates(SourceCurrency, TargetCurrency, EffectiveDate);
END;

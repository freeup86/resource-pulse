-- Create ProjectFinancialPhasing table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProjectFinancialPhasing' and xtype='U')
BEGIN
    CREATE TABLE ProjectFinancialPhasing (
        PhasingID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        Period DATE NOT NULL, -- e.g., 2023-01-01
        Amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        Type NVARCHAR(50) NOT NULL DEFAULT 'Budget', -- Budget, Forecast, Actual
        Category NVARCHAR(50) NOT NULL DEFAULT 'Labor', -- Labor, Software, Hardware, Other
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_ProjectFinancialPhasing_Project ON ProjectFinancialPhasing(ProjectID);
    CREATE INDEX IX_ProjectFinancialPhasing_Period ON ProjectFinancialPhasing(Period);
END;

-- Create ProjectRAID table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProjectRAID' and xtype='U')
BEGIN
    CREATE TABLE ProjectRAID (
        RAIDID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        Type NVARCHAR(50) NOT NULL, -- Risk, Assumption, Issue, Dependency
        Description NVARCHAR(MAX) NOT NULL,
        Impact NVARCHAR(20) NULL, -- High, Medium, Low
        Probability NVARCHAR(20) NULL, -- High, Medium, Low (Only for Risks)
        Status NVARCHAR(50) DEFAULT 'Open', -- Open, Closed, Mitigated
        Owner NVARCHAR(100) NULL,
        DueDate DATE NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_ProjectRAID_Project ON ProjectRAID(ProjectID);
    CREATE INDEX IX_ProjectRAID_Type ON ProjectRAID(Type);
END;

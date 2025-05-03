-- Financial Tracking Schema Updates

-- Add financial attributes to Resources table
ALTER TABLE Resources 
ADD HourlyRate DECIMAL(10, 2) NULL,
ADD BillableRate DECIMAL(10, 2) NULL,
ADD Currency NVARCHAR(3) DEFAULT 'USD',
ADD CostCenter NVARCHAR(100) NULL;

-- Add budget fields to Projects table
ALTER TABLE Projects
ADD Budget DECIMAL(14, 2) NULL,
ADD ActualCost DECIMAL(14, 2) NULL,
ADD BudgetUtilization DECIMAL(5, 2) NULL,
ADD Currency NVARCHAR(3) DEFAULT 'USD',
ADD FinancialNotes NVARCHAR(MAX) NULL;

-- Create project financial snapshots table for tracking over time
CREATE TABLE ProjectFinancialSnapshots (
    SnapshotID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    SnapshotDate DATE NOT NULL,
    PlannedBudget DECIMAL(14, 2) NULL,
    ActualCost DECIMAL(14, 2) NULL,
    ForecastedCost DECIMAL(14, 2) NULL,
    Variance DECIMAL(14, 2) NULL,
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
);

-- Add financial tracking to allocations
ALTER TABLE Allocations
ADD HourlyRate DECIMAL(10, 2) NULL,
ADD BillableRate DECIMAL(10, 2) NULL,
ADD TotalHours INT NULL,
ADD TotalCost DECIMAL(14, 2) NULL,
ADD BillableAmount DECIMAL(14, 2) NULL,
ADD IsBillable BIT DEFAULT 1,
ADD BillingType NVARCHAR(50) DEFAULT 'Hourly';

-- Create time entries table for detailed tracking
CREATE TABLE TimeEntries (
    TimeEntryID INT IDENTITY(1,1) PRIMARY KEY,
    AllocationID INT NOT NULL,
    ResourceID INT NOT NULL,
    ProjectID INT NOT NULL,
    EntryDate DATE NOT NULL,
    Hours DECIMAL(5, 2) NOT NULL,
    Description NVARCHAR(500) NULL,
    IsBillable BIT DEFAULT 1,
    Status NVARCHAR(50) DEFAULT 'Submitted',
    ApprovedBy INT NULL,
    ApprovedAt DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (AllocationID) REFERENCES Allocations(AllocationID) ON DELETE CASCADE,
    FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE NO ACTION,
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE NO ACTION
);

-- Create invoicing table for billing
CREATE TABLE Invoices (
    InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    InvoiceNumber NVARCHAR(100) NOT NULL,
    InvoiceDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    Amount DECIMAL(14, 2) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Draft',
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE NO ACTION
);

-- Create invoice line items table
CREATE TABLE InvoiceLineItems (
    LineItemID INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID INT NOT NULL,
    ResourceID INT NULL,
    Description NVARCHAR(500) NOT NULL,
    Quantity DECIMAL(10, 2) NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    Amount DECIMAL(14, 2) NOT NULL,
    FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID) ON DELETE CASCADE,
    FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE NO ACTION
);

-- Create budget items table for detailed project budgeting
CREATE TABLE BudgetItems (
    BudgetItemID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    PlannedAmount DECIMAL(14, 2) NOT NULL,
    ActualAmount DECIMAL(14, 2) NULL,
    Variance DECIMAL(14, 2) NULL,
    Notes NVARCHAR(MAX) NULL,
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
);

-- Add indexed views for reporting
CREATE VIEW vw_ProjectFinancials AS
SELECT 
    p.ProjectID,
    p.Name AS ProjectName,
    p.Budget AS PlannedBudget,
    p.ActualCost,
    COALESCE(p.Budget, 0) - COALESCE(p.ActualCost, 0) AS Variance,
    CASE 
        WHEN p.Budget > 0 THEN (COALESCE(p.ActualCost, 0) / p.Budget) * 100 
        ELSE NULL 
    END AS BudgetUtilizationPercentage,
    -- Calculate resource costs from allocations
    (
        SELECT SUM(a.TotalCost)
        FROM Allocations a
        WHERE a.ProjectID = p.ProjectID
    ) AS AllocatedCost,
    -- Calculate billable amounts from allocations
    (
        SELECT SUM(a.BillableAmount)
        FROM Allocations a
        WHERE a.ProjectID = p.ProjectID
    ) AS BillableAmount,
    -- Calculate profit
    (
        SELECT SUM(a.BillableAmount) - SUM(a.TotalCost)
        FROM Allocations a
        WHERE a.ProjectID = p.ProjectID
    ) AS ProjectProfit,
    -- Calculate margin percentage
    CASE 
        WHEN (SELECT SUM(a.BillableAmount) FROM Allocations a WHERE a.ProjectID = p.ProjectID) > 0 
        THEN ((SELECT SUM(a.BillableAmount) - SUM(a.TotalCost) FROM Allocations a WHERE a.ProjectID = p.ProjectID) / 
              (SELECT SUM(a.BillableAmount) FROM Allocations a WHERE a.ProjectID = p.ProjectID)) * 100
        ELSE NULL
    END AS ProfitMarginPercentage,
    p.StartDate,
    p.EndDate,
    p.Status,
    p.Currency
FROM Projects p;

-- Create view for resource financial performance
CREATE VIEW vw_ResourceFinancials AS
SELECT 
    r.ResourceID,
    r.Name AS ResourceName,
    r.HourlyRate,
    r.BillableRate,
    r.Currency,
    -- Calculate total allocated hours
    (
        SELECT SUM(a.TotalHours)
        FROM Allocations a
        WHERE a.ResourceID = r.ResourceID
    ) AS TotalAllocatedHours,
    -- Calculate total actual hours
    (
        SELECT SUM(t.Hours)
        FROM TimeEntries t
        WHERE t.ResourceID = r.ResourceID
    ) AS TotalActualHours,
    -- Calculate total cost
    (
        SELECT SUM(a.TotalCost)
        FROM Allocations a
        WHERE a.ResourceID = r.ResourceID
    ) AS TotalCost,
    -- Calculate total billable amount
    (
        SELECT SUM(a.BillableAmount)
        FROM Allocations a
        WHERE a.ResourceID = r.ResourceID AND a.IsBillable = 1
    ) AS TotalBillableAmount,
    -- Calculate utilization rate
    CASE 
        WHEN (SELECT SUM(t.Hours) FROM TimeEntries t WHERE t.ResourceID = r.ResourceID) > 0
        THEN (SELECT SUM(CASE WHEN t.IsBillable = 1 THEN t.Hours ELSE 0 END) FROM TimeEntries t WHERE t.ResourceID = r.ResourceID) /
             (SELECT SUM(t.Hours) FROM TimeEntries t WHERE t.ResourceID = r.ResourceID) * 100
        ELSE NULL
    END AS BillableUtilizationRate
FROM Resources r;

-- Add stored procedure for recalculating project costs
CREATE PROCEDURE sp_RecalculateProjectFinancials
    @ProjectID INT
AS
BEGIN
    DECLARE @TotalCost DECIMAL(14, 2) = 0;
    DECLARE @BillableAmount DECIMAL(14, 2) = 0;
    
    -- Calculate from allocations
    SELECT 
        @TotalCost = SUM(COALESCE(TotalCost, 0)),
        @BillableAmount = SUM(COALESCE(BillableAmount, 0))
    FROM Allocations
    WHERE ProjectID = @ProjectID;
    
    -- Update project with calculated values
    UPDATE Projects
    SET 
        ActualCost = @TotalCost,
        BudgetUtilization = CASE WHEN Budget > 0 THEN (@TotalCost / Budget) * 100 ELSE NULL END
    WHERE ProjectID = @ProjectID;
    
    -- Create a financial snapshot
    INSERT INTO ProjectFinancialSnapshots (
        ProjectID, 
        SnapshotDate, 
        PlannedBudget, 
        ActualCost, 
        ForecastedCost, 
        Variance,
        Notes
    )
    SELECT 
        ProjectID,
        GETDATE(),
        Budget,
        @TotalCost,
        -- Simple forecasting based on current burn rate and remaining time
        CASE 
            WHEN DATEDIFF(day, GETDATE(), EndDate) > 0 AND DATEDIFF(day, StartDate, GETDATE()) > 0
            THEN @TotalCost * (DATEDIFF(day, StartDate, EndDate) / CAST(DATEDIFF(day, StartDate, GETDATE()) AS FLOAT))
            ELSE @TotalCost
        END,
        Budget - @TotalCost,
        'Automatic snapshot generated by system'
    FROM Projects
    WHERE ProjectID = @ProjectID;
END;
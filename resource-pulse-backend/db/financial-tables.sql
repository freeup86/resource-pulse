-- Financial tables and columns for resource-pulse
-- This script adds financial tracking capabilities to the database

-- Update the Projects table with financial columns
ALTER TABLE Projects ADD
    Budget DECIMAL(14, 2) NULL,
    ActualCost DECIMAL(14, 2) NULL,
    BudgetUtilization DECIMAL(5, 2) NULL,
    Currency VARCHAR(3) DEFAULT 'USD',
    FinancialNotes NVARCHAR(MAX) NULL;

-- Add financial metric columns to track additional KPIs
ALTER TABLE Projects ADD
    BillableAmount DECIMAL(14, 2) NULL,
    ForecastedCost DECIMAL(14, 2) NULL;

-- Update the Resources table with financial columns
ALTER TABLE Resources ADD
    HourlyRate DECIMAL(10, 2) NULL,
    BillableRate DECIMAL(10, 2) NULL, 
    Currency VARCHAR(3) DEFAULT 'USD',
    CostCenter VARCHAR(50) NULL;

-- Create table for project budget items
CREATE TABLE ProjectBudgetItems (
    BudgetItemID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    Category VARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    PlannedAmount DECIMAL(14, 2) NOT NULL,
    ActualAmount DECIMAL(14, 2) NULL,
    DateCreated DATETIME DEFAULT GETDATE(),
    LastUpdated DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ProjectBudgetItems_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
);

-- Create table for tracking financial snapshots over time
CREATE TABLE ProjectFinancialSnapshots (
    SnapshotID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    SnapshotDate DATETIME DEFAULT GETDATE(),
    PlannedBudget DECIMAL(14, 2) NULL,
    ActualCost DECIMAL(14, 2) NULL,
    ForecastedCost DECIMAL(14, 2) NULL,
    Notes NVARCHAR(MAX) NULL,
    CreatedBy VARCHAR(100) NULL,
    CONSTRAINT FK_ProjectFinancialSnapshots_Projects FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
);

-- Update allocation table with financial fields
ALTER TABLE ResourceAllocations ADD
    HourlyRate DECIMAL(10, 2) NULL,
    BillableRate DECIMAL(10, 2) NULL,
    TotalHours INT NULL,
    IsBillable BIT DEFAULT 1,
    TotalCost DECIMAL(14, 2) NULL,
    BillableAmount DECIMAL(14, 2) NULL;

-- Create view for financial metrics
CREATE OR ALTER VIEW ProjectFinancialMetrics AS
SELECT 
    p.ProjectID,
    p.Name AS ProjectName,
    p.Budget,
    p.ActualCost,
    p.BillableAmount,
    ISNULL(p.Budget, 0) - ISNULL(p.ActualCost, 0) AS Variance,
    CASE 
        WHEN ISNULL(p.Budget, 0) = 0 THEN 0
        ELSE (ISNULL(p.ActualCost, 0) / ISNULL(p.Budget, 0)) * 100 
    END AS BudgetUtilizationPercentage,
    ISNULL(p.BillableAmount, 0) - ISNULL(p.ActualCost, 0) AS Profit,
    CASE 
        WHEN ISNULL(p.BillableAmount, 0) = 0 THEN 0
        ELSE ((ISNULL(p.BillableAmount, 0) - ISNULL(p.ActualCost, 0)) / ISNULL(p.BillableAmount, 0)) * 100 
    END AS ProfitMargin
FROM 
    Projects p;

-- Create stored procedure for recalculating project financials
CREATE OR ALTER PROCEDURE RecalculateProjectFinancials
    @ProjectID INT
AS
BEGIN
    DECLARE @TotalCost DECIMAL(14, 2) = 0;
    DECLARE @TotalBillable DECIMAL(14, 2) = 0;

    -- Calculate the total cost and billable amount from allocations
    SELECT 
        @TotalCost = SUM(ISNULL(TotalCost, 0)),
        @TotalBillable = SUM(ISNULL(BillableAmount, 0))
    FROM 
        ResourceAllocations
    WHERE 
        ProjectID = @ProjectID;

    -- Update the project financials
    UPDATE Projects
    SET 
        ActualCost = @TotalCost,
        BillableAmount = @TotalBillable,
        BudgetUtilization = CASE 
                                WHEN ISNULL(Budget, 0) = 0 THEN 0
                                ELSE (@TotalCost / Budget) * 100
                            END,
        LastUpdated = GETDATE()
    WHERE 
        ProjectID = @ProjectID;
END;

-- Create a trigger to update project financials when allocations change
CREATE OR ALTER TRIGGER TRG_ResourceAllocations_FinancialUpdate
ON ResourceAllocations
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get the distinct project IDs affected by the changes
    DECLARE @AffectedProjects TABLE (ProjectID INT);
    
    -- From inserted records
    INSERT INTO @AffectedProjects (ProjectID)
    SELECT DISTINCT ProjectID FROM inserted
    WHERE ProjectID IS NOT NULL;
    
    -- From deleted records
    INSERT INTO @AffectedProjects (ProjectID)
    SELECT DISTINCT ProjectID FROM deleted
    WHERE ProjectID IS NOT NULL
        AND ProjectID NOT IN (SELECT ProjectID FROM @AffectedProjects);
    
    -- Recalculate financials for each affected project
    DECLARE @ProjectID INT;
    
    DECLARE ProjectCursor CURSOR FOR 
    SELECT ProjectID FROM @AffectedProjects;
    
    OPEN ProjectCursor;
    FETCH NEXT FROM ProjectCursor INTO @ProjectID;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC RecalculateProjectFinancials @ProjectID;
        FETCH NEXT FROM ProjectCursor INTO @ProjectID;
    END;
    
    CLOSE ProjectCursor;
    DEALLOCATE ProjectCursor;
END;

-- Create a function to calculate allocation total cost and billable amount
CREATE OR ALTER FUNCTION CalculateAllocationFinancials(
    @StartDate DATE,
    @EndDate DATE,
    @Utilization DECIMAL(5, 2),
    @HourlyRate DECIMAL(10, 2),
    @BillableRate DECIMAL(10, 2),
    @IsBillable BIT
)
RETURNS @Results TABLE (
    TotalHours INT,
    TotalCost DECIMAL(14, 2),
    BillableAmount DECIMAL(14, 2)
)
AS
BEGIN
    DECLARE @WorkDays INT;
    DECLARE @TotalHours INT;
    DECLARE @TotalCost DECIMAL(14, 2);
    DECLARE @BillableAmount DECIMAL(14, 2);
    
    -- Calculate work days between dates (excluding weekends)
    SELECT @WorkDays = (
        DATEDIFF(DAY, @StartDate, @EndDate) + 1 -
        (DATEDIFF(WEEK, @StartDate, @EndDate) * 2) -
        CASE WHEN DATEPART(WEEKDAY, @StartDate) = 1 THEN 1 ELSE 0 END -
        CASE WHEN DATEPART(WEEKDAY, @EndDate) = 7 THEN 1 ELSE 0 END
    );
    
    IF @WorkDays < 0 SET @WorkDays = 0;
    
    -- Calculate total hours based on work days and utilization
    SET @TotalHours = @WorkDays * 8 * (@Utilization / 100.0);
    
    -- Calculate cost and billable amount
    SET @TotalCost = ISNULL(@HourlyRate, 0) * @TotalHours;
    SET @BillableAmount = CASE WHEN @IsBillable = 1 THEN ISNULL(@BillableRate, 0) * @TotalHours ELSE 0 END;
    
    INSERT INTO @Results (TotalHours, TotalCost, BillableAmount)
    VALUES (@TotalHours, @TotalCost, @BillableAmount);
    
    RETURN;
END;

-- Create a trigger to calculate allocation financials on insert/update
CREATE OR ALTER TRIGGER TRG_ResourceAllocations_CalculateFinancials
ON ResourceAllocations
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update the financial fields for newly inserted or updated allocations
    UPDATE ra
    SET 
        TotalHours = calc.TotalHours,
        TotalCost = calc.TotalCost,
        BillableAmount = calc.BillableAmount
    FROM 
        ResourceAllocations ra
    INNER JOIN 
        inserted i ON ra.AllocationID = i.AllocationID
    CROSS APPLY 
        CalculateAllocationFinancials(
            ra.StartDate, 
            ra.EndDate, 
            ra.Utilization, 
            ISNULL(ra.HourlyRate, (SELECT HourlyRate FROM Resources WHERE ResourceID = ra.ResourceID)), 
            ISNULL(ra.BillableRate, (SELECT BillableRate FROM Resources WHERE ResourceID = ra.ResourceID)),
            ISNULL(ra.IsBillable, 1)
        ) calc;
END;
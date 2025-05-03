-- Additional SQL functions and procedures for financial calculations

-- Function to calculate project cost variance
CREATE FUNCTION dbo.CalculateProjectVariance(@projectId INT)
RETURNS DECIMAL(14, 2)
AS
BEGIN
    DECLARE @budget DECIMAL(14, 2);
    DECLARE @actualCost DECIMAL(14, 2);
    DECLARE @variance DECIMAL(14, 2);

    -- Get project budget and actual cost
    SELECT 
        @budget = Budget,
        @actualCost = ActualCost
    FROM Projects
    WHERE ProjectID = @projectId;

    -- Calculate variance
    SET @variance = ISNULL(@budget, 0) - ISNULL(@actualCost, 0);

    RETURN @variance;
END;
GO

-- Function to calculate project budget utilization
CREATE FUNCTION dbo.CalculateProjectBudgetUtilization(@projectId INT)
RETURNS DECIMAL(5, 2)
AS
BEGIN
    DECLARE @budget DECIMAL(14, 2);
    DECLARE @actualCost DECIMAL(14, 2);
    DECLARE @utilization DECIMAL(5, 2);

    -- Get project budget and actual cost
    SELECT 
        @budget = Budget,
        @actualCost = ActualCost
    FROM Projects
    WHERE ProjectID = @projectId;

    -- Calculate budget utilization
    IF ISNULL(@budget, 0) > 0 
        SET @utilization = (ISNULL(@actualCost, 0) / @budget) * 100;
    ELSE
        SET @utilization = 0;

    RETURN @utilization;
END;
GO

-- Procedure to calculate project profit and margin
CREATE PROCEDURE dbo.CalculateProjectProfit
    @projectId INT,
    @profit DECIMAL(14, 2) OUTPUT,
    @margin DECIMAL(5, 2) OUTPUT
AS
BEGIN
    DECLARE @totalBillableAmount DECIMAL(14, 2);
    DECLARE @totalCost DECIMAL(14, 2);

    -- Get total billable amount and cost from allocations
    SELECT 
        @totalBillableAmount = SUM(COALESCE(BillableAmount, 0)),
        @totalCost = SUM(COALESCE(TotalCost, 0))
    FROM Allocations
    WHERE ProjectID = @projectId;

    -- Calculate profit
    SET @profit = ISNULL(@totalBillableAmount, 0) - ISNULL(@totalCost, 0);

    -- Calculate margin
    IF ISNULL(@totalBillableAmount, 0) > 0
        SET @margin = (@profit / @totalBillableAmount) * 100;
    ELSE
        SET @margin = 0;
END;
GO

-- Procedure to create a financial snapshot
CREATE PROCEDURE dbo.CreateProjectFinancialSnapshot
    @projectId INT,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
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
        @projectId, 
        GETDATE(), 
        Budget, 
        ActualCost,
        -- Simple forecasting based on current burn rate and remaining time
        CASE 
            WHEN DATEDIFF(day, GETDATE(), EndDate) > 0 AND DATEDIFF(day, StartDate, GETDATE()) > 0
            THEN ActualCost * (DATEDIFF(day, StartDate, EndDate) / CAST(DATEDIFF(day, StartDate, GETDATE()) AS FLOAT))
            ELSE ActualCost
        END,
        Budget - ActualCost,
        COALESCE(@notes, 'Automated snapshot')
    FROM Projects
    WHERE ProjectID = @projectId;
END;
GO

-- Enhanced project financials recalculation procedure
CREATE OR ALTER PROCEDURE dbo.sp_RecalculateProjectFinancials
    @ProjectID INT,
    @CreateSnapshot BIT = 0,
    @SnapshotNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    DECLARE @TotalCost DECIMAL(14, 2) = 0;
    DECLARE @BillableAmount DECIMAL(14, 2) = 0;
    DECLARE @Profit DECIMAL(14, 2) = 0;
    DECLARE @Margin DECIMAL(5, 2) = 0;
    
    -- Calculate from allocations
    SELECT 
        @TotalCost = SUM(COALESCE(TotalCost, 0)),
        @BillableAmount = SUM(COALESCE(BillableAmount, 0))
    FROM Allocations
    WHERE ProjectID = @ProjectID;
    
    -- Calculate profit and margin
    EXEC dbo.CalculateProjectProfit @ProjectID, @Profit OUTPUT, @Margin OUTPUT;
    
    -- Update project with calculated values
    UPDATE Projects
    SET 
        ActualCost = @TotalCost,
        BudgetUtilization = dbo.CalculateProjectBudgetUtilization(@ProjectID)
    WHERE ProjectID = @ProjectID;
    
    -- Create a financial snapshot if requested
    IF @CreateSnapshot = 1
    BEGIN
        EXEC dbo.CreateProjectFinancialSnapshot @ProjectID, @SnapshotNotes;
    END;
    
    -- Return updated values for immediate use
    SELECT 
        p.Budget AS PlannedBudget,
        p.ActualCost,
        dbo.CalculateProjectVariance(@ProjectID) AS Variance,
        p.BudgetUtilization AS BudgetUtilizationPercentage,
        @TotalCost AS AllocatedCost,
        @BillableAmount AS BillableAmount,
        @Profit AS ProjectProfit,
        @Margin AS ProfitMarginPercentage
    FROM Projects p
    WHERE p.ProjectID = @ProjectID;
END;
GO

-- Procedure for tracking budget items actual vs. planned
CREATE PROCEDURE dbo.UpdateBudgetItemActuals
    @BudgetItemID INT,
    @ActualAmount DECIMAL(14, 2)
AS
BEGIN
    DECLARE @ProjectID INT;
    DECLARE @PlannedAmount DECIMAL(14, 2);
    
    -- Get project ID and planned amount
    SELECT 
        @ProjectID = ProjectID,
        @PlannedAmount = PlannedAmount
    FROM BudgetItems
    WHERE BudgetItemID = @BudgetItemID;
    
    -- Update budget item
    UPDATE BudgetItems
    SET 
        ActualAmount = @ActualAmount,
        Variance = PlannedAmount - @ActualAmount
    WHERE BudgetItemID = @BudgetItemID;
    
    -- Recalculate project financials
    EXEC dbo.sp_RecalculateProjectFinancials @ProjectID, 0;
END;
GO

-- Procedure to generate a financial forecast
CREATE PROCEDURE dbo.GenerateProjectFinancialForecast
    @ProjectID INT,
    @ForecastDate DATE = NULL -- If NULL, uses EndDate of project
AS
BEGIN
    DECLARE @StartDate DATE;
    DECLARE @EndDate DATE;
    DECLARE @Budget DECIMAL(14, 2);
    DECLARE @ActualCost DECIMAL(14, 2);
    DECLARE @ElapsedDays INT;
    DECLARE @TotalDays INT;
    DECLARE @DailyBurnRate DECIMAL(14, 2);
    DECLARE @ForecastedCost DECIMAL(14, 2);
    DECLARE @RemainingBudget DECIMAL(14, 2);
    DECLARE @CompletionPercentage DECIMAL(5, 2);
    
    -- Get project details
    SELECT 
        @StartDate = StartDate,
        @EndDate = COALESCE(@ForecastDate, EndDate),
        @Budget = Budget,
        @ActualCost = ActualCost
    FROM Projects
    WHERE ProjectID = @ProjectID;
    
    -- Calculate elapsed and total days
    SET @ElapsedDays = DATEDIFF(day, @StartDate, GETDATE());
    SET @TotalDays = DATEDIFF(day, @StartDate, @EndDate);
    
    -- Calculate daily burn rate
    IF @ElapsedDays > 0
        SET @DailyBurnRate = @ActualCost / @ElapsedDays;
    ELSE
        SET @DailyBurnRate = 0;
    
    -- Calculate forecasted cost
    IF @TotalDays > 0
        SET @ForecastedCost = @DailyBurnRate * @TotalDays;
    ELSE
        SET @ForecastedCost = @ActualCost;
    
    -- Calculate remaining budget
    SET @RemainingBudget = @Budget - @ActualCost;
    
    -- Calculate completion percentage
    IF @TotalDays > 0
        SET @CompletionPercentage = CAST(@ElapsedDays AS DECIMAL(5, 2)) / @TotalDays * 100;
    ELSE
        SET @CompletionPercentage = 100;
    
    -- Return forecast
    SELECT 
        @ProjectID AS ProjectID,
        @StartDate AS StartDate,
        @EndDate AS EndDate,
        @Budget AS Budget,
        @ActualCost AS ActualCost,
        @DailyBurnRate AS DailyBurnRate,
        @ForecastedCost AS ForecastedCost,
        @RemainingBudget AS RemainingBudget,
        @CompletionPercentage AS CompletionPercentage,
        CASE 
            WHEN @ForecastedCost > @Budget THEN 'Over Budget'
            WHEN @ForecastedCost = @Budget THEN 'On Budget'
            ELSE 'Under Budget'
        END AS BudgetStatus,
        CASE 
            WHEN @RemainingBudget <= 0 THEN 0
            WHEN @DailyBurnRate > 0 THEN @RemainingBudget / @DailyBurnRate
            ELSE 99999 -- Very large number to indicate infinite days
        END AS EstimatedRemainingDays;
END;
GO
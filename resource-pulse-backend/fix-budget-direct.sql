/* 
 * Direct SQL fix for BudgetItems table
 * Run this directly in the database to fix the Variance column issue
 */

-- First check if the Variance column exists in BudgetItems table
IF EXISTS (
  SELECT 1 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'BudgetItems' AND COLUMN_NAME = 'Variance'
)
BEGIN
  PRINT 'Variance column found - removing it'
  
  -- Create a temporary table to store the existing data
  SELECT 
    BudgetItemID,
    ProjectID,
    Category,
    Description,
    PlannedAmount,
    ActualAmount,
    Notes
  INTO #TempBudgetItems
  FROM BudgetItems
  
  -- Drop the existing BudgetItems table
  DROP TABLE BudgetItems
  
  -- Recreate the BudgetItems table without the Variance column
  CREATE TABLE BudgetItems (
    BudgetItemID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    PlannedAmount DECIMAL(14, 2) NOT NULL,
    ActualAmount DECIMAL(14, 2) NULL,
    Notes NVARCHAR(MAX) NULL,
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
  )
  
  -- Re-insert the data, preserving the original IDs
  SET IDENTITY_INSERT BudgetItems ON
  
  INSERT INTO BudgetItems (
    BudgetItemID,
    ProjectID,
    Category,
    Description,
    PlannedAmount,
    ActualAmount,
    Notes
  )
  SELECT 
    BudgetItemID,
    ProjectID,
    Category,
    Description,
    PlannedAmount,
    ActualAmount,
    Notes
  FROM #TempBudgetItems
  
  SET IDENTITY_INSERT BudgetItems OFF
  
  -- Drop the temporary table
  DROP TABLE #TempBudgetItems
  
  PRINT 'BudgetItems table fixed successfully - Variance column removed'
END
ELSE
BEGIN
  PRINT 'Variance column not found in BudgetItems table - no action needed'
END
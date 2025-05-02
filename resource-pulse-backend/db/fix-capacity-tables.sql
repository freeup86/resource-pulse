-- SQL Schema fix for ScenarioAllocations table

-- Check if IsTemporary column exists in ScenarioAllocations table
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ScenarioAllocations' AND COLUMN_NAME = 'IsTemporary'
)
BEGIN
    -- Add IsTemporary column if it doesn't exist
    ALTER TABLE ScenarioAllocations
    ADD IsTemporary BIT DEFAULT 1;
    
    PRINT 'Added IsTemporary column to ScenarioAllocations table.';
END
ELSE
BEGIN
    PRINT 'IsTemporary column already exists in ScenarioAllocations table.';
END
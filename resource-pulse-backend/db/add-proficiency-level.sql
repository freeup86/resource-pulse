-- Add ProficiencyLevel column to ResourceSkills table if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('ResourceSkills')
    AND name = 'ProficiencyLevel'
)
BEGIN
    ALTER TABLE ResourceSkills
    ADD ProficiencyLevel NVARCHAR(50) NULL;

    PRINT 'ProficiencyLevel column added to ResourceSkills table';
END
ELSE
BEGIN
    PRINT 'ProficiencyLevel column already exists in ResourceSkills table';
END

-- Add test data for proficiency levels if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM ResourceSkills
    WHERE ProficiencyLevel IS NOT NULL
)
BEGIN
    -- Update some existing skills with proficiency levels for testing
    UPDATE TOP(1) ResourceSkills SET ProficiencyLevel = 'Beginner' WHERE ResourceID = 1;
    UPDATE TOP(1) ResourceSkills SET ProficiencyLevel = 'Intermediate' WHERE ResourceID = 2;
    UPDATE TOP(1) ResourceSkills SET ProficiencyLevel = 'Advanced' WHERE ResourceID = 3;
    UPDATE TOP(1) ResourceSkills SET ProficiencyLevel = 'Expert' WHERE ResourceID = 4;

    PRINT 'Added test proficiency levels to existing skills';
END
ELSE
BEGIN
    PRINT 'Test proficiency levels already exist';
END
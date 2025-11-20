-- Add BookingStatus to ProjectAllocations
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Allocations') AND name = 'BookingStatus')
BEGIN
    ALTER TABLE Allocations ADD BookingStatus NVARCHAR(50) DEFAULT 'Hard'; -- Hard, Soft
END;

-- Add CapacityHoursPerWeek to Resources
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Resources') AND name = 'CapacityHoursPerWeek')
BEGIN
    ALTER TABLE Resources ADD CapacityHoursPerWeek INT DEFAULT 40;
END;

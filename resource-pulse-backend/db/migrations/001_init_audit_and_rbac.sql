-- Add SystemRole to Resources if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Resources') AND name = 'SystemRole')
BEGIN
    ALTER TABLE Resources ADD SystemRole NVARCHAR(50) DEFAULT 'User';
END;

-- Create AuditLogs table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLogs' and xtype='U')
BEGIN
    CREATE TABLE AuditLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        EntityName NVARCHAR(100) NOT NULL,
        EntityID NVARCHAR(100) NOT NULL,
        Action NVARCHAR(50) NOT NULL,
        ChangedBy NVARCHAR(100) NULL, -- User ID or Name
        ChangeDate DATETIME2 DEFAULT GETDATE(),
        OldValues NVARCHAR(MAX) NULL,
        NewValues NVARCHAR(MAX) NULL,
        RequestPath NVARCHAR(255) NULL,
        IPAddress NVARCHAR(50) NULL
    );
    
    -- Add index for faster querying
    CREATE INDEX IX_AuditLogs_Entity ON AuditLogs(EntityName, EntityID);
    CREATE INDEX IX_AuditLogs_Date ON AuditLogs(ChangeDate);
END;

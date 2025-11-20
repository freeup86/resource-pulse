-- Create ResourceRequests table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ResourceRequests' and xtype='U')
BEGIN
    CREATE TABLE ResourceRequests (
        RequestID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        RoleID INT NOT NULL,
        Count INT DEFAULT 1,
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Fulfilled, Rejected
        Notes NVARCHAR(MAX) NULL,
        CreatedBy NVARCHAR(100) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE,
        -- FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) -- Assuming Roles table exists, if not we'll skip FK for now or check schema
    );
    
    CREATE INDEX IX_ResourceRequests_Project ON ResourceRequests(ProjectID);
    CREATE INDEX IX_ResourceRequests_Status ON ResourceRequests(Status);
END;

-- Create ProjectMilestones table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProjectMilestones' and xtype='U')
BEGIN
    CREATE TABLE ProjectMilestones (
        MilestoneID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        DueDate DATE NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Completed, Delayed
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_ProjectMilestones_Project ON ProjectMilestones(ProjectID);
END;

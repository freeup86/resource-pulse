-- Create ProjectPhases table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProjectPhases' and xtype='U')
BEGIN
    CREATE TABLE ProjectPhases (
        PhaseID INT IDENTITY(1,1) PRIMARY KEY,
        ProjectID INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        [Order] INT NOT NULL DEFAULT 0,
        StartDate DATE NULL,
        EndDate DATE NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
    );
    CREATE INDEX IX_ProjectPhases_Project ON ProjectPhases(ProjectID);
END;

-- Create ProjectTasks table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProjectTasks' and xtype='U')
BEGIN
    CREATE TABLE ProjectTasks (
        TaskID INT IDENTITY(1,1) PRIMARY KEY,
        PhaseID INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        [Order] INT NOT NULL DEFAULT 0,
        AssignedTo INT NULL, -- ResourceID
        StartDate DATE NULL,
        EndDate DATE NULL,
        Status NVARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Completed, Blocked
        PercentComplete INT DEFAULT 0,
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (PhaseID) REFERENCES ProjectPhases(PhaseID) ON DELETE CASCADE,
        FOREIGN KEY (AssignedTo) REFERENCES Resources(ResourceID)
    );
    CREATE INDEX IX_ProjectTasks_Phase ON ProjectTasks(PhaseID);
    CREATE INDEX IX_ProjectTasks_AssignedTo ON ProjectTasks(AssignedTo);
END;

-- Create TaskDependencies table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TaskDependencies' and xtype='U')
BEGIN
    CREATE TABLE TaskDependencies (
        DependencyID INT IDENTITY(1,1) PRIMARY KEY,
        PredecessorTaskID INT NOT NULL,
        SuccessorTaskID INT NOT NULL,
        Type NVARCHAR(20) DEFAULT 'Finish-to-Start', -- Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish
        LagDays INT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (PredecessorTaskID) REFERENCES ProjectTasks(TaskID), -- No CASCADE to prevent accidental chain deletion issues, or handle carefully
        FOREIGN KEY (SuccessorTaskID) REFERENCES ProjectTasks(TaskID)
    );
    CREATE INDEX IX_TaskDependencies_Predecessor ON TaskDependencies(PredecessorTaskID);
    CREATE INDEX IX_TaskDependencies_Successor ON TaskDependencies(SuccessorTaskID);
END;

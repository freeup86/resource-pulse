-- Create database (run this separately first)
-- CREATE DATABASE ResourcePulse;
-- GO
-- USE ResourcePulse;
-- GO

-- Skills table
CREATE TABLE Skills (
    SkillID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Category NVARCHAR(100) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Projects table
CREATE TABLE Projects (
    ProjectID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Client NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    StartDate DATE NULL,
    EndDate DATE NULL,
    Status NVARCHAR(50) DEFAULT 'Active',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Resources table
CREATE TABLE Resources (
    ResourceID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Role NVARCHAR(100) NOT NULL,
    Email NVARCHAR(200) NULL,
    Phone NVARCHAR(50) NULL,
    HourlyRate DECIMAL(10, 2) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Resource Skills (many-to-many)
CREATE TABLE ResourceSkills (
    ResourceID INT NOT NULL,
    SkillID INT NOT NULL,
    PRIMARY KEY (ResourceID, SkillID),
    FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE CASCADE,
    FOREIGN KEY (SkillID) REFERENCES Skills(SkillID) ON DELETE CASCADE
);

-- Project Required Skills (many-to-many)
CREATE TABLE ProjectSkills (
    ProjectID INT NOT NULL,
    SkillID INT NOT NULL,
    PRIMARY KEY (ProjectID, SkillID),
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE,
    FOREIGN KEY (SkillID) REFERENCES Skills(SkillID) ON DELETE CASCADE
);

-- Allocations table
CREATE TABLE Allocations (
    AllocationID INT IDENTITY(1,1) PRIMARY KEY,
    ResourceID INT NOT NULL,
    ProjectID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Utilization INT NOT NULL CHECK (Utilization BETWEEN 1 AND 100),
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ResourceID) REFERENCES Resources(ResourceID) ON DELETE CASCADE,
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
);
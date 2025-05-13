-- User authentication tables

-- Users table for authentication (Create this first since other tables reference it)
IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
    CREATE TABLE Users (
        UserID INT PRIMARY KEY IDENTITY(1,1),
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        FirstName NVARCHAR(50),
        LastName NVARCHAR(50),
        Role NVARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin', 'user', etc.
        IsActive BIT NOT NULL DEFAULT 1,
        LastLogin DATETIME2,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    -- Create index on email and username for faster lookups
    CREATE INDEX idx_users_email ON Users(Email);
    CREATE INDEX idx_users_username ON Users(Username);

    -- Insert initial admin user (default password: Admin123!)
    -- In a real environment, you would set a stronger password and change it immediately
    -- Password hash is for 'Admin123!'
    INSERT INTO Users (Username, Email, PasswordHash, FirstName, LastName, Role)
    VALUES ('admin', 'admin@resourcepulse.com', '$2b$10$4QJ5o/3fgUiNQI7jcO7CU.JV9GFOUuOlQHJ7MFZpSUy1vFz3XfBme', 'System', 'Administrator', 'admin');
END
GO

-- Refresh tokens table for maintaining sessions
IF OBJECT_ID('RefreshTokens', 'U') IS NULL
BEGIN
    CREATE TABLE RefreshTokens (
        TokenID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL,
        Token NVARCHAR(255) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        RevokedAt DATETIME2,
        IsActive AS (CASE WHEN RevokedAt IS NULL AND ExpiresAt > GETDATE() THEN 1 ELSE 0 END),
        CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
    );
END
GO

-- Password reset tokens table
IF OBJECT_ID('PasswordResetTokens', 'U') IS NULL
BEGIN
    CREATE TABLE PasswordResetTokens (
        TokenID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL,
        Token NVARCHAR(100) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UsedAt DATETIME2,
        CONSTRAINT FK_PasswordResetTokens_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
    );
END
GO

-- User login attempts for rate limiting and security monitoring
IF OBJECT_ID('LoginAttempts', 'U') IS NULL
BEGIN
    CREATE TABLE LoginAttempts (
        AttemptID INT PRIMARY KEY IDENTITY(1,1),
        Username NVARCHAR(50) NOT NULL,
        IP NVARCHAR(45),
        UserAgent NVARCHAR(255),
        Successful BIT NOT NULL DEFAULT 0,
        AttemptedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO
-- SQL Schema for Advanced Notification System

-- Notification Types table (reference table for notification categories)
CREATE TABLE NotificationTypes (
    NotificationTypeID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500) NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- User Notification Settings table
CREATE TABLE UserNotificationSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL, -- Will link to Users table when implemented
    NotificationTypeID INT NOT NULL,
    IsEmailEnabled BIT DEFAULT 1,
    IsInAppEnabled BIT DEFAULT 1,
    Frequency NVARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
    ThresholdDays INT NULL, -- For deadline notifications, how many days before
    ThresholdPercent INT NULL, -- For capacity/utilization notifications, what percentage
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (NotificationTypeID) REFERENCES NotificationTypes(NotificationTypeID)
);

-- Notifications table (stores all notifications generated)
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    NotificationTypeID INT NOT NULL,
    UserID INT NULL, -- NULL means system-wide notification
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    RelatedEntityType NVARCHAR(50) NULL, -- 'resource', 'project', 'allocation', etc.
    RelatedEntityID INT NULL, -- ID of the related entity
    IsRead BIT DEFAULT 0,
    IsEmailSent BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    ExpiresAt DATETIME2 NULL,
    FOREIGN KEY (NotificationTypeID) REFERENCES NotificationTypes(NotificationTypeID)
);

-- Email Notification Queue table
CREATE TABLE EmailQueue (
    EmailQueueID INT IDENTITY(1,1) PRIMARY KEY,
    NotificationID INT NOT NULL,
    Recipient NVARCHAR(255) NOT NULL,
    Subject NVARCHAR(255) NOT NULL,
    HtmlBody NVARCHAR(MAX) NOT NULL,
    TextBody NVARCHAR(MAX) NULL,
    Status NVARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    RetryCount INT DEFAULT 0,
    LastAttemptAt DATETIME2 NULL,
    SentAt DATETIME2 NULL,
    ErrorMessage NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (NotificationID) REFERENCES Notifications(NotificationID)
);

-- System Notification Settings table (global settings)
CREATE TABLE SystemNotificationSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) NOT NULL UNIQUE, -- Renamed from 'Key' which is a reserved keyword
    SettingValue NVARCHAR(500) NOT NULL,
    Description NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Digest Schedule table (for weekly/daily digests)
CREATE TABLE DigestSchedules (
    ScheduleID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Frequency NVARCHAR(50) NOT NULL, -- 'daily', 'weekly'
    DayOfWeek INT NULL, -- 0-6, NULL for daily
    TimeOfDay TIME NOT NULL, -- When to send
    LastRunAt DATETIME2 NULL,
    NextRunAt DATETIME2 NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Insert default notification types
INSERT INTO NotificationTypes (Name, Description)
VALUES 
('allocation_created', 'Notification when a new resource allocation is created'),
('allocation_updated', 'Notification when an existing resource allocation is updated'),
('allocation_deleted', 'Notification when a resource allocation is deleted'),
('deadline_approaching', 'Notification when a project or allocation deadline is approaching'),
('resource_conflict', 'Notification when there is a resource allocation conflict'),
('capacity_threshold', 'Notification when resource capacity exceeds configured threshold'),
('weekly_digest', 'Weekly summary of resource status and allocations');

-- Insert default system notification settings
INSERT INTO SystemNotificationSettings (SettingKey, SettingValue, Description)
VALUES
('notification_email_from', 'notifications@resourcepulse.com', 'Email address from which notifications are sent'),
('notification_enabled', 'true', 'Global switch to enable/disable all notifications'),
('deadline_warning_days', '7', 'Default number of days before deadline to send warnings'),
('capacity_threshold_percent', '90', 'Default capacity threshold percentage for alerts'),
('digest_day', '1', 'Day of week for weekly digest (1 = Monday)'),
('digest_time', '08:00:00', 'Time of day for sending digests');

-- Insert default digest schedule
INSERT INTO DigestSchedules (Name, Frequency, DayOfWeek, TimeOfDay, NextRunAt)
VALUES
('Weekly Resource Status', 'weekly', 1, '08:00:00', DATEADD(DAY, 
    (CASE WHEN DATEPART(WEEKDAY, GETDATE()) <= 1 
          THEN 1 - DATEPART(WEEKDAY, GETDATE()) 
          ELSE 8 - DATEPART(WEEKDAY, GETDATE()) END), 
    CAST(CAST(GETDATE() AS DATE) AS DATETIME) + CAST('08:00:00' AS DATETIME)));
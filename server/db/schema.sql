-- Robotics Education CRM Database Schema

-- Enable FOREIGN KEY constraints
PRAGMA foreign_keys = ON;

-- Users (Authentication and Authorization)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Phone VARCHAR(20),
    Role VARCHAR(20) NOT NULL, -- 'admin', 'instructor', 'parent', 'school_admin'
    LastLogin DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Active BIT DEFAULT 1
);

-- Parents/Guardians
CREATE TABLE Parents (
    ParentID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT UNIQUE FOREIGN KEY REFERENCES Users(UserID),
    Address VARCHAR(255),
    City VARCHAR(50),
    State VARCHAR(2),
    ZipCode VARCHAR(10),
    PreferredContactMethod VARCHAR(20) DEFAULT 'email', -- 'email', 'phone', 'sms'
    EmergencyContactName VARCHAR(100),
    EmergencyContactPhone VARCHAR(20),
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Students
CREATE TABLE Students (
    StudentID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    ParentID INT FOREIGN KEY REFERENCES Parents(ParentID),
    DateOfBirth DATE NOT NULL,
    Age AS DATEDIFF(YEAR, DateOfBirth, GETDATE()),
    Gender VARCHAR(20),
    Grade VARCHAR(20),
    SchoolName VARCHAR(100),
    CurrentSkillLevel VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    SpecialNeeds TEXT,
    Allergies TEXT,
    PhotoReleaseConsent BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Active BIT DEFAULT 1
);

-- Schools (for partnerships)
CREATE TABLE Schools (
    SchoolID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Address VARCHAR(255) NOT NULL,
    City VARCHAR(50) NOT NULL,
    State VARCHAR(2) NOT NULL,
    ZipCode VARCHAR(10) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Website VARCHAR(255),
    District VARCHAR(100),
    Type VARCHAR(50), -- 'public', 'private', 'charter'
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Active BIT DEFAULT 1
);

-- School Contacts
CREATE TABLE SchoolContacts (
    ContactID INT IDENTITY(1,1) PRIMARY KEY,
    SchoolID INT FOREIGN KEY REFERENCES Schools(SchoolID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Position VARCHAR(100) NOT NULL,
    Department VARCHAR(100),
    IsPrimary BIT DEFAULT 0,
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- School Contracts
CREATE TABLE SchoolContracts (
    ContractID INT IDENTITY(1,1) PRIMARY KEY,
    SchoolID INT FOREIGN KEY REFERENCES Schools(SchoolID),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    ContractType VARCHAR(50) NOT NULL, -- 'annual', 'semester', 'custom'
    ContractValue DECIMAL(10, 2) NOT NULL,
    PaymentTerms VARCHAR(50), -- 'monthly', 'quarterly', 'upfront'
    Status VARCHAR(20) NOT NULL, -- 'active', 'pending', 'completed', 'cancelled'
    DocumentPath VARCHAR(255), -- Path to the contract document
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Locations (own facilities or school facilities)
CREATE TABLE Locations (
    LocationID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Type VARCHAR(20) NOT NULL, -- 'own', 'school', 'partner'
    SchoolID INT FOREIGN KEY REFERENCES Schools(SchoolID), -- NULL if own location
    Address VARCHAR(255) NOT NULL,
    City VARCHAR(50) NOT NULL,
    State VARCHAR(2) NOT NULL,
    ZipCode VARCHAR(10) NOT NULL,
    RoomNumber VARCHAR(20),
    Capacity INT,
    HasWifi BIT DEFAULT 0,
    HasProjector BIT DEFAULT 0,
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Active BIT DEFAULT 1
);

-- Instructors
CREATE TABLE Instructors (
    InstructorID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT UNIQUE FOREIGN KEY REFERENCES Users(UserID),
    HireDate DATE NOT NULL,
    EmploymentType VARCHAR(20) NOT NULL, -- 'full-time', 'part-time', 'contractor'
    Education TEXT,
    Certifications TEXT,
    BackgroundCheckDate DATE,
    EmergencyContactName VARCHAR(100),
    EmergencyContactPhone VARCHAR(20),
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Active BIT DEFAULT 1
);

-- Instructor Skills
CREATE TABLE InstructorSkills (
    InstructorSkillID INT IDENTITY(1,1) PRIMARY KEY,
    InstructorID INT FOREIGN KEY REFERENCES Instructors(InstructorID),
    SkillName VARCHAR(100) NOT NULL,
    ProficiencyLevel VARCHAR(20) NOT NULL, -- 'basic', 'intermediate', 'advanced', 'expert'
    YearsExperience INT,
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Equipment Categories
CREATE TABLE EquipmentCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Equipment
CREATE TABLE Equipment (
    EquipmentID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryID INT FOREIGN KEY REFERENCES EquipmentCategories(CategoryID),
    Name VARCHAR(100) NOT NULL,
    SerialNumber VARCHAR(100),
    AcquisitionDate DATE,
    AcquisitionCost DECIMAL(10, 2),
    Status VARCHAR(20) NOT NULL, -- 'available', 'in-use', 'maintenance', 'retired'
    CurrentLocationID INT FOREIGN KEY REFERENCES Locations(LocationID),
    LastMaintenanceDate DATE,
    NextMaintenanceDate DATE,
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Equipment Checkout History
CREATE TABLE EquipmentCheckouts (
    CheckoutID INT IDENTITY(1,1) PRIMARY KEY,
    EquipmentID INT FOREIGN KEY REFERENCES Equipment(EquipmentID),
    CheckedOutTo VARCHAR(100) NOT NULL, -- Instructor name, class name, etc.
    CheckedOutBy INT FOREIGN KEY REFERENCES Users(UserID),
    CheckoutDate DATETIME NOT NULL,
    ExpectedReturnDate DATETIME,
    ActualReturnDate DATETIME,
    ConditionOnCheckout TEXT,
    ConditionOnReturn TEXT,
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Course Types
CREATE TABLE CourseTypes (
    CourseTypeID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL, -- 'Regular Class', 'Workshop', 'Camp', 'Competition Team'
    Description TEXT,
    DefaultDuration INT, -- In minutes
    DefaultCapacity INT,
    DefaultPrice DECIMAL(10, 2),
    AgeRangeMin INT,
    AgeRangeMax INT,
    SkillLevel VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'all-levels'
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Courses (curriculum templates)
CREATE TABLE Courses (
    CourseID INT IDENTITY(1,1) PRIMARY KEY,
    CourseTypeID INT FOREIGN KEY REFERENCES CourseTypes(CourseTypeID),
    Title VARCHAR(100) NOT NULL,
    Description TEXT,
    DurationWeeks INT,
    SessionsPerWeek INT,
    HoursPerSession DECIMAL(4, 2),
    AgeRangeMin INT,
    AgeRangeMax INT,
    SkillLevel VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'all-levels'
    LearningObjectives TEXT,
    Prerequisites TEXT,
    DefaultPrice DECIMAL(10, 2),
    RequiredEquipment TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Active BIT DEFAULT 1
);

-- Course Sessions (specific offerings)
CREATE TABLE CourseSessions (
    SessionID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT FOREIGN KEY REFERENCES Courses(CourseID),
    LocationID INT FOREIGN KEY REFERENCES Locations(LocationID),
    SchoolID INT FOREIGN KEY REFERENCES Schools(SchoolID), -- NULL if not school-specific
    InstructorID INT FOREIGN KEY REFERENCES Instructors(InstructorID),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    DaysOfWeek VARCHAR(20) NOT NULL, -- e.g., 'MON,WED,FRI'
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    MaxCapacity INT NOT NULL,
    MinCapacity INT,
    Status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Equipment Required for Course Sessions
CREATE TABLE SessionEquipment (
    SessionEquipmentID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT FOREIGN KEY REFERENCES CourseSessions(SessionID),
    EquipmentCategoryID INT FOREIGN KEY REFERENCES EquipmentCategories(CategoryID),
    QuantityRequired INT NOT NULL,
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Enrollments
CREATE TABLE Enrollments (
    EnrollmentID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT FOREIGN KEY REFERENCES Students(StudentID),
    SessionID INT FOREIGN KEY REFERENCES CourseSessions(SessionID),
    EnrollmentDate DATETIME NOT NULL,
    EnrollmentStatus VARCHAR(20) NOT NULL, -- 'enrolled', 'waitlisted', 'cancelled', 'completed'
    PaymentStatus VARCHAR(20) NOT NULL, -- 'paid', 'partial', 'pending', 'refunded'
    AmountPaid DECIMAL(10, 2) DEFAULT 0,
    DiscountApplied DECIMAL(10, 2) DEFAULT 0,
    DiscountReason VARCHAR(100),
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Attendance
CREATE TABLE Attendance (
    AttendanceID INT IDENTITY(1,1) PRIMARY KEY,
    EnrollmentID INT FOREIGN KEY REFERENCES Enrollments(EnrollmentID),
    SessionDate DATE NOT NULL,
    Status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late', 'excused'
    Notes TEXT,
    RecordedBy INT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Student Progress
CREATE TABLE StudentProgress (
    ProgressID INT IDENTITY(1,1) PRIMARY KEY,
    EnrollmentID INT FOREIGN KEY REFERENCES Enrollments(EnrollmentID),
    AssessmentDate DATE NOT NULL,
    SkillsAcquired TEXT,
    ChallengesEncountered TEXT,
    ProjectsCompleted TEXT,
    OverallPerformance VARCHAR(20), -- 'excellent', 'good', 'satisfactory', 'needs-improvement'
    InstructorFeedback TEXT,
    NextStepsRecommendation TEXT,
    ParentNotified BIT DEFAULT 0,
    RecordedBy INT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Competitions
CREATE TABLE Competitions (
    CompetitionID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Location VARCHAR(255),
    RegistrationDeadline DATE,
    RegistrationFee DECIMAL(10, 2),
    AgeRangeMin INT,
    AgeRangeMax INT,
    WebsiteURL VARCHAR(255),
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Teams (for competitions)
CREATE TABLE Teams (
    TeamID INT IDENTITY(1,1) PRIMARY KEY,
    TeamName VARCHAR(100) NOT NULL,
    CompetitionID INT FOREIGN KEY REFERENCES Competitions(CompetitionID),
    CoachID INT FOREIGN KEY REFERENCES Instructors(InstructorID),
    Division VARCHAR(50), -- 'elementary', 'middle', 'high'
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Team Members
CREATE TABLE TeamMembers (
    TeamMemberID INT IDENTITY(1,1) PRIMARY KEY,
    TeamID INT FOREIGN KEY REFERENCES Teams(TeamID),
    StudentID INT FOREIGN KEY REFERENCES Students(StudentID),
    Role VARCHAR(50), -- 'captain', 'programmer', 'builder', 'designer'
    JoinDate DATE DEFAULT GETDATE(),
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Payments
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    EnrollmentID INT FOREIGN KEY REFERENCES Enrollments(EnrollmentID),
    ContractID INT FOREIGN KEY REFERENCES SchoolContracts(ContractID), -- for school payments
    Amount DECIMAL(10, 2) NOT NULL,
    PaymentDate DATETIME NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL, -- 'credit_card', 'bank_transfer', 'check', 'cash'
    TransactionReference VARCHAR(100),
    Status VARCHAR(20) NOT NULL, -- 'processed', 'pending', 'failed', 'refunded'
    Notes TEXT,
    ProcessedBy INT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Invoices (mainly for schools)
CREATE TABLE Invoices (
    InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
    SchoolID INT FOREIGN KEY REFERENCES Schools(SchoolID),
    ContractID INT FOREIGN KEY REFERENCES SchoolContracts(ContractID),
    InvoiceNumber VARCHAR(50) NOT NULL,
    IssueDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Status VARCHAR(20) NOT NULL, -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Invoice Items
CREATE TABLE InvoiceItems (
    InvoiceItemID INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID INT FOREIGN KEY REFERENCES Invoices(InvoiceID),
    Description VARCHAR(255) NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    TotalPrice DECIMAL(10, 2) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Communications
CREATE TABLE Communications (
    CommunicationID INT IDENTITY(1,1) PRIMARY KEY,
    SenderID INT FOREIGN KEY REFERENCES Users(UserID),
    RecipientType VARCHAR(20) NOT NULL, -- 'student', 'parent', 'school', 'instructor', 'all'
    RecipientID INT, -- ID of the specific recipient (if applicable)
    CommunicationType VARCHAR(20) NOT NULL, -- 'email', 'sms', 'notification', 'letter'
    Subject VARCHAR(255),
    Content TEXT NOT NULL,
    SentAt DATETIME,
    Status VARCHAR(20) NOT NULL, -- 'draft', 'sent', 'failed', 'scheduled'
    ScheduledFor DATETIME, -- For scheduled communications
    TemplateUsed VARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Notification Settings
CREATE TABLE NotificationSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    EventType VARCHAR(50) NOT NULL, -- 'enrollment', 'payment', 'attendance', 'progress'
    EmailEnabled BIT DEFAULT 1,
    SMSEnabled BIT DEFAULT 0,
    PushEnabled BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Documents
CREATE TABLE Documents (
    DocumentID INT IDENTITY(1,1) PRIMARY KEY,
    DocumentType VARCHAR(50) NOT NULL, -- 'waiver', 'contract', 'student_work', 'certificate'
    Title VARCHAR(255) NOT NULL,
    RelatedEntityType VARCHAR(50) NOT NULL, -- 'student', 'parent', 'school', 'enrollment'
    RelatedEntityID INT NOT NULL, -- ID of the related entity
    FilePath VARCHAR(255) NOT NULL,
    FileType VARCHAR(50) NOT NULL,
    FileSize INT NOT NULL, -- in bytes
    UploadedBy INT FOREIGN KEY REFERENCES Users(UserID),
    UploadedAt DATETIME DEFAULT GETDATE(),
    ExpiryDate DATE, -- For time-sensitive documents
    IsActive BIT DEFAULT 1,
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Waivers and Consent Forms
CREATE TABLE Waivers (
    WaiverID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT FOREIGN KEY REFERENCES Students(StudentID),
    WaiverType VARCHAR(50) NOT NULL, -- 'liability', 'media_release', 'field_trip'
    SignedBy INT FOREIGN KEY REFERENCES Parents(ParentID),
    SignedAt DATETIME NOT NULL,
    ExpiryDate DATE,
    DocumentID INT FOREIGN KEY REFERENCES Documents(DocumentID),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- System Settings
CREATE TABLE SystemSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey VARCHAR(100) NOT NULL UNIQUE,
    SettingValue TEXT,
    SettingDescription TEXT,
    LastUpdatedBy INT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Create indexes for performance
CREATE INDEX idx_students_parent ON Students(ParentID);
CREATE INDEX idx_enrollments_student ON Enrollments(StudentID);
CREATE INDEX idx_enrollments_session ON Enrollments(SessionID);
CREATE INDEX idx_attendance_enrollment ON Attendance(EnrollmentID);
CREATE INDEX idx_progress_enrollment ON StudentProgress(EnrollmentID);
CREATE INDEX idx_course_sessions_course ON CourseSessions(CourseID);
CREATE INDEX idx_course_sessions_location ON CourseSessions(LocationID);
CREATE INDEX idx_course_sessions_instructor ON CourseSessions(InstructorID);
CREATE INDEX idx_school_contacts_school ON SchoolContacts(SchoolID);
CREATE INDEX idx_equipment_category ON Equipment(CategoryID);
CREATE INDEX idx_equipment_location ON Equipment(CurrentLocationID);
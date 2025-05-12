// Student controller
const { executeQuery, beginTransaction, executeTransactionQuery, commitTransaction, rollbackTransaction } = require('../utils/db');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get all students
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllStudents = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { search, active, parentId, skillLevel, ageMin, ageMax, page = 1, limit = 10 } = req.query;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build the SQL query with filters
    let query = `
      SELECT s.StudentID, s.FirstName, s.LastName, s.DateOfBirth, s.Age, 
             s.Gender, s.Grade, s.SchoolName, s.CurrentSkillLevel, s.Active,
             p.ParentID, u.FirstName AS ParentFirstName, u.LastName AS ParentLastName
      FROM Students s
      LEFT JOIN Parents p ON s.ParentID = p.ParentID
      LEFT JOIN Users u ON p.UserID = u.UserID
      WHERE 1=1
    `;
    
    const params = {};
    
    // Add filters if provided
    if (search) {
      query += ` AND (s.FirstName LIKE @search OR s.LastName LIKE @search OR s.SchoolName LIKE @search)`;
      params.search = `%${search}%`;
    }
    
    if (active !== undefined) {
      query += ` AND s.Active = @active`;
      params.active = active === 'true' || active === '1' ? 1 : 0;
    }
    
    if (parentId) {
      query += ` AND s.ParentID = @parentId`;
      params.parentId = parentId;
    }
    
    if (skillLevel) {
      query += ` AND s.CurrentSkillLevel = @skillLevel`;
      params.skillLevel = skillLevel;
    }
    
    if (ageMin) {
      query += ` AND s.Age >= @ageMin`;
      params.ageMin = parseInt(ageMin);
    }
    
    if (ageMax) {
      query += ` AND s.Age <= @ageMax`;
      params.ageMax = parseInt(ageMax);
    }
    
    // Add count query for pagination
    const countQuery = `SELECT COUNT(*) AS totalCount FROM (${query}) AS countTable`;
    
    // Add pagination
    query += ` ORDER BY s.LastName, s.FirstName OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.offset = parseInt(offset);
    params.limit = parseInt(limit);
    
    // Execute queries
    const studentsResult = await executeQuery(query, params);
    const countResult = await executeQuery(countQuery, params);
    
    const totalCount = countResult.recordset[0].totalCount;
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      success: true,
      data: studentsResult.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a student by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get student details
    const studentResult = await executeQuery(
      `SELECT s.StudentID, s.FirstName, s.LastName, s.DateOfBirth, s.Age, 
              s.Gender, s.Grade, s.SchoolName, s.CurrentSkillLevel, 
              s.SpecialNeeds, s.Allergies, s.PhotoReleaseConsent, s.Active,
              s.CreatedAt, s.UpdatedAt,
              p.ParentID, u.FirstName AS ParentFirstName, u.LastName AS ParentLastName,
              u.Email AS ParentEmail, u.Phone AS ParentPhone
       FROM Students s
       LEFT JOIN Parents p ON s.ParentID = p.ParentID
       LEFT JOIN Users u ON p.UserID = u.UserID
       WHERE s.StudentID = @id`,
      { id }
    );
    
    if (studentResult.recordset.length === 0) {
      throw new ApiError(404, 'Student not found');
    }
    
    const student = studentResult.recordset[0];
    
    // Get enrollment history
    const enrollmentsResult = await executeQuery(
      `SELECT e.EnrollmentID, e.EnrollmentDate, e.EnrollmentStatus, e.PaymentStatus,
              cs.SessionID, c.Title AS CourseTitle, ct.Name AS CourseType,
              cs.StartDate, cs.EndDate, cs.DaysOfWeek, cs.StartTime, cs.EndTime,
              i.FirstName + ' ' + i.LastName AS InstructorName,
              l.Name AS LocationName
       FROM Enrollments e
       JOIN CourseSessions cs ON e.SessionID = cs.SessionID
       JOIN Courses c ON cs.CourseID = c.CourseID
       JOIN CourseTypes ct ON c.CourseTypeID = ct.CourseTypeID
       JOIN Instructors i ON cs.InstructorID = i.InstructorID
       JOIN Locations l ON cs.LocationID = l.LocationID
       WHERE e.StudentID = @id
       ORDER BY cs.StartDate DESC`,
      { id }
    );
    
    // Get attendance records
    const attendanceResult = await executeQuery(
      `SELECT a.AttendanceID, a.SessionDate, a.Status, a.Notes,
              cs.SessionID, c.Title AS CourseTitle
       FROM Attendance a
       JOIN Enrollments e ON a.EnrollmentID = e.EnrollmentID
       JOIN CourseSessions cs ON e.SessionID = cs.SessionID
       JOIN Courses c ON cs.CourseID = c.CourseID
       WHERE e.StudentID = @id
       ORDER BY a.SessionDate DESC`,
      { id }
    );
    
    // Get progress reports
    const progressResult = await executeQuery(
      `SELECT p.ProgressID, p.AssessmentDate, p.SkillsAcquired, p.ChallengesEncountered, 
              p.ProjectsCompleted, p.OverallPerformance, p.InstructorFeedback,
              p.NextStepsRecommendation, p.ParentNotified,
              cs.SessionID, c.Title AS CourseTitle
       FROM StudentProgress p
       JOIN Enrollments e ON p.EnrollmentID = e.EnrollmentID
       JOIN CourseSessions cs ON e.SessionID = cs.SessionID
       JOIN Courses c ON cs.CourseID = c.CourseID
       WHERE e.StudentID = @id
       ORDER BY p.AssessmentDate DESC`,
      { id }
    );
    
    // Get competition participation
    const competitionsResult = await executeQuery(
      `SELECT tm.TeamMemberID, tm.Role, t.TeamName, t.Division,
              c.CompetitionID, c.Name AS CompetitionName, c.StartDate, c.EndDate,
              i.FirstName + ' ' + i.LastName AS CoachName
       FROM TeamMembers tm
       JOIN Teams t ON tm.TeamID = t.TeamID
       JOIN Competitions c ON t.CompetitionID = c.CompetitionID
       JOIN Instructors i ON t.CoachID = i.InstructorID
       WHERE tm.StudentID = @id
       ORDER BY c.StartDate DESC`,
      { id }
    );
    
    res.json({
      success: true,
      data: {
        ...student,
        enrollments: enrollmentsResult.recordset,
        attendance: attendanceResult.recordset,
        progress: progressResult.recordset,
        competitions: competitionsResult.recordset
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createStudent = async (req, res, next) => {
  let transaction;
  
  try {
    const {
      firstName,
      lastName,
      parentId,
      dateOfBirth,
      gender,
      grade,
      schoolName,
      currentSkillLevel,
      specialNeeds,
      allergies,
      photoReleaseConsent
    } = req.body;
    
    // Start transaction
    transaction = await beginTransaction();
    
    // Insert student
    const studentResult = await executeTransactionQuery(
      transaction,
      `INSERT INTO Students (
         FirstName, LastName, ParentID, DateOfBirth, Gender, 
         Grade, SchoolName, CurrentSkillLevel, SpecialNeeds, 
         Allergies, PhotoReleaseConsent, Active
       )
       VALUES (
         @firstName, @lastName, @parentId, @dateOfBirth, @gender,
         @grade, @schoolName, @currentSkillLevel, @specialNeeds,
         @allergies, @photoReleaseConsent, 1
       );
       SELECT SCOPE_IDENTITY() AS StudentID;`,
      {
        firstName,
        lastName,
        parentId,
        dateOfBirth,
        gender: gender || null,
        grade: grade || null,
        schoolName: schoolName || null,
        currentSkillLevel: currentSkillLevel || 'beginner',
        specialNeeds: specialNeeds || null,
        allergies: allergies || null,
        photoReleaseConsent: photoReleaseConsent ? 1 : 0
      }
    );
    
    const studentId = studentResult.recordset[0].StudentID;
    
    // Commit transaction
    await commitTransaction(transaction);
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { studentId }
    });
  } catch (err) {
    // Rollback transaction on error
    if (transaction) {
      await rollbackTransaction(transaction);
    }
    next(err);
  }
};

/**
 * Update a student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      parentId,
      dateOfBirth,
      gender,
      grade,
      schoolName,
      currentSkillLevel,
      specialNeeds,
      allergies,
      photoReleaseConsent,
      active
    } = req.body;
    
    // Check if student exists
    const checkResult = await executeQuery(
      'SELECT StudentID FROM Students WHERE StudentID = @id',
      { id }
    );
    
    if (checkResult.recordset.length === 0) {
      throw new ApiError(404, 'Student not found');
    }
    
    // Update student
    await executeQuery(
      `UPDATE Students
       SET FirstName = @firstName,
           LastName = @lastName,
           ParentID = @parentId,
           DateOfBirth = @dateOfBirth,
           Gender = @gender,
           Grade = @grade,
           SchoolName = @schoolName,
           CurrentSkillLevel = @currentSkillLevel,
           SpecialNeeds = @specialNeeds,
           Allergies = @allergies,
           PhotoReleaseConsent = @photoReleaseConsent,
           Active = @active,
           UpdatedAt = GETDATE()
       WHERE StudentID = @id`,
      {
        id,
        firstName,
        lastName,
        parentId,
        dateOfBirth,
        gender: gender || null,
        grade: grade || null,
        schoolName: schoolName || null,
        currentSkillLevel: currentSkillLevel || 'beginner',
        specialNeeds: specialNeeds || null,
        allergies: allergies || null,
        photoReleaseConsent: photoReleaseConsent ? 1 : 0,
        active: active !== undefined ? (active ? 1 : 0) : 1
      }
    );
    
    res.json({
      success: true,
      message: 'Student updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a student (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if student exists
    const checkResult = await executeQuery(
      'SELECT StudentID FROM Students WHERE StudentID = @id',
      { id }
    );
    
    if (checkResult.recordset.length === 0) {
      throw new ApiError(404, 'Student not found');
    }
    
    // Soft delete student
    await executeQuery(
      `UPDATE Students
       SET Active = 0,
           UpdatedAt = GETDATE()
       WHERE StudentID = @id`,
      { id }
    );
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
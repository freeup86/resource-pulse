import axios from 'axios';

const API_URL = '/api/sessions';

/**
 * Fetches all sessions with optional filtering
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise} Promise object with session data
 */
export const getSessions = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

/**
 * Fetches a specific session by ID
 * @param {string} id - Session ID
 * @returns {Promise} Promise object with session data
 */
export const getSessionById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching session ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new session
 * @param {Object} sessionData - Session data object
 * @returns {Promise} Promise object with created session data
 */
export const createSession = async (sessionData) => {
  try {
    const response = await axios.post(API_URL, sessionData);
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Updates an existing session
 * @param {string} id - Session ID
 * @param {Object} sessionData - Updated session data
 * @returns {Promise} Promise object with updated session data
 */
export const updateSession = async (id, sessionData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, sessionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating session ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a session
 * @param {string} id - Session ID
 * @returns {Promise} Promise object with deletion status
 */
export const deleteSession = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting session ${id}:`, error);
    throw error;
  }
};

/**
 * Gets all enrolled students for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise} Promise object with enrolled students
 */
export const getSessionEnrollments = async (sessionId) => {
  try {
    const response = await axios.get(`${API_URL}/${sessionId}/enrollments`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching enrollments for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Adds a student to a session
 * @param {string} sessionId - Session ID
 * @param {string} studentId - Student ID
 * @returns {Promise} Promise object with enrollment status
 */
export const enrollStudentInSession = async (sessionId, studentId) => {
  try {
    const response = await axios.post(`${API_URL}/${sessionId}/enroll`, { studentId });
    return response.data;
  } catch (error) {
    console.error(`Error enrolling student ${studentId} in session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Takes attendance for a session
 * @param {string} sessionId - Session ID
 * @param {Array} attendanceData - Array of student attendance records
 * @returns {Promise} Promise object with attendance status
 */
export const recordSessionAttendance = async (sessionId, attendanceData) => {
  try {
    const response = await axios.post(`${API_URL}/${sessionId}/attendance`, { attendanceData });
    return response.data;
  } catch (error) {
    console.error(`Error recording attendance for session ${sessionId}:`, error);
    throw error;
  }
};

// Mock data for sessions
export const mockSessions = [
  {
    id: '1',
    courseId: '1', // Corresponds to "Robotics for Beginners"
    courseTitle: 'Robotics for Beginners',
    startDate: '2023-10-05',
    endDate: '2023-11-30',
    schedule: 'Thursdays, 4:00 PM - 5:30 PM',
    location: 'Innovation Lab - Room 102',
    instructor: {
      id: '1',
      name: 'Dr. Robert Chen',
      email: 'robert.chen@example.com',
      phone: '(555) 123-4567',
      specialization: 'Elementary robotics education',
      bio: 'Dr. Chen has 10 years of experience teaching STEM to young learners.'
    },
    enrollmentCount: 12,
    maxCapacity: 15,
    status: 'Active',
    materials: 'All materials provided in class',
    notes: 'Parents welcome to observe the final class showcase',
    createdAt: '2023-09-10'
  },
  {
    id: '2',
    courseId: '2', // Corresponds to "Robotics 101"
    courseTitle: 'Robotics 101',
    startDate: '2023-09-12',
    endDate: '2023-11-21',
    schedule: 'Tuesdays and Thursdays, 4:30 PM - 6:00 PM',
    location: 'Tech Center - Main Lab',
    instructor: {
      id: '2',
      name: 'Michelle Rodriguez',
      email: 'michelle.r@example.com',
      phone: '(555) 987-6543',
      specialization: 'Middle school robotics and competitions',
      bio: 'Coach Rodriguez leads our competition teams and has mentored regional champions.'
    },
    enrollmentCount: 10,
    maxCapacity: 12,
    status: 'Active',
    materials: 'Students must bring their laptop; robotics kits provided',
    notes: 'Mid-term project presentation on October 17th',
    createdAt: '2023-08-20'
  },
  {
    id: '3',
    courseId: '3', // Corresponds to "Advanced Programming for Robotics"
    courseTitle: 'Advanced Programming for Robotics',
    startDate: '2023-09-06',
    endDate: '2023-12-06',
    schedule: 'Wednesdays, 5:00 PM - 7:30 PM',
    location: 'Innovation Hub - Coding Lab',
    instructor: {
      id: '3',
      name: 'Alexander Wei, PhD',
      email: 'alex.wei@example.com',
      phone: '(555) 456-7890',
      specialization: 'Computer science and AI applications',
      bio: 'Dr. Wei is a former robotics engineer who now specializes in teaching programming for advanced applications.'
    },
    enrollmentCount: 8,
    maxCapacity: 10,
    status: 'Active',
    materials: 'Raspberry Pi kit provided, $50 materials fee required',
    notes: 'Some homework will be assigned between sessions',
    createdAt: '2023-08-15'
  },
  {
    id: '4',
    courseId: '4', // Corresponds to "Competition Prep Workshop"
    courseTitle: 'Competition Prep Workshop',
    startDate: '2023-11-04',
    endDate: '2023-12-09',
    schedule: 'Saturdays, 10:00 AM - 2:00 PM',
    location: 'Competition Arena - North Campus',
    instructor: {
      id: '2',
      name: 'Michelle Rodriguez',
      email: 'michelle.r@example.com',
      phone: '(555) 987-6543',
      specialization: 'Middle school robotics and competitions',
      bio: 'Coach Rodriguez leads our competition teams and has mentored regional champions.'
    },
    enrollmentCount: 15,
    maxCapacity: 20,
    status: 'Upcoming',
    materials: 'Students should bring their competition robots and laptops',
    notes: 'Mock competition on December 2nd, parents invited',
    createdAt: '2023-09-01'
  },
  {
    id: '5',
    courseId: '5', // Corresponds to "Robotics Mini-Camp for Young Innovators"
    courseTitle: 'Robotics Mini-Camp for Young Innovators',
    startDate: '2023-10-07',
    endDate: '2023-11-04',
    schedule: 'Saturdays, 9:00 AM - 10:30 AM',
    location: 'Junior Lab - East Wing',
    instructor: {
      id: '4',
      name: 'Emily Jackson',
      email: 'emily.j@example.com',
      phone: '(555) 234-5678',
      specialization: 'Early childhood STEM education',
      bio: 'Ms. Jackson specializes in making technology accessible and fun for our youngest students.'
    },
    enrollmentCount: 8,
    maxCapacity: 10,
    status: 'Active',
    materials: 'All materials provided',
    notes: 'Parent participation required for students under 6',
    createdAt: '2023-09-15'
  },
  {
    id: '6',
    courseId: '1', // Corresponds to "Robotics for Beginners" - future session
    courseTitle: 'Robotics for Beginners',
    startDate: '2024-01-11',
    endDate: '2024-03-07',
    schedule: 'Thursdays, 4:00 PM - 5:30 PM',
    location: 'Innovation Lab - Room 102',
    instructor: {
      id: '1',
      name: 'Dr. Robert Chen',
      email: 'robert.chen@example.com',
      phone: '(555) 123-4567',
      specialization: 'Elementary robotics education',
      bio: 'Dr. Chen has 10 years of experience teaching STEM to young learners.'
    },
    enrollmentCount: 5,
    maxCapacity: 15,
    status: 'Registration Open',
    materials: 'All materials provided in class',
    notes: 'Winter session with special snowbot building activity',
    createdAt: '2023-10-01'
  },
  {
    id: '7',
    courseId: '7', // Corresponds to "Girls in Robotics"
    courseTitle: 'Girls in Robotics',
    startDate: '2023-09-11',
    endDate: '2023-11-13',
    schedule: 'Mondays, 4:00 PM - 6:00 PM',
    location: 'Tech Center - Studio B',
    instructor: {
      id: '5',
      name: 'Dr. Aisha Johnson',
      email: 'aisha.j@example.com',
      phone: '(555) 876-5432',
      specialization: 'Computer engineering and STEM outreach',
      bio: 'Dr. Johnson is passionate about increasing diversity in robotics and engineering fields.'
    },
    enrollmentCount: 12,
    maxCapacity: 12,
    status: 'Full',
    materials: 'Materials provided, students bring notebooks',
    notes: 'Community showcase planned for final session',
    createdAt: '2023-08-25'
  },
  {
    id: '8',
    courseId: '6', // Corresponds to "Robotics and AI Exploration"
    courseTitle: 'Robotics and AI Exploration',
    startDate: '2023-09-13',
    endDate: '2023-12-13',
    schedule: 'Wednesdays, 6:00 PM - 8:30 PM',
    location: 'AI Lab - Research Center',
    instructor: {
      id: '6',
      name: 'Professor James Thompson',
      email: 'j.thompson@example.com',
      phone: '(555) 789-0123',
      specialization: 'Artificial Intelligence and Robotics',
      bio: 'Prof. Thompson conducts research in AI applications for autonomous systems.'
    },
    enrollmentCount: 6,
    maxCapacity: 8,
    status: 'Active',
    materials: 'NVIDIA Jetson Kit included with $75 materials fee',
    notes: 'Advanced course, Python programming experience required',
    createdAt: '2023-08-10'
  },
  {
    id: '9',
    courseId: '8', // Corresponds to "Underwater Robotics Challenge"
    courseTitle: 'Underwater Robotics Challenge',
    startDate: '2024-01-09',
    endDate: '2024-03-26',
    schedule: 'Tuesdays, 5:00 PM - 7:30 PM',
    location: 'Aquatics Center and Tech Lab',
    instructor: {
      id: '7',
      name: 'Dr. Maria Gonzalez',
      email: 'maria.g@example.com',
      phone: '(555) 345-6789',
      specialization: 'Marine robotics and environmental monitoring',
      bio: 'Dr. Gonzalez has worked on underwater robotics projects with oceanographic institutes.'
    },
    enrollmentCount: 3,
    maxCapacity: 10,
    status: 'Registration Open',
    materials: '$100 materials fee required for ROV components',
    notes: 'Pool testing sessions will be scheduled throughout the course',
    createdAt: '2023-10-15'
  },
  {
    id: '10',
    courseId: '2', // Corresponds to "Robotics 101" - completed session
    courseTitle: 'Robotics 101',
    startDate: '2023-06-05',
    endDate: '2023-08-14',
    schedule: 'Mondays and Wednesdays, 1:00 PM - 2:30 PM',
    location: 'Tech Center - Main Lab',
    instructor: {
      id: '2',
      name: 'Michelle Rodriguez',
      email: 'michelle.r@example.com',
      phone: '(555) 987-6543',
      specialization: 'Middle school robotics and competitions',
      bio: 'Coach Rodriguez leads our competition teams and has mentored regional champions.'
    },
    enrollmentCount: 12,
    maxCapacity: 12,
    status: 'Completed',
    materials: 'All materials were provided',
    notes: 'Summer session completed with successful showcase event',
    createdAt: '2023-05-01'
  }
];
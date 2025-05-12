import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const enrollmentService = {
  // Get all enrollments with optional filters
  getEnrollments: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/enrollments`, { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a single enrollment by ID
  getEnrollmentById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/enrollments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new enrollment
  createEnrollment: async (enrollmentData) => {
    try {
      const response = await axios.post(`${API_URL}/enrollments`, enrollmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update an existing enrollment
  updateEnrollment: async (id, enrollmentData) => {
    try {
      const response = await axios.put(`${API_URL}/enrollments/${id}`, enrollmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete an enrollment
  deleteEnrollment: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/enrollments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update enrollment status
  updateStatus: async (id, status) => {
    try {
      const response = await axios.patch(`${API_URL}/enrollments/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Record attendance for a student
  recordAttendance: async (enrollmentId, attendanceData) => {
    try {
      const response = await axios.post(`${API_URL}/enrollments/${enrollmentId}/attendance`, attendanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update student progress
  updateProgress: async (enrollmentId, progressData) => {
    try {
      const response = await axios.post(`${API_URL}/enrollments/${enrollmentId}/progress`, progressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Record payment for enrollment
  recordPayment: async (enrollmentId, paymentData) => {
    try {
      const response = await axios.post(`${API_URL}/enrollments/${enrollmentId}/payments`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get enrollment history for a student
  getStudentEnrollmentHistory: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/students/${studentId}/enrollments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get enrollments for a specific course
  getCourseEnrollments: async (courseId) => {
    try {
      const response = await axios.get(`${API_URL}/courses/${courseId}/enrollments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default enrollmentService;
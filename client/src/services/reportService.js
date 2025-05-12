import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const reportService = {
  // Get dashboard summary metrics
  getDashboardSummary: async (dateRange = {}) => {
    try {
      const response = await axios.get(`${API_URL}/reports/dashboard-summary`, { params: dateRange });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get attendance statistics
  getAttendanceStats: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/reports/attendance`, { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get financial metrics and summaries
  getFinancialReport: async (dateRange = {}) => {
    try {
      const response = await axios.get(`${API_URL}/reports/financial`, { params: dateRange });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get enrollment trends and statistics
  getEnrollmentStats: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/reports/enrollment-stats`, { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get school partnership statistics
  getPartnershipStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/reports/partnerships`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get instructor performance metrics
  getInstructorPerformance: async (instructorId = null, dateRange = {}) => {
    try {
      const params = { ...dateRange };
      if (instructorId) params.instructorId = instructorId;
      
      const response = await axios.get(`${API_URL}/reports/instructor-performance`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get enrollment projections
  getEnrollmentProjections: async (timeframe = 'month') => {
    try {
      const response = await axios.get(`${API_URL}/reports/enrollment-projections`, { params: { timeframe } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get course popularity metrics
  getCoursePopularity: async (dateRange = {}) => {
    try {
      const response = await axios.get(`${API_URL}/reports/course-popularity`, { params: dateRange });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get student progress metrics
  getStudentProgressReport: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/reports/student-progress`, { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export reports to different formats
  exportReport: async (reportType, format, filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/reports/export/${reportType}`, {
        params: { format, ...filters },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default reportService;
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to handle API errors
const handleError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const errorMsg = error.response.data.message || 'An error occurred';
    throw new Error(errorMsg);
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error('Error setting up request: ' + error.message);
  }
};

// Get all competitions with optional filters
export const getAllCompetitions = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/competitions`, { params: filters });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get competition by ID
export const getCompetitionById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/competitions/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Create a new competition
export const createCompetition = async (competitionData) => {
  try {
    const response = await axios.post(`${API_URL}/competitions`, competitionData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Update an existing competition
export const updateCompetition = async (id, competitionData) => {
  try {
    const response = await axios.put(`${API_URL}/competitions/${id}`, competitionData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Delete a competition
export const deleteCompetition = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/competitions/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get teams for a competition
export const getCompetitionTeams = async (competitionId) => {
  try {
    const response = await axios.get(`${API_URL}/competitions/${competitionId}/teams`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Register a team for a competition
export const registerTeam = async (competitionId, teamData) => {
  try {
    const response = await axios.post(`${API_URL}/competitions/${competitionId}/teams`, teamData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get participants for a competition
export const getCompetitionParticipants = async (competitionId) => {
  try {
    const response = await axios.get(`${API_URL}/competitions/${competitionId}/participants`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Add a participant to a competition
export const addParticipant = async (competitionId, participantData) => {
  try {
    const response = await axios.post(`${API_URL}/competitions/${competitionId}/participants`, participantData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get competition results
export const getCompetitionResults = async (competitionId) => {
  try {
    const response = await axios.get(`${API_URL}/competitions/${competitionId}/results`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Add competition results
export const addCompetitionResults = async (competitionId, resultsData) => {
  try {
    const response = await axios.post(`${API_URL}/competitions/${competitionId}/results`, resultsData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get staff assignments for a competition
export const getCompetitionAssignments = async (competitionId) => {
  try {
    const response = await axios.get(`${API_URL}/competitions/${competitionId}/assignments`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Add a staff assignment to a competition
export const addStaffAssignment = async (competitionId, assignmentData) => {
  try {
    const response = await axios.post(`${API_URL}/competitions/${competitionId}/assignments`, assignmentData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Update a staff assignment
export const updateStaffAssignment = async (competitionId, assignmentId, assignmentData) => {
  try {
    const response = await axios.put(`${API_URL}/competitions/${competitionId}/assignments/${assignmentId}`, assignmentData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get upcoming competitions
export const getUpcomingCompetitions = async (limit = 5) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(`${API_URL}/competitions`, { 
      params: { 
        startDate: `gte:${today}`,
        limit
      } 
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Mock data for development (if API is not yet available)
export const getMockCompetitions = () => {
  return [
    {
      id: '1',
      name: 'Regional Robotics Challenge 2023',
      startDate: '2023-06-15',
      endDate: '2023-06-17',
      registrationDeadline: '2023-05-30',
      location: 'Science Center, Boston, MA',
      registrationFee: 75,
      teamCount: 24,
      ageCategories: ['Elementary (6-10)', 'Middle School (11-13)', 'High School (14-18)']
    },
    {
      id: '2',
      name: 'National Robotics Competition',
      startDate: '2023-08-10',
      endDate: '2023-08-14',
      registrationDeadline: '2023-07-15',
      location: 'Convention Center, Chicago, IL',
      registrationFee: 150,
      teamCount: 56,
      ageCategories: ['Middle School (11-13)', 'High School (14-18)']
    },
    {
      id: '3',
      name: 'First Tech Challenge Fall Series',
      startDate: '2023-10-05',
      endDate: '2023-10-07',
      registrationDeadline: '2023-09-15',
      location: 'Engineering Center, Seattle, WA',
      registrationFee: 100,
      teamCount: 32,
      ageCategories: ['High School (14-18)']
    }
  ];
};

// Export the API functions as a service object
export const competitionService = {
  getAllCompetitions,
  getCompetitionById,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getCompetitionTeams,
  registerTeam,
  getCompetitionParticipants,
  addParticipant,
  getCompetitionResults,
  addCompetitionResults,
  getCompetitionAssignments,
  addStaffAssignment,
  updateStaffAssignment,
  getUpcomingCompetitions,
  getMockCompetitions
};
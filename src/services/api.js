import axios from 'axios';

// Use environment variable if available, otherwise use relative path or mock API
const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    // Log errors but don't crash the app
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export default api;
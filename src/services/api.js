import axios from 'axios';

// In production, use the configured backend URL
// This will be the URL of your backend service on Render
const API_URL = process.env.REACT_APP_API_URL || 'https://resource-pulse-backend.onrender.com/api';

console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Ensure cookies are sent with requests for any authentication needs
  withCredentials: true
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
import axios from 'axios';

// When using the same host for frontend and backend in production (like Render)
// we use the relative path. In development, use localhost:8000
const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = isDevelopment ? 'http://localhost:8000/api' : '/api';

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
// Constants shared across the application

// API URL
export const API_URL = 'https://resource-pulse-backend.onrender.com/api';

// Default token expiry time in milliseconds (20 minutes)
export const TOKEN_EXPIRY = 20 * 60 * 1000;

// Maximum number of retries for API calls
export const MAX_API_RETRIES = 3;

// API Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH_TOKEN: '/auth/refresh-token',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  
  // Other endpoints
  RESOURCES: '/resources',
  PROJECTS: '/projects',
  ALLOCATIONS: '/allocations',
  SKILLS: '/skills',
  ROLES: '/roles'
};
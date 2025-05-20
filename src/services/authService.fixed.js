import api from './api';
import axios from 'axios';

/**
 * Service for handling authentication-related API calls
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - The created user object
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login a user
 * @param {Object} credentials - Login credentials (username/password)
 * @returns {Promise<Object>} - Login result with user data and tokens
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Store tokens in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Store the login timestamp to track token age
      localStorage.setItem('login_timestamp', Date.now().toString());
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout a user
 * @returns {Promise<Object>} - Logout result
 */
export const logout = async () => {
  try {
    // Get refresh token from localStorage
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('login_timestamp');
    
    return { message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if the API call fails, clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('login_timestamp');
    
    throw error;
  }
};

/**
 * Refresh the access token
 * @returns {Promise<Object>} - Refresh result with new token
 */
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/refresh-token', { refreshToken });
    
    // Store new token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Update timestamp when refreshing token
      localStorage.setItem('login_timestamp', Date.now().toString());
    }
    
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // If refresh fails, logout
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('login_timestamp');
    
    throw error;
  }
};

/**
 * Get current user profile - with additional fallback and debugging
 * @returns {Promise<Object>} - User profile data
 */
export const getProfile = async () => {
  try {
    console.log('Profile fetch: Starting request with cache buster');
    
    // Get API URL from environment or fallback
    const apiUrl = process.env.REACT_APP_API_URL || 'https://resource-pulse-backend.onrender.com/api';
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Make a direct axios request with full debugging
    // This bypasses any potentially problematic interceptors
    const timestamp = new Date().getTime();
    const response = await axios({
      method: 'GET',
      url: `${apiUrl}/auth/profile`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: { _t: timestamp } // Add cache buster
    });
    
    console.log('Profile fetch: Successful response received');
    
    // Update stored user data with fresh profile info
    if (response.data) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          ...response.data
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    
    // Add more detailed error logging
    if (error.response) {
      console.error('Profile fetch: Server response error:', {
        status: error.response.status,
        data: error.response.data
      });
      
      // If unauthorized, the token might be invalid, try to refresh
      if (error.response.status === 401) {
        try {
          console.log('Profile fetch: Attempting token refresh due to 401');
          await refreshToken();
          // After refreshing, try fetching profile again but directly 
          // to avoid infinite loop with the original method
          return getProfileAfterRefresh();
        } catch (refreshError) {
          console.error('Profile fetch: Token refresh failed:', refreshError);
          throw new Error('Authentication expired. Please log in again.');
        }
      }
    } else if (error.request) {
      console.error('Profile fetch: No response from server', error.request);
    } else {
      console.error('Profile fetch: Request setup error', error.message);
    }
    
    throw error;
  }
};

/**
 * Helper function to get profile after token refresh
 * This avoids infinite loop with the normal getProfile
 */
const getProfileAfterRefresh = async () => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://resource-pulse-backend.onrender.com/api';
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available after refresh');
    }
    
    const response = await axios({
      method: 'GET',
      url: `${apiUrl}/auth/profile`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      params: { _t: new Date().getTime() } // Add cache buster
    });
    
    return response.data;
  } catch (error) {
    console.error('Profile fetch after refresh failed:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {Object} passwordData - Password change data
 * @returns {Promise<Object>} - Result message
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Password change error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} - Updated user profile
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);

    // Update stored user info with new profile data
    const storedUser = getCurrentUser();
    if (storedUser) {
      const updatedUser = {
        ...storedUser,
        ...response.data // Use server response data instead of request data
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    return response.data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

/**
 * Request password reset
 * @param {Object} emailData - Email data for reset
 * @returns {Promise<Object>} - Result message
 */
export const requestPasswordReset = async (emailData) => {
  try {
    const response = await api.post('/auth/forgot-password', emailData);
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

/**
 * Reset password with token
 * @param {Object} resetData - Reset data with token and new password
 * @returns {Promise<Object>} - Result message
 */
export const resetPassword = async (resetData) => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Check if user is logged in
 * @returns {boolean} - True if user is logged in
 */
export const isLoggedIn = () => {
  return localStorage.getItem('token') !== null;
};

/**
 * Get current user data
 * @returns {Object|null} - User data or null if not logged in
 */
export const getCurrentUser = () => {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
};

/**
 * Get auth token
 * @returns {string|null} - Auth token or null if not logged in
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if token needs refreshing based on age
 * @returns {boolean} - True if token should be refreshed
 */
export const shouldRefreshToken = () => {
  const loginTimestamp = localStorage.getItem('login_timestamp');
  if (!loginTimestamp) return true;
  
  const tokenAge = Date.now() - parseInt(loginTimestamp, 10);
  // Refresh if token is older than 20 minutes
  return tokenAge > 20 * 60 * 1000;
};

/**
 * Update the API axios instance with the authentication token
 */
export const setupAuthInterceptor = () => {
  // Remove previous interceptors to prevent duplicates
  if (api.interceptors.request.handlers.length > 0) {
    api.interceptors.request.handlers.forEach(handler => {
      api.interceptors.request.eject(handler.id);
    });
  }

  if (api.interceptors.response.handlers.length > 0) {
    api.interceptors.response.handlers.forEach(handler => {
      api.interceptors.response.eject(handler.id);
    });
  }

  // Add request interceptor for authentication
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        
        // Add cache control headers for authenticated requests
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';
        
        // Add automatic token refresh for requests if token is old
        // But skip refresh for certain endpoints to avoid circular requests
        const skipRefreshEndpoints = [
          '/auth/login', 
          '/auth/refresh-token', 
          '/auth/logout',
          '/auth/profile'
        ];
        
        const endpoint = config.url.split('?')[0]; // Remove query params
        const shouldSkipRefresh = skipRefreshEndpoints.some(e => endpoint.includes(e));
        
        if (!shouldSkipRefresh && shouldRefreshToken()) {
          // Return a promise that first refreshes the token, then continues with the request
          return refreshToken()
            .then(refreshResult => {
              // Update the request with the new token
              config.headers.Authorization = `Bearer ${refreshResult.token}`;
              return config;
            })
            .catch(err => {
              console.error('Token refresh failed during request:', err);
              return config; // Continue with original request even if refresh fails
            });
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle token expiration
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If the error is 401 (Unauthorized) and not from the auth endpoints
      // Also check that we're not in a refresh loop
      if (
        error.response &&
        error.response.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/refresh-token') &&
        !originalRequest.url.includes('/auth/profile') // Remove the specific query parameter check
      ) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const response = await refreshToken();

          // If token refresh is successful, retry the original request
          if (response.token) {
            originalRequest.headers.Authorization = `Bearer ${response.token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, redirect to login
          console.error('Token refresh failed:', refreshError);

          // Force logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('login_timestamp');

          // Redirect to login page (this should be handled by the auth context)
          // Only redirect if we're not already on the login page to prevent loops
          if (!window.location.pathname.includes('/login')) {
            window.location = '/login';
          }
        }
      }

      return Promise.reject(error);
    }
  );
};
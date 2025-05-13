import api from './api';

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
    
    return { message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if the API call fails, clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
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
    }
    
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // If refresh fails, logout
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} - User profile data
 */
export const getProfile = async () => {
  try {
    // Add a cache buster to prevent any potential caching issues
    const response = await api.get('/auth/profile', {
      params: { _t: new Date().getTime() }
    });
    return response.data;
  } catch (error) {
    console.error('Profile fetch error:', error);
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
        ...profileData
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
 * Update the API axios instance with the authentication token
 */
export const setupAuthInterceptor = () => {
  // Remove previous interceptors to prevent duplicates
  api.interceptors.request.eject(
    api.interceptors.request.handlers[api.interceptors.request.handlers.length - 1]?.id
  );

  api.interceptors.response.eject(
    api.interceptors.response.handlers[api.interceptors.response.handlers.length - 1]?.id
  );

  // Add request interceptor for authentication
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
        !originalRequest.url.includes('/auth/profile?_t=') // Skip profile checks
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
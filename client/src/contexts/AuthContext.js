import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwt_decode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      return true;
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!token || isTokenExpired(token)) {
          if (refreshToken) {
            try {
              // Try to refresh the token
              await refreshAuthToken();
            } catch (error) {
              // If refresh fails, clear the auth state
              clearAuthState();
            }
          } else {
            clearAuthState();
          }
        } else {
          // Valid token exists
          const userInfo = jwt_decode(token);
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            role: userInfo.role
          });
          
          // Set auth header for future API requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clear authentication state
  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Refresh authentication token
  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post('/api/auth/refresh-token', { refreshToken });
      
      if (response.data.success) {
        const { token } = response.data;
        localStorage.setItem('token', token);
        
        const userInfo = jwt_decode(token);
        setUser({
          id: userInfo.id,
          email: userInfo.email,
          role: userInfo.role
        });
        
        // Set auth header for future API requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthState();
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, refreshToken, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        setUser(user);
        
        // Set auth header for future API requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return true;
      } else {
        setError(response.data.message || 'Login failed');
        return false;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    clearAuthState();
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Create auth response interceptor to handle token expiry
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 (Unauthorized) and not from the refresh token API
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('refresh-token')
        ) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            await refreshAuthToken();
            
            // Retry the original request with new token
            const token = localStorage.getItem('token');
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          } catch (err) {
            // If refresh fails, redirect to login
            logout();
            return Promise.reject(error);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    refreshAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
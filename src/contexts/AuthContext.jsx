import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

// Create auth context
const AuthContext = createContext();

// Hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Set up API interceptor for authentication
  useEffect(() => {
    authService.setupAuthInterceptor();
  }, []);

  // Check for existing user session
  useEffect(() => {
    const checkLoggedInUser = () => {
      const user = authService.getCurrentUser();

      if (user) {
        setCurrentUser(user);
      }

      setLoading(false);
    };

    checkLoggedInUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.login(credentials);
      setCurrentUser(result.user);

      return result;
    } catch (err) {
      console.error('Login error:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Unable to login. Please check your credentials and try again.';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.register(userData);
      return result;
    } catch (err) {
      console.error('Registration error:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Registration failed. Please try again.';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);

      await authService.logout();
      setCurrentUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      
      // Even on error, remove the user from state
      setCurrentUser(null);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Logout failed. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.changePassword(passwordData);
      return result;
    } catch (err) {
      console.error('Password change error:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Password change failed. Please try again.';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset function
  const requestPasswordReset = async (emailData) => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.requestPasswordReset(emailData);
      return result;
    } catch (err) {
      console.error('Password reset request error:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Password reset request failed. Please try again.';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (resetData) => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.resetPassword(resetData);
      return result;
    } catch (err) {
      console.error('Password reset error:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Password reset failed. Please try again.';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user profile function - memoized to prevent re-renders
  const getProfile = React.useCallback(async () => {
    try {
      setError(null);

      // Don't set loading state in context to prevent re-renders
      // The component using this function should manage its own loading state

      const profile = await authService.getProfile();
      return profile;
    } catch (err) {
      console.error('Profile fetch error:', err);

      const errorMessage =
        err.response?.data?.message ||
        'Failed to fetch user profile.';

      setError(errorMessage);
      throw err;
    }
  }, []);

  // Function to clear errors
  const clearError = () => {
    setError(null);
  };

  // Provide auth context
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    changePassword,
    requestPasswordReset,
    resetPassword,
    getProfile,
    clearError,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
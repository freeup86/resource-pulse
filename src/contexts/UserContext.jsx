// src/contexts/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create UserContext
const UserContext = createContext();

// Custom hook to use the UserContext
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the current user on component mount
  useEffect(() => {
    const loadUser = () => {
      try {
        // In a real app, this would fetch from an API or auth service
        // For now, we'll use a default user
        const defaultUser = {
          id: 1,
          name: 'Default User',
          email: 'user@example.com',
          role: 'user',
          // Add any other fields required for your user model
        };
        
        setCurrentUser(defaultUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Provide the context value
  const value = {
    currentUser,
    loading,
    setCurrentUser,
    getCurrentUserId: () => currentUser?.id || 1, // Default to user ID 1 if not authenticated
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
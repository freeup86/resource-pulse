import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import * as roleService from '../services/roleService';

// Create context
const RoleContext = createContext();

// Role reducer
const roleReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ROLES':
      return action.payload;
    case 'ADD_ROLE':
      return [...state, action.payload];
    case 'UPDATE_ROLE':
      return state.map(role => 
        role.id === action.payload.id ? action.payload : role
      );
    case 'DELETE_ROLE':
      return state.filter(role => role.id !== action.payload);
    default:
      return state;
  }
};

// Provider component
export const RoleProvider = ({ children }) => {
  const [roles, dispatch] = useReducer(roleReducer, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const data = await roleService.getRoles();
        dispatch({ type: 'SET_ROLES', payload: data });
        setError(null);
      } catch (err) {
        setError('Failed to fetch roles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Create new role
  const addRole = async (role) => {
    try {
      const newRole = await roleService.createRole(role);
      dispatch({ type: 'ADD_ROLE', payload: newRole });
      return newRole;
    } catch (err) {
      setError('Failed to add role');
      throw err;
    }
  };

  // Update existing role
  const updateRole = async (updatedRole) => {
    try {
      const role = await roleService.updateRole(updatedRole.id, updatedRole);
      dispatch({ type: 'UPDATE_ROLE', payload: role });
      return role;
    } catch (err) {
      setError('Failed to update role');
      throw err;
    }
  };

  // Delete role
  const deleteRole = async (roleId) => {
    try {
      await roleService.deleteRole(roleId);
      dispatch({ type: 'DELETE_ROLE', payload: roleId });
    } catch (err) {
      // Set a more specific error message if available
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to delete role');
      }
      throw err;
    }
  };

  return (
    <RoleContext.Provider value={{ 
      roles, 
      loading,
      error,
      addRole,
      updateRole,
      deleteRole
    }}>
      {children}
    </RoleContext.Provider>
  );
};

// Custom hook for using the role context
export const useRoles = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRoles must be used within a RoleProvider');
  }
  return context;
};
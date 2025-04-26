import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import * as resourceService from '../services/resourceService';
import * as allocationService from '../services/allocationService';

// Create context
const ResourceContext = createContext();

// Resource reducer
const resourceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_RESOURCES':
      return action.payload;
    case 'ADD_RESOURCE':
      return [...state, action.payload];
    case 'UPDATE_RESOURCE':
      return state.map(resource => 
        resource.id === action.payload.id ? action.payload : resource
      );
    case 'DELETE_RESOURCE':
      return state.filter(resource => resource.id !== action.payload);
    case 'UPDATE_ALLOCATION':
      return state.map(resource => {
        if (resource.id === action.payload.resourceId) {
          return {
            ...resource,
            allocation: action.payload.allocation
          };
        }
        return resource;
      });
    default:
      return state;
  }
};

// Provider component
export const ResourceProvider = ({ children }) => {
  const [resources, dispatch] = useReducer(resourceReducer, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch resources on mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const data = await resourceService.getResources();
        dispatch({ type: 'SET_RESOURCES', payload: data });
        setError(null);
      } catch (err) {
        setError('Failed to fetch resources');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Actions
  const addResource = async (resource) => {
    try {
      const newResource = await resourceService.createResource(resource);
      dispatch({ type: 'ADD_RESOURCE', payload: newResource });
      return newResource;
    } catch (err) {
      setError('Failed to add resource');
      throw err;
    }
  };

  const updateResource = async (updatedResource) => {
    try {
      const resource = await resourceService.updateResource(updatedResource.id, updatedResource);
      dispatch({ type: 'UPDATE_RESOURCE', payload: resource });
      return resource;
    } catch (err) {
      setError('Failed to update resource');
      throw err;
    }
  };

  const deleteResource = async (resourceId) => {
    try {
      await resourceService.deleteResource(resourceId);
      dispatch({ type: 'DELETE_RESOURCE', payload: resourceId });
    } catch (err) {
      setError('Failed to delete resource');
      throw err;
    }
  };

  const updateAllocation = async (resourceId, allocation) => {
    try {
      if (allocation) {
        await allocationService.updateAllocation(resourceId, allocation);
      } else {
        await allocationService.updateAllocation(resourceId, { projectId: null });
      }
      
      dispatch({ 
        type: 'UPDATE_ALLOCATION', 
        payload: { resourceId, allocation } 
      });
    } catch (err) {
      setError('Failed to update allocation');
      throw err;
    }
  };

  return (
    <ResourceContext.Provider value={{ 
      resources, 
      loading,
      error,
      addResource, 
      updateResource, 
      deleteResource,
      updateAllocation
    }}>
      {children}
    </ResourceContext.Provider>
  );
};

// Custom hook for using the resource context
export const useResources = () => {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResources must be used within a ResourceProvider');
  }
  return context;
};
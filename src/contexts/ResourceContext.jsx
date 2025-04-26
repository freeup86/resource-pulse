import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import * as resourceService from '../services/resourceService';
import * as allocationService from '../services/allocationService';

// Create context
const ResourceContext = createContext();

// Resource reducer
const resourceReducer = (state, action) => {
  switch (action.type) {
    // ... other cases
    case 'SET_RESOURCES':
      // Make sure each resource has an allocations array
      return action.payload.map(resource => ({
        ...resource,
        allocations: resource.allocations || (resource.allocation ? [resource.allocation] : [])
      }));
    case 'ADD_RESOURCE':
      return [...state, {
        ...action.payload,
        allocations: action.payload.allocations || []
      }];
    case 'UPDATE_RESOURCE':
      return state.map(resource => 
        resource.id === action.payload.id ? {
          ...action.payload,
          allocations: action.payload.allocations || (action.payload.allocation ? [action.payload.allocation] : [])
        } : resource
      );
    case 'ADD_ALLOCATION':
      return state.map(resource => {
        if (resource.id === action.payload.resourceId) {
          const allocations = [...(resource.allocations || [])];
          allocations.push(action.payload.allocation);
          return { ...resource, allocations };
        }
        return resource;
      });
    case 'UPDATE_ALLOCATION':
      return state.map(resource => {
        if (resource.id === action.payload.resourceId) {
          let allocations = [...(resource.allocations || [])];
          
          // Find and update the specific allocation
          const index = allocations.findIndex(a => a.id === action.payload.allocation.id);
          if (index !== -1) {
            allocations[index] = action.payload.allocation;
          } else {
            // If not found, it's a new allocation
            allocations.push(action.payload.allocation);
          }
          
          return { ...resource, allocations };
        }
        return resource;
      });
    case 'REMOVE_ALLOCATION':
      return state.map(resource => {
        if (resource.id === action.payload.resourceId) {
          const allocations = (resource.allocations || [])
            .filter(a => a.id !== action.payload.allocationId);
          return { ...resource, allocations };
        }
        return resource;
      });
    default:
      return state;
  }
};

const addAllocation = async (resourceId, allocationData) => {
  try {
    const response = await allocationService.updateAllocation(resourceId, allocationData);
    
    dispatch({ 
      type: 'ADD_ALLOCATION', 
      payload: { 
        resourceId,
        allocation: response
      } 
    });
    
    return response;
  } catch (err) {
    setError('Failed to add allocation');
    throw err;
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

  const updateAllocation = async (resourceId, allocationData) => {
    try {
      const response = await allocationService.updateAllocation(resourceId, allocationData);
      
      if (allocationData.projectId === null) {
        // This is a removal
        dispatch({ 
          type: 'REMOVE_ALLOCATION', 
          payload: { 
            resourceId, 
            allocationId: allocationData.id 
          } 
        });
      } else {
        dispatch({ 
          type: 'UPDATE_ALLOCATION', 
          payload: { 
            resourceId, 
            allocation: response 
          } 
        });
      }
      
      return response;
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
      addAllocation,
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
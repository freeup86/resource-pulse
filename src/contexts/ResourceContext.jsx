import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import * as resourceService from '../services/resourceService';
import * as allocationService from '../services/allocationService';

// Resource reducer
const resourceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_RESOURCES':
      // Ensure each resource has an allocations array
      return action.payload.map(resource => {
        // Create a consistent allocations array
        const allocations = resource.allocations || 
          (resource.allocation ? [resource.allocation] : []);
          
        return {
          ...resource,
          allocations: allocations.filter(Boolean), // Filter out null/undefined
          allocation: resource.allocation // Keep for backwards compatibility
        };
      });
    
    case 'ADD_RESOURCE':
      return [...state, {
        ...action.payload,
        allocations: action.payload.allocations || (action.payload.allocation ? [action.payload.allocation] : [])
      }];
    
    case 'UPDATE_RESOURCE':
      return state.map(resource => 
        resource.id === action.payload.id ? {
          ...action.payload,
          allocations: action.payload.allocations || (action.payload.allocation ? [action.payload.allocation] : [])
        } : resource
      );
    
    case 'DELETE_RESOURCE':
      return state.filter(resource => resource.id !== action.payload);
    
    case 'ADD_ALLOCATION':
      return state.map(resource => {
        if (resource.id === action.payload.resourceId) {
          // Ensure action.payload.allocation is valid
          const newAllocations = Array.isArray(action.payload.allocation) 
            ? action.payload.allocation 
            : action.payload.allocation 
              ? [action.payload.allocation] 
              : [];
          
          // Combine existing allocations with new ones
          const existingAllocations = resource.allocations || [];
          
          // Remove duplicates by allocation ID
          const combinedAllocations = [
            ...existingAllocations.filter(existing => 
              !newAllocations.some(newAlloc => 
                newAlloc && existing && newAlloc.id === existing.id
              )
            ),
            ...newAllocations.filter(newAlloc => newAlloc && newAlloc.id)
          ];
          
          return { 
            ...resource, 
            allocations: combinedAllocations,
            allocation: combinedAllocations[0] || null // Update primary allocation for backwards compatibility
          };
        }
        return resource;
      });
    
    case 'UPDATE_ALLOCATION':
      return state.map(resource => {
        if (resource.id === action.payload.resourceId) {
          // Ensure we have valid allocations array
          let allocations = [...(resource.allocations || [])];
          
          // Handle both single allocation and array of allocations
          const newAllocations = Array.isArray(action.payload.allocation) 
            ? action.payload.allocation 
            : [action.payload.allocation].filter(Boolean);
          
          // Update or add allocations
          newAllocations.forEach(newAllocation => {
            if (!newAllocation || !newAllocation.id) {
              console.warn('Attempted to update allocation without a valid ID', newAllocation);
              return;
            }
            
            const index = allocations.findIndex(a => a && a.id === newAllocation.id);
            if (index !== -1) {
              allocations[index] = newAllocation;
            } else {
              allocations.push(newAllocation);
            }
          });
          
          return { 
            ...resource, 
            allocations,
            allocation: allocations[0] || null // Update primary allocation for backwards compatibility
          };
        }
        return resource;
      });
    
    case 'REMOVE_ALLOCATION':
      return state.map(resource => {
        if (resource.id === action.payload.resourceId) {
          const allocations = (resource.allocations || [])
            .filter(a => a && a.id !== action.payload.allocationId);
          
          return { 
            ...resource, 
            allocations,
            allocation: allocations[0] || null // Update primary allocation for backwards compatibility
          };
        }
        return resource;
      });
    
    default:
      return state;
  }
};

// Create context
const ResourceContext = createContext();

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

  // Add Allocation
  const addAllocation = async (resourceId, allocationData) => {
    try {
      console.log('Attempting to add allocation:', {
        resourceId,
        allocationData
      });

      const response = await allocationService.updateAllocation(resourceId, allocationData);
      
      console.log('Allocation response:', response);
      
      // Dispatch allocation(s)
      dispatch({ 
        type: 'ADD_ALLOCATION', 
        payload: { 
          resourceId,
          allocation: response
        } 
      });
      
      return response;
    } catch (err) {
      console.error('Error adding allocation:', err);
      setError('Failed to add allocation');
      throw err;
    }
  };

  // Update Allocation
  const updateAllocation = async (resourceId, allocationData) => {
    try {
      // If projectId is null, it's a removal request
      if (allocationData.projectId === null) {
        const response = await allocationService.updateAllocation(resourceId, allocationData);
        
        // Dispatch removal
        dispatch({ 
          type: 'REMOVE_ALLOCATION', 
          payload: { 
            resourceId, 
            allocationId: allocationData.id 
          } 
        });
        
        return response;
      }
      
      // Regular allocation update
      const response = await allocationService.updateAllocation(resourceId, allocationData);
      
      // Ensure we're passing a valid payload
      dispatch({ 
        type: 'UPDATE_ALLOCATION', 
        payload: { 
          resourceId, 
          allocation: response
        } 
      });
      
      return response;
    } catch (err) {
      console.error('Error updating allocation:', err);
      setError('Failed to update allocation');
      throw err;
    }
  };

  const refreshResources = async () => {
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

  // Function to clear errors
  const clearError = () => {
    setError(null);
  };

  return (
    <ResourceContext.Provider value={{
      resources,
      loading,
      error,
      clearError,
      refreshResources,
      addResource: async (resource) => {
        try {
          const newResource = await resourceService.createResource(resource);
          dispatch({ type: 'ADD_RESOURCE', payload: newResource });
          return newResource;
        } catch (err) {
          setError('Failed to add resource');
          throw err;
        }
      },
      updateResource: async (updatedResource) => {
        try {
          const resource = await resourceService.updateResource(updatedResource.id, updatedResource);
          dispatch({ type: 'UPDATE_RESOURCE', payload: resource });
          return resource;
        } catch (err) {
          setError('Failed to update resource');
          throw err;
        }
      },
      deleteResource: async (resourceId) => {
        try {
          await resourceService.deleteResource(resourceId);
          dispatch({ type: 'DELETE_RESOURCE', payload: resourceId });
          // Clear any previous error on successful deletion
          setError(null);
        } catch (err) {
          // Set a more specific error message if available from the API
          if (err.response && err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else {
            setError('Failed to delete resource. It may be assigned to a project or have active allocations.');
          }
          // Rethrow the error so the component can handle it with a modal
          throw err;
        }
      },
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

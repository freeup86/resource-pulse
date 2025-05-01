import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import * as projectService from '../services/projectService';

// Create context
const ProjectContext = createContext();

// Project reducer
const projectReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROJECTS':
      // Ensure payload is an array and filter out invalid projects
      return Array.isArray(action.payload) 
        ? action.payload.filter(project => project && project.id) 
        : [];
    
    case 'ADD_PROJECT':
      // Only add project if it has a valid ID
      if (!action.payload || !action.payload.id) {
        console.warn('Attempted to add project without a valid ID', action.payload);
        return state;
      }
      return [...state, action.payload];
    
    case 'UPDATE_PROJECT':
      // Only update if project has a valid ID
      if (!action.payload || !action.payload.id) {
        console.warn('Attempted to update project without a valid ID', action.payload);
        return state;
      }
      
      return state.map(project => 
        project.id === action.payload.id ? action.payload : project
      );
    
    case 'DELETE_PROJECT':
      // Ensure projectId is valid
      return state.filter(project => project && project.id !== action.payload);
    
    default:
      return state;
  }
};

// Provider component
export const ProjectProvider = ({ children }) => {
  const [projects, dispatch] = useReducer(projectReducer, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProjects();
        
        // Additional validation before dispatching
        if (!Array.isArray(data)) {
          console.error('Fetched projects is not an array', data);
          dispatch({ type: 'SET_PROJECTS', payload: [] });
        } else {
          dispatch({ type: 'SET_PROJECTS', payload: data });
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch projects');
        console.error(err);
        dispatch({ type: 'SET_PROJECTS', payload: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Actions
  const addProject = async (project) => {
    try {
      const newProject = await projectService.createProject(project);
      
      // Validate new project before dispatching
      if (!newProject || !newProject.id) {
        throw new Error('Created project lacks a valid ID');
      }
      
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      return newProject;
    } catch (err) {
      setError('Failed to add project');
      console.error(err);
      throw err;
    }
  };

  const updateProject = async (updatedProject) => {
    try {
      // Validate input
      if (!updatedProject || !updatedProject.id) {
        throw new Error('Cannot update project without a valid ID');
      }
      
      console.log('ProjectContext: Updating project with data:', updatedProject);
      
      // Check that requiredRoles has the right format
      if (updatedProject.requiredRoles) {
        console.log('ProjectContext: Required roles to be sent:', updatedProject.requiredRoles);
        
        // Validate required roles format
        const invalidRoles = updatedProject.requiredRoles.filter(
          role => typeof role.roleId !== 'number' || typeof role.count !== 'number'
        );
        
        if (invalidRoles.length > 0) {
          console.error('ProjectContext: Invalid role format detected:', invalidRoles);
          console.log('ProjectContext: Fixing role format...');
          
          // Fix the roles format
          updatedProject.requiredRoles = updatedProject.requiredRoles.map(role => ({
            roleId: parseInt(role.roleId),
            count: parseInt(role.count) || 1
          }));
          
          console.log('ProjectContext: Fixed roles:', updatedProject.requiredRoles);
        }
      }
      
      const project = await projectService.updateProject(updatedProject.id, updatedProject);
      
      console.log('ProjectContext: Project updated successfully, response:', project);
      
      // Validate response
      if (!project || !project.id) {
        throw new Error('Updated project lacks a valid ID');
      }
      
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
      return project;
    } catch (err) {
      console.error('ProjectContext: Error updating project:', err);
      
      if (err.response) {
        console.error('ProjectContext: Error response:', err.response.data);
      }
      
      setError('Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      // Validate input
      if (projectId === undefined || projectId === null) {
        throw new Error('Cannot delete project without a valid ID');
      }
      
      await projectService.deleteProject(projectId);
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    } catch (err) {
      setError('Failed to delete project');
      console.error(err);
      throw err;
    }
  };

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      
      // Additional validation before dispatching
      if (!Array.isArray(data)) {
        console.error('Fetched projects is not an array', data);
        dispatch({ type: 'SET_PROJECTS', payload: [] });
      } else {
        dispatch({ type: 'SET_PROJECTS', payload: data });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error(err);
      dispatch({ type: 'SET_PROJECTS', payload: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      loading,
      error,
      addProject, 
      updateProject, 
      deleteProject,
      refreshProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook for using the project context
export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
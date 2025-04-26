import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import * as projectService from '../services/projectService';

// Create context
const ProjectContext = createContext();

// Project reducer
const projectReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROJECTS':
      return action.payload;
    case 'ADD_PROJECT':
      return [...state, action.payload];
    case 'UPDATE_PROJECT':
      return state.map(project => 
        project.id === action.payload.id ? action.payload : project
      );
    case 'DELETE_PROJECT':
      return state.filter(project => project.id !== action.payload);
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
        dispatch({ type: 'SET_PROJECTS', payload: data });
        setError(null);
      } catch (err) {
        setError('Failed to fetch projects');
        console.error(err);
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
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      return newProject;
    } catch (err) {
      setError('Failed to add project');
      throw err;
    }
  };

  const updateProject = async (updatedProject) => {
    try {
      const project = await projectService.updateProject(updatedProject.id, updatedProject);
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
      return project;
    } catch (err) {
      setError('Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await projectService.deleteProject(projectId);
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    } catch (err) {
      setError('Failed to delete project');
      throw err;
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      loading,
      error,
      addProject, 
      updateProject, 
      deleteProject 
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
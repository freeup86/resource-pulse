// src/contexts/AppProvider.jsx
import React from 'react';
import { ResourceProvider } from './ResourceContext';
import { ProjectProvider } from './ProjectContext';
import { RoleProvider } from './RoleContext';

const AppProvider = ({ children }) => {
  return (
    <ResourceProvider>
      <ProjectProvider>
        <RoleProvider>
          {children}
        </RoleProvider>
      </ProjectProvider>
    </ResourceProvider>
  );
};

export default AppProvider;
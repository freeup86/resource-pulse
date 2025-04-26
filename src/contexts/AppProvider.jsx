import React from 'react';
import { ResourceProvider } from './ResourceContext';
import { ProjectProvider } from './ProjectContext';

const AppProvider = ({ children }) => {
  return (
    <ResourceProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </ResourceProvider>
  );
};

export default AppProvider;
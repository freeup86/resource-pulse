// src/contexts/AppProvider.jsx
import React from 'react';
import { ResourceProvider } from './ResourceContext';
import { ProjectProvider } from './ProjectContext';
import { RoleProvider } from './RoleContext';
import { SettingsProvider } from './SettingsContext';
import { CapacityProvider } from './CapacityContext';

const AppProvider = ({ children }) => {
  return (
    <SettingsProvider>
      <ResourceProvider>
        <ProjectProvider>
          <RoleProvider>
            <CapacityProvider>
              {children}
            </CapacityProvider>
          </RoleProvider>
        </ProjectProvider>
      </ResourceProvider>
    </SettingsProvider>
  );
};

export default AppProvider;
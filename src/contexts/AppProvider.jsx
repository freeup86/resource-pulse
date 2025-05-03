// src/contexts/AppProvider.jsx
import React from 'react';
import { ResourceProvider } from './ResourceContext';
import { ProjectProvider } from './ProjectContext';
import { RoleProvider } from './RoleContext';
import { SettingsProvider } from './SettingsContext';
import { CapacityProvider } from './CapacityContext';
import { UserProvider } from './UserContext';

const AppProvider = ({ children }) => {
  return (
    <UserProvider>
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
    </UserProvider>
  );
};

export default AppProvider;
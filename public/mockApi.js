// This file provides mock data for the frontend when the backend is not available

window.mockApiData = {
  // Projects data
  projects: [],
  
  // Resources data
  resources: [],
  
  // Skills data
  skills: [],
  skillCategories: [],
  proficiencyLevels: [],
  
  // Roles data
  roles: [],
  
  // Settings data
  settings: {
    generalSettings: {},
    notificationSettings: {},
    integrationSettings: {}
  },
  
  // Notifications
  notifications: {
    unread: 0,
    items: []
  }
};

// Attach to window for console debugging
window.mockApi = true;
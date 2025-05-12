import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Helper function to handle API errors
const handleError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const errorMsg = error.response.data.message || 'An error occurred';
    throw new Error(errorMsg);
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error('Error setting up request: ' + error.message);
  }
};

// Get user profile settings
export const getUserProfile = async () => {
  try {
    // For development, return mock data instead of making an API call
    // Comment this out when the API is ready
    return getMockUserProfile();

    // Uncomment when the API is ready
    // const response = await axios.get(`${API_URL}/settings/profile`);
    // return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return mock data as fallback
    return getMockUserProfile();
  }
};

// Update user profile settings
export const updateUserProfile = async (profileData) => {
  try {
    // For development, return the data that was passed in
    // Comment this out when the API is ready
    return { ...profileData, success: true };

    // Uncomment when the API is ready
    // const response = await axios.put(`${API_URL}/settings/profile`, profileData);
    // return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Return the data that was passed in as fallback
    return { ...profileData, success: true };
  }
};

// Change user password
export const changePassword = async (passwordData) => {
  try {
    // For development, return a success response
    // Comment this out when the API is ready
    return { success: true, message: "Password changed successfully" };

    // Uncomment when the API is ready
    // const response = await axios.post(`${API_URL}/settings/change-password`, passwordData);
    // return response.data;
  } catch (error) {
    console.error('Error changing password:', error);

    // Check for specific errors
    if (passwordData.currentPassword !== 'password123') {
      throw new Error('Current password is incorrect');
    }

    // Return success as fallback
    return { success: true, message: "Password changed successfully" };
  }
};

// Get notification settings
export const getNotificationSettings = async () => {
  try {
    // For development, return mock data
    return getMockNotificationSettings();

    // Uncomment when the API is ready
    // const response = await axios.get(`${API_URL}/settings/notifications`);
    // return response.data;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    // Return mock data as fallback
    return getMockNotificationSettings();
  }
};

// Update notification settings
export const updateNotificationSettings = async (notificationData) => {
  try {
    // For development, return the data that was passed in
    return { ...notificationData, success: true };

    // Uncomment when the API is ready
    // const response = await axios.put(`${API_URL}/settings/notifications`, notificationData);
    // return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    // Return the data that was passed in as fallback
    return { ...notificationData, success: true };
  }
};

// Get system settings (organization, locations, etc.)
export const getSystemSettings = async () => {
  try {
    // For development, return mock data
    return getMockSystemSettings();

    // Uncomment when the API is ready
    // const response = await axios.get(`${API_URL}/settings/system`);
    // return response.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    // Return mock data as fallback
    return getMockSystemSettings();
  }
};

// Update system settings
export const updateSystemSettings = async (systemData) => {
  try {
    // For development, return the data that was passed in
    return { ...systemData, success: true };

    // Uncomment when the API is ready
    // const response = await axios.put(`${API_URL}/settings/system`, systemData);
    // return response.data;
  } catch (error) {
    console.error('Error updating system settings:', error);
    // Return the data that was passed in as fallback
    return { ...systemData, success: true };
  }
};

// Get email templates
export const getEmailTemplates = async () => {
  try {
    // For development, return mock data
    return getMockEmailTemplates();

    // Uncomment when the API is ready
    // const response = await axios.get(`${API_URL}/settings/email-templates`);
    // return response.data;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    // Return mock data as fallback
    return getMockEmailTemplates();
  }
};

// Update email template
export const updateEmailTemplate = async (templateData) => {
  try {
    // For development, return the data that was passed in
    return { ...templateData, success: true };

    // Uncomment when the API is ready
    // const response = await axios.put(`${API_URL}/settings/email-templates/${templateData.id}`, templateData);
    // return response.data;
  } catch (error) {
    console.error('Error updating email template:', error);
    // Return the data that was passed in as fallback
    return { ...templateData, success: true };
  }
};

// Delete email template
export const deleteEmailTemplate = async (templateId) => {
  try {
    // For development, return success
    return { success: true, message: "Template deleted" };
  } catch (error) {
    console.error('Error deleting email template:', error);
    return { success: true, message: "Template deleted" };
  }
};

// Duplicate email template
export const duplicateEmailTemplate = async (templateId, newName) => {
  try {
    // For development, get mock templates and duplicate the specified one
    const templates = getMockEmailTemplates().templates;
    const templateToDuplicate = templates.find(t => t.id === templateId);

    if (templateToDuplicate) {
      return {
        ...templateToDuplicate,
        id: Date.now().toString(),
        name: newName || `${templateToDuplicate.name} (Copy)`,
        success: true
      };
    }

    return {
      id: Date.now().toString(),
      name: newName || 'New Template',
      subject: 'New Subject',
      content: 'Template Content',
      category: 'General',
      variables: [],
      success: true
    };
  } catch (error) {
    console.error('Error duplicating email template:', error);
    return {
      id: Date.now().toString(),
      name: newName || 'New Template',
      subject: 'New Subject',
      content: 'Template Content',
      category: 'General',
      variables: [],
      success: true
    };
  }
};

// Reset email template
export const resetEmailTemplate = async (templateId) => {
  try {
    // For development, get mock templates and return the specified one
    const templates = getMockEmailTemplates().templates;
    const templateToReset = templates.find(t => t.id === templateId);

    if (templateToReset) {
      return { ...templateToReset, success: true };
    }

    return {
      id: templateId,
      name: 'Reset Template',
      subject: 'Default Subject',
      content: 'Default Content',
      category: 'General',
      variables: [],
      success: true
    };
  } catch (error) {
    console.error('Error resetting email template:', error);
    return {
      id: templateId,
      name: 'Reset Template',
      subject: 'Default Subject',
      content: 'Default Content',
      category: 'General',
      variables: [],
      success: true
    };
  }
};

// Create email template
export const createEmailTemplate = async (templateData) => {
  try {
    // For development, return the data with a new ID
    return {
      ...templateData,
      id: Date.now().toString(),
      variables: templateData.variables || [],
      success: true
    };
  } catch (error) {
    console.error('Error creating email template:', error);
    // Return the data with a new ID as fallback
    return {
      ...templateData,
      id: Date.now().toString(),
      variables: templateData.variables || [],
      success: true
    };
  }
};

// Get user roles
export const getUserRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/settings/roles`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Create user role
export const createUserRole = async (roleData) => {
  try {
    const response = await axios.post(`${API_URL}/settings/roles`, roleData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Update user role
export const updateUserRole = async (roleId, roleData) => {
  try {
    const response = await axios.put(`${API_URL}/settings/roles/${roleId}`, roleData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Delete user role
export const deleteUserRole = async (roleId) => {
  try {
    const response = await axios.delete(`${API_URL}/settings/roles/${roleId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get locations
export const getLocations = async () => {
  try {
    const response = await axios.get(`${API_URL}/settings/locations`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Create location
export const createLocation = async (locationData) => {
  try {
    const response = await axios.post(`${API_URL}/settings/locations`, locationData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Update location
export const updateLocation = async (locationId, locationData) => {
  try {
    const response = await axios.put(`${API_URL}/settings/locations/${locationId}`, locationData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Delete location
export const deleteLocation = async (locationId) => {
  try {
    const response = await axios.delete(`${API_URL}/settings/locations/${locationId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get security settings
export const getSecuritySettings = async () => {
  try {
    // For development, return mock data
    return getMockSecuritySettings();

    // Uncomment when the API is ready
    // const response = await axios.get(`${API_URL}/settings/security`);
    // return response.data;
  } catch (error) {
    console.error('Error fetching security settings:', error);
    // Return mock data as fallback
    return getMockSecuritySettings();
  }
};

// Update security settings
export const updateSecuritySettings = async (securityData) => {
  try {
    // For development, return the data that was passed in
    return { ...securityData, success: true };

    // Uncomment when the API is ready
    // const response = await axios.put(`${API_URL}/settings/security`, securityData);
    // return response.data;
  } catch (error) {
    console.error('Error updating security settings:', error);
    // Return the data that was passed in as fallback
    return { ...securityData, success: true };
  }
};

// Enable two-factor authentication
export const enableTwoFactor = async () => {
  try {
    // For development, return success
    return { success: true, message: "Two-factor authentication enabled" };
  } catch (error) {
    console.error('Error enabling two-factor authentication:', error);
    return { success: true, message: "Two-factor authentication enabled" };
  }
};

// Disable two-factor authentication
export const disableTwoFactor = async () => {
  try {
    // For development, return success
    return { success: true, message: "Two-factor authentication disabled" };
  } catch (error) {
    console.error('Error disabling two-factor authentication:', error);
    return { success: true, message: "Two-factor authentication disabled" };
  }
};

// Revoke device
export const revokeDevice = async (deviceId) => {
  try {
    // For development, return success
    return { success: true, message: "Device access revoked" };
  } catch (error) {
    console.error('Error revoking device access:', error);
    return { success: true, message: "Device access revoked" };
  }
};

// Revoke all devices
export const revokeAllDevices = async () => {
  try {
    // For development, return success
    return { success: true, message: "All devices revoked" };
  } catch (error) {
    console.error('Error revoking all devices:', error);
    return { success: true, message: "All devices revoked" };
  }
};

// Mock data for development (if API is not yet available)
export const getMockUserProfile = () => {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    title: 'Head Coach',
    preferredLanguage: 'en',
    profileImage: null
  };
};

export const getMockNotificationSettings = () => {
  return {
    // Application notifications
    applicationEnabled: true,
    upcomingCompetitions: true,
    endingRegistration: true,
    newTeamRegistrations: true,
    competitionResults: true,
    staffAssignments: true,
    systemAnnouncements: true,
    // Email notifications
    emailEnabled: true,
    emailDigest: 'daily',
    emailAddress: 'john.doe@example.com',
    // SMS notifications
    smsEnabled: false,
    phoneNumber: '(555) 123-4567',
    competitionReminders: false,
    emergencyAlerts: true,
    // Custom channels
    customChannels: ['Slack', 'Microsoft Teams']
  };
};

export const getMockSystemSettings = () => {
  return {
    organization: {
      name: 'Robotics Education Center',
      logo: null,
      address: {
        street: '123 Technology Blvd',
        city: 'Innovation City',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      phone: '(555) 987-6543',
      email: 'info@roboticsedu.org',
      website: 'www.roboticsedu.org',
      taxId: '12-3456789'
    },
    locations: [
      {
        id: '1',
        name: 'Main Campus',
        address: '123 Technology Blvd, Innovation City, CA 90210',
        capacity: 120,
        type: 'classroom'
      },
      {
        id: '2',
        name: 'Downtown Lab',
        address: '456 Innovation St, Innovation City, CA 90211',
        capacity: 60,
        type: 'lab'
      },
      {
        id: '3',
        name: 'East Side Field',
        address: '789 Robotics Ave, Innovation City, CA 90212',
        capacity: 200,
        type: 'field'
      }
    ],
    roles: [
      {
        id: '1',
        name: 'Administrator',
        description: 'Full access to all system features',
        permissions: ['admin_access', 'manage_settings', 'manage_students', 'manage_courses', 'manage_instructors', 'manage_competitions', 'view_reports']
      },
      {
        id: '2',
        name: 'Instructor',
        description: 'Manages courses and students',
        permissions: ['view_students', 'manage_students', 'view_courses', 'manage_courses', 'view_competitions', 'view_reports']
      },
      {
        id: '3',
        name: 'Competition Manager',
        description: 'Manages robotics competitions',
        permissions: ['view_students', 'view_courses', 'view_instructors', 'view_competitions', 'manage_competitions', 'view_reports']
      }
    ],
    preferences: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      defaultLanguage: 'en',
      defaultCurrency: 'USD',
      sessionTimeout: 30,
      dataRetentionPeriod: 365,
      enableStudentPortal: true,
      enableParentPortal: true,
      allowPublicRegistration: false,
      requireInstructorApproval: true
    }
  };
};

export const getMockSecuritySettings = () => {
  return {
    twoFactorEnabled: false,
    loginNotifications: true,
    unusualActivityAlerts: true,
    preventMultipleSessions: false,
    sessionTimeout: 30,
    connectedDevices: [
      {
        id: '1',
        name: 'MacBook Pro',
        browser: 'Chrome',
        os: 'macOS',
        lastActive: '2023-07-15 10:30 AM',
        current: true
      },
      {
        id: '2',
        name: 'iPhone 13',
        browser: 'Safari',
        os: 'iOS',
        lastActive: '2023-07-14 08:45 PM',
        current: false
      },
      {
        id: '3',
        name: 'Surface Pro',
        browser: 'Edge',
        os: 'Windows',
        lastActive: '2023-07-10 03:22 PM',
        current: false
      }
    ],
    loginHistory: [
      {
        date: '2023-07-15',
        time: '10:30 AM',
        browser: 'Chrome',
        os: 'macOS',
        ip: '192.168.1.1',
        location: 'San Francisco, CA',
        status: 'success'
      },
      {
        date: '2023-07-14',
        time: '08:45 PM',
        browser: 'Safari',
        os: 'iOS',
        ip: '192.168.1.2',
        location: 'San Francisco, CA',
        status: 'success'
      },
      {
        date: '2023-07-10',
        time: '03:22 PM',
        browser: 'Edge',
        os: 'Windows',
        ip: '192.168.1.3',
        location: 'Los Angeles, CA',
        status: 'success'
      },
      {
        date: '2023-07-09',
        time: '11:15 AM',
        browser: 'Unknown',
        os: 'Unknown',
        ip: '203.0.113.42',
        location: 'Seattle, WA',
        status: 'failed'
      }
    ]
  };
};

export const getMockEmailTemplates = () => {
  return {
    categories: ['Student', 'Parent', 'Instructor', 'Competition', 'System'],
    templates: [
      {
        id: '1',
        name: 'Welcome Email',
        subject: 'Welcome to Robotics Education Center!',
        content: 'Dear {{name}},\n\nWelcome to Robotics Education Center! We are excited to have you join our community of young robotics enthusiasts.\n\nYour account has been successfully created and you can now log in using your email and password.\n\nIf you have any questions, please don\'t hesitate to contact us at {{contactEmail}}.\n\nBest regards,\nThe Robotics Education Center Team',
        category: 'Student',
        variables: ['name', 'contactEmail']
      },
      {
        id: '2',
        name: 'Course Enrollment Confirmation',
        subject: 'Enrollment Confirmation: {{courseName}}',
        content: 'Dear {{studentName}},\n\nThis email confirms your enrollment in {{courseName}}.\n\nDetails:\n- Start Date: {{startDate}}\n- End Date: {{endDate}}\n- Location: {{location}}\n- Instructor: {{instructorName}}\n\nPlease arrive 15 minutes before the class start time. Don\'t forget to bring your laptop and notebook.\n\nIf you need to cancel or reschedule, please contact us at least 48 hours in advance.\n\nBest regards,\nThe Robotics Education Center Team',
        category: 'Student',
        variables: ['studentName', 'courseName', 'startDate', 'endDate', 'location', 'instructorName']
      },
      {
        id: '3',
        name: 'Competition Registration',
        subject: 'Registration Confirmed: {{competitionName}}',
        content: 'Dear {{teamName}},\n\nYour registration for the {{competitionName}} has been confirmed!\n\nCompetition Details:\n- Date: {{competitionDate}}\n- Location: {{competitionLocation}}\n- Check-in Time: {{checkInTime}}\n\nPlease review the competition rules and guidelines attached to this email.\n\nGood luck and we look forward to seeing your team in action!\n\nBest regards,\nThe Robotics Education Center Team',
        category: 'Competition',
        variables: ['teamName', 'competitionName', 'competitionDate', 'competitionLocation', 'checkInTime']
      },
      {
        id: '4',
        name: 'Password Reset',
        subject: 'Password Reset Request',
        content: 'Dear {{name}},\n\nWe received a request to reset your password. Please click the link below to set a new password:\n\n{{resetLink}}\n\nIf you did not request this password reset, please ignore this email or contact support if you have concerns.\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe Robotics Education Center Team',
        category: 'System',
        variables: ['name', 'resetLink']
      },
      {
        id: '5',
        name: 'Parent Progress Report',
        subject: 'Monthly Progress Report for {{studentName}}',
        content: 'Dear {{parentName}},\n\nHere is the monthly progress report for {{studentName}}.\n\nCourse: {{courseName}}\nInstructor: {{instructorName}}\n\nProgress Overview:\n{{progressDetails}}\n\nAreas of Excellence:\n{{strengths}}\n\nAreas for Improvement:\n{{improvements}}\n\nUpcoming Projects:\n{{upcomingProjects}}\n\nIf you would like to schedule a meeting to discuss your child\'s progress, please contact us at {{contactEmail}}.\n\nBest regards,\n{{instructorName}}\nRobotics Education Center',
        category: 'Parent',
        variables: ['parentName', 'studentName', 'courseName', 'instructorName', 'progressDetails', 'strengths', 'improvements', 'upcomingProjects', 'contactEmail']
      }
    ]
  };
};

// Export the API functions as a service object
export const settingsService = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getNotificationSettings,
  updateNotificationSettings,
  getSystemSettings,
  updateSystemSettings,
  getEmailTemplates,
  updateEmailTemplate,
  deleteEmailTemplate,
  duplicateEmailTemplate,
  resetEmailTemplate,
  createEmailTemplate,
  getUserRoles,
  createUserRole,
  updateUserRole,
  deleteUserRole,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getSecuritySettings,
  updateSecuritySettings,
  enableTwoFactor,
  disableTwoFactor,
  revokeDevice,
  revokeAllDevices,
  // Mock data getters
  getMockUserProfile,
  getMockNotificationSettings,
  getMockSystemSettings,
  getMockSecuritySettings,
  getMockEmailTemplates
};
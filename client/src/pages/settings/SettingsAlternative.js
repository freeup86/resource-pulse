import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileSettingsContent from './ProfileSettingsContent';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Email as EmailIcon
} from '@mui/icons-material';

// A completely different approach that embraces the spacing
const SettingsAlternative = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use numeric index for tabs instead of string keys
  const [tabIndex, setTabIndex] = useState(0);
  
  // Settings tabs with their corresponding data
  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <PersonIcon />,
      path: '/settings/profile'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/settings/notifications'
    },
    {
      id: 'security',
      label: 'Security',
      icon: <SecurityIcon />,
      path: '/settings/security'
    },
    {
      id: 'system',
      label: 'Organization',
      icon: <BusinessIcon />,
      path: '/settings/system'
    },
    {
      id: 'email',
      label: 'Email Templates',
      icon: <EmailIcon />,
      path: '/settings/email-templates'
    }
  ];
  
  // Update tab index based on current path
  useEffect(() => {
    const path = location.pathname;
    const tabIndex = settingsTabs.findIndex(tab => path.includes(tab.id));
    if (tabIndex !== -1) {
      setTabIndex(tabIndex);
    } else {
      // Default to first tab if on base settings path
      if (path === '/settings' || path === '/settings/') {
        navigate(settingsTabs[0].path, { replace: true });
      }
    }
  }, [location.pathname, navigate, settingsTabs]);
  
  // Handle tab change
  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
    navigate(settingsTabs[newIndex].path);
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Settings
      </Typography>
      
      <Paper sx={{ 
        mb: 3, 
        borderRadius: '12px',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'
      }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 48,
              fontWeight: 500,
              fontSize: '0.875rem'
            }
          }}
        >
          {settingsTabs.map((tab) => (
            <Tab
              key={tab.id}
              label={!isMobile ? tab.label : undefined}
              icon={tab.icon}
              iconPosition="start"
              sx={{ 
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                py: 1.5,
                minWidth: isMobile ? 'auto' : 120
              }}
            />
          ))}
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Profile Settings */}
          {tabIndex === 0 && <ProfileSettingsContent />}
          
          {/* Notifications Settings */}
          {tabIndex === 1 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Notification Preferences
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage how you receive notifications from the system.
              </Typography>
            </Box>
          )}
          
          {/* Security Settings */}
          {tabIndex === 2 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Security Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your account security and authentication methods.
              </Typography>
            </Box>
          )}
          
          {/* Organization Settings */}
          {tabIndex === 3 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Organization Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure your organization's details and preferences.
              </Typography>
            </Box>
          )}
          
          {/* Email Templates */}
          {tabIndex === 4 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Email Templates
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Customize email templates used for system communications.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Section description */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: '12px',
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        mb: 3
      }}>
        <Typography variant="h6" gutterBottom>
          {tabIndex === 0 && "Profile Settings"}
          {tabIndex === 1 && "Notification Preferences"}
          {tabIndex === 2 && "Security Settings"}
          {tabIndex === 3 && "Organization Settings"}
          {tabIndex === 4 && "Email Templates"}
        </Typography>
        <Typography variant="body2">
          {tabIndex === 0 && "Your profile information is used throughout the application to personalize your experience."}
          {tabIndex === 1 && "Configure how and when you'd like to be notified about important events in the system."}
          {tabIndex === 2 && "Secure your account with authentication methods and session preferences."}
          {tabIndex === 3 && "Set up your organization's details, branding, and core configuration."}
          {tabIndex === 4 && "Customize the emails sent to users, parents, and instructors."}
        </Typography>
      </Paper>
      
      {/* Help section */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: '12px',
        backgroundColor: theme.palette.background.paper
      }}>
        <Typography variant="subtitle1" fontWeight={500} gutterBottom>
          Need Help?
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" paragraph>
          If you need assistance with settings, please contact system support or refer to the documentation below.
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap'
        }}>
          <Box sx={{ 
            p: 2, 
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: '8px',
            flex: 1,
            minWidth: '160px',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' }
          }}>
            <Typography variant="body2" fontWeight={500}>
              User Guide
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View detailed instructions
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: '8px',
            flex: 1,
            minWidth: '160px',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' }
          }}>
            <Typography variant="body2" fontWeight={500}>
              Contact Support
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get help from our team
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: '8px',
            flex: 1,
            minWidth: '160px',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' }
          }}>
            <Typography variant="body2" fontWeight={500}>
              Video Tutorials
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Watch step-by-step guides
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsAlternative;
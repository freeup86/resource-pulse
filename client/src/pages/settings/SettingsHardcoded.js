import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProfileSettingsContent from './ProfileSettingsContent';
import {
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Email as EmailIcon
} from '@mui/icons-material';

// A completely hardcoded settings page with absolutely no spacing issues
const SettingsHardcoded = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Hardcoded content mapping for demonstration
  // In a real application, you'd import all the content components
  const [activeSection, setActiveSection] = useState('profile');
  
  // Check the current path and update the active section
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/profile')) {
      setActiveSection('profile');
    } else if (path.includes('/notifications')) {
      setActiveSection('notifications');
    } else if (path.includes('/security')) {
      setActiveSection('security');
    } else if (path.includes('/system')) {
      setActiveSection('system');
    } else if (path.includes('/email-templates')) {
      setActiveSection('email');
    } else {
      // Default to profile if on base settings path
      if (path === '/settings' || path === '/settings/') {
        navigate('/settings/profile', { replace: true });
      }
    }
  }, [location.pathname, navigate]);
  
  // Helper function to check if a section is active
  const isActive = (section) => activeSection === section;
  
  const settingsSections = [
    {
      id: 'account',
      name: 'Account',
      items: [
        {
          id: 'profile',
          name: 'Profile Settings',
          path: '/settings/profile',
          icon: <PersonIcon />,
          key: 'profile'
        },
        {
          id: 'notifications',
          name: 'Notification Preferences',
          path: '/settings/notifications',
          icon: <NotificationsIcon />,
          key: 'notifications'
        },
        {
          id: 'security',
          name: 'Security',
          path: '/settings/security',
          icon: <SecurityIcon />,
          key: 'security'
        }
      ]
    },
    {
      id: 'system',
      name: 'System',
      items: [
        {
          id: 'organization',
          name: 'Organization Settings',
          path: '/settings/system',
          icon: <BusinessIcon />,
          key: 'system'
        },
        {
          id: 'email',
          name: 'Email Templates',
          path: '/settings/email-templates',
          icon: <EmailIcon />,
          key: 'email'
        }
      ]
    }
  ];

  // Render the hardcoded layout
  return (
    <div style={{
      padding: '12px', 
      boxSizing: 'border-box'
    }}>
      <Typography variant="h4" gutterBottom style={{ 
        marginBottom: '16px',
        marginLeft: '4px'
      }}>
        Settings
      </Typography>
      
      {/* ABSOLUTELY NO SPACE LAYOUT */}
      <div style={{
        display: 'flex',
        width: '100%',
        minHeight: '500px',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        {/* Left sidebar - EXACTLY 180px wide */}
        <div style={{
          width: '180px',
          flexShrink: 0,
          borderRight: '1px solid rgba(0,0,0,0.12)',
          overflowY: 'auto'
        }}>
          {settingsSections.map((section, index) => (
            <React.Fragment key={section.id}>
              <div style={{ padding: '12px 8px 4px 12px' }}>
                <Typography variant="overline" style={{ 
                  color: 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  {section.name}
                </Typography>
              </div>
              <List disablePadding dense>
                {section.items.map((item) => (
                  <ListItem
                    key={item.id}
                    button
                    component={Link}
                    to={item.path}
                    selected={isActive(item.key)}
                    style={{
                      borderLeft: isActive(item.key) ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      backgroundColor: isActive(item.key) ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                      paddingLeft: '12px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      paddingRight: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ListItemIcon style={{
                      color: isActive(item.key) ? theme.palette.primary.main : 'inherit',
                      minWidth: '32px'
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        style: {
                          fontWeight: isActive(item.key) ? 500 : 400,
                          fontSize: '0.85rem'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {index < settingsSections.length - 1 && <Divider style={{ margin: '4px 0' }} />}
            </React.Fragment>
          ))}
        </div>
        
        {/* Content area - takes remaining width */}
        <div style={{
          flex: '1',
          padding: '16px',
          overflowY: 'auto'
        }}>
          {/* Directly render the content based on active section */}
          {activeSection === 'profile' && <ProfileSettingsContent />}
          
          {/* For other sections, we'd render their respective content components */}
          {activeSection === 'notifications' && (
            <Typography variant="h5">Notification Settings</Typography>
          )}
          
          {activeSection === 'security' && (
            <Typography variant="h5">Security Settings</Typography>
          )}
          
          {activeSection === 'system' && (
            <Typography variant="h5">Organization Settings</Typography>
          )}
          
          {activeSection === 'email' && (
            <Typography variant="h5">Email Templates</Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsHardcoded;
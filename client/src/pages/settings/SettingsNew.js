import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Email as EmailIcon
} from '@mui/icons-material';

// No spacing or gaps at all - completely rigid layout
const SettingsNew = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Helper function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname === `${path}/`;
  };

  const settingsSections = [
    {
      id: 'account',
      name: 'Account',
      items: [
        {
          id: 'profile',
          name: 'Profile Settings',
          path: '/settings/profile',
          icon: <PersonIcon />
        },
        {
          id: 'notifications',
          name: 'Notification Preferences',
          path: '/settings/notifications',
          icon: <NotificationsIcon />
        },
        {
          id: 'security',
          name: 'Security',
          path: '/settings/security',
          icon: <SecurityIcon />
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
          icon: <BusinessIcon />
        },
        {
          id: 'email',
          name: 'Email Templates',
          path: '/settings/email-templates',
          icon: <EmailIcon />
        }
      ]
    }
  ];

  // Redirect to profile settings by default if on the settings index
  useEffect(() => {
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
      // We'll handle this with the JSX redirecting below instead
    }
  }, [location.pathname]);

  // This will create a completely fixed layout with NO gaps
  return (
    <div style={{ width: '100%', padding: '12px' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2, ml: 1 }}>
        Settings
      </Typography>

      {/* Main container - using a CSS Grid layout with fixed columns */}
      <div style={{ 
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: '200px 1fr',
        gridGap: '0',
        boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
        borderRadius: '4px',
        overflow: 'hidden' // Ensure nothing leaks out
      }}>
        {/* Left Navigation - absolutely positioned with fixed width */}
        <div style={{ 
          background: '#fff',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          height: isMobile ? 'auto' : '100%',
          marginBottom: isMobile ? '16px' : 0
        }}>
          {settingsSections.map((section, index) => (
            <React.Fragment key={section.id}>
              <div style={{ padding: '12px 12px 4px 12px' }}>
                <Typography variant="overline" color="textSecondary">
                  {section.name}
                </Typography>
              </div>
              <List dense disablePadding>
                {section.items.map((item) => (
                  <ListItem
                    key={item.id}
                    button
                    component={Link}
                    to={item.path}
                    selected={isActive(item.path)}
                    sx={{
                      borderLeft: isActive(item.path) ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      pl: 1.5,
                      py: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{
                      color: isActive(item.path) ? 'primary.main' : 'inherit',
                      minWidth: 32,
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.2rem'
                      }
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        fontWeight: isActive(item.path) ? 500 : 400,
                        fontSize: '0.875rem'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {index < settingsSections.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
        
        {/* Content Area - takes up remaining width with padding */}
        <div style={{ 
          background: '#fff',
          padding: '16px',
          minHeight: '400px'
        }}>
          {location.pathname === '/settings' || location.pathname === '/settings/' ? (
            <Navigate to="/settings/profile" replace />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsNew;
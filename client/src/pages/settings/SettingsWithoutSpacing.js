import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Email as EmailIcon
} from '@mui/icons-material';

// A component that works with the main layout's padding
const SettingsWithoutSpacing = () => {
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

  // Important: we need to offset the padding from the main layout
  useEffect(() => {
    // Create a style element to override the main layout padding
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Negative margin to counteract the main layout padding */
      .settings-wrapper {
        margin: -24px !important;
      }
      
      /* On mobile, respect some padding */
      @media (max-width: 899px) {
        .settings-wrapper {
          margin: -24px -24px 0 -24px !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    // This wrapper with the custom class is important to counteract the main layout padding
    <Box className="settings-wrapper">
      {/* We set the header outside the paper container */}
      <Box sx={{ px: 3, pt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
      </Box>
      
      {/* Main content in a flex container */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: { md: 'calc(100vh - 140px)' },
        overflow: 'hidden'
      }}>
        {/* Left navigation */}
        <Paper sx={{ 
          width: { xs: '100%', md: '200px' },
          borderRadius: 0,
          boxShadow: 'none',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          {settingsSections.map((section, index) => (
            <React.Fragment key={section.id}>
              <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
                <Typography 
                  variant="overline" 
                  color="text.secondary" 
                  id={`${section.id}-header`}
                >
                  {section.name}
                </Typography>
              </Box>
              <List component="nav" dense disablePadding>
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
                        fontSize: '0.85rem'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {index < settingsSections.length - 1 && <Divider sx={{ mt: 1, mb: 1 }} />}
            </React.Fragment>
          ))}
        </Paper>
        
        {/* Content area */}
        <Paper sx={{ 
          flex: 1,
          borderRadius: 0,
          boxShadow: 'none',
          p: 3,
          overflowY: 'auto'
        }}>
          {location.pathname === '/settings' || location.pathname === '/settings/' ? (
            <Navigate to="/settings/profile" replace />
          ) : (
            <Outlet />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default SettingsWithoutSpacing;
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
  Grid,
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

const Settings = () => {
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
      // We'll handle this with the JSX redirecting below instead of a useEffect
    }
  }, [location.pathname]);

  return (
    <Box sx={{ p: { xs: 2, md: 1.5 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1.5, ml: 0.5 }}>
        Settings
      </Typography>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 0 } // Zero gap on desktop
      }}>
        {/* Settings Navigation */}
        <Box sx={{
          flex: { md: '0 0 220px' },
          width: { xs: '100%', md: '220px' },
          mb: { xs: 2, md: 0 },
          mr: { md: 0 }
        }}>
          <Paper sx={{
            width: '100%',
            borderTopRightRadius: { md: 0 },
            borderBottomRightRadius: { md: 0 }
          }}>
            {settingsSections.map((section, index) => (
              <React.Fragment key={section.id}>
                <List
                  component="nav"
                  dense
                  disablePadding
                  aria-labelledby={`${section.id}-header`}
                  subheader={
                    <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
                      <Typography variant="overline" color="text.secondary" id={`${section.id}-header`}>
                        {section.name}
                      </Typography>
                    </Box>
                  }
                >
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
                        fontSize: '0.85rem',
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
                {index < settingsSections.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Paper>
        </Box>

        {/* Settings Content */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{
            p: { xs: 2, sm: 3 },
            minHeight: 400,
            borderTopLeftRadius: { md: 0 },
            borderBottomLeftRadius: { md: 0 },
            borderLeft: { md: '1px solid rgba(0, 0, 0, 0.12)' } // Add a border between sidebar and content
          }}>
            {location.pathname === '/settings' || location.pathname === '/settings/' ? (
              <Navigate to="/settings/profile" replace />
            ) : (
              <Outlet />
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
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

// Most basic stripped down layout with NO possibility of gaps
const SettingsFinal = () => {
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

  // Return redirect JSX for redirecting from index page
  const renderRedirect = () => {
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
      return <Navigate to="/settings/profile" replace />;
    }
    return <Outlet />;
  };
  
  // Mobile view is a stacked layout
  if (isMobile) {
    return (
      <div style={{ padding: "12px" }}>
        <Typography variant="h4" gutterBottom style={{ marginBottom: '16px' }}>
          Settings
        </Typography>
        
        <div style={{ 
          marginBottom: '16px',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          borderRadius: '4px',
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
                    style={{
                      borderLeft: isActive(item.path) ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      paddingLeft: '12px',
                      paddingTop: '4px',
                      paddingBottom: '4px'
                    }}
                  >
                    <ListItemIcon style={{
                      color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                      minWidth: '32px'
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        style: {
                          fontWeight: isActive(item.path) ? 500 : 400,
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {index < settingsSections.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
        
        <div style={{ 
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          borderRadius: '4px',
          padding: '16px',
          minHeight: '400px'
        }}>
          {renderRedirect()}
        </div>
      </div>
    );
  }
  
  // Desktop view - hard-coded two-column layout with NO GAPS
  return (
    <div style={{ padding: "12px" }}>
      <Typography variant="h4" gutterBottom style={{ marginBottom: '16px' }}>
        Settings
      </Typography>
      
      {/* Zero-gap, zero-space, fused layout */}
      <table cellSpacing="0" cellPadding="0" style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <tbody>
          <tr>
            {/* Sidebar - fixed width */}
            <td style={{ 
              width: '200px', 
              backgroundColor: '#fff',
              verticalAlign: 'top',
              borderRight: '1px solid rgba(0,0,0,0.12)'
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
                        style={{
                          borderLeft: isActive(item.path) ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                          paddingLeft: '12px',
                          paddingTop: '4px',
                          paddingBottom: '4px'
                        }}
                      >
                        <ListItemIcon style={{
                          color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                          minWidth: '32px'
                        }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          primaryTypographyProps={{
                            style: {
                              fontWeight: isActive(item.path) ? 500 : 400,
                              fontSize: '0.875rem'
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  {index < settingsSections.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </td>
            
            {/* Content - takes remaining width */}
            <td style={{ 
              backgroundColor: '#fff',
              verticalAlign: 'top',
              padding: '16px'
            }}>
              {renderRedirect()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SettingsFinal;
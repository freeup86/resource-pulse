import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileSettingsContent from './ProfileSettingsContent';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Email as EmailIcon
} from '@mui/icons-material';

// Most extreme approach with direct DOM manipulation
const FixedWidthSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  
  // Very important - inject a style tag to override any Material-UI spacing
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      /* Target any Material-UI containers or spacing that might be causing issues */
      .MuiContainer-root {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      .MuiGrid-container {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      .MuiGrid-item {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      /* Override any other spacing */
      .MuiBox-root {
        padding: 0 !important;
        margin: 0 !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
  
  // Check the current path and update the active section
  useEffect(() => {
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

  // Handle navigation
  const handleNavClick = (section) => {
    setActiveSection(section.key);
    navigate(section.path);
  };

  // Settings navigation items
  const settingsSections = [
    {
      id: 'account',
      name: 'Account',
      items: [
        {
          id: 'profile',
          name: 'Profile Settings',
          path: '/settings/profile',
          icon: <PersonIcon style={{ fontSize: '18px' }} />,
          key: 'profile'
        },
        {
          id: 'notifications',
          name: 'Notification Preferences',
          path: '/settings/notifications',
          icon: <NotificationsIcon style={{ fontSize: '18px' }} />,
          key: 'notifications'
        },
        {
          id: 'security',
          name: 'Security',
          path: '/settings/security',
          icon: <SecurityIcon style={{ fontSize: '18px' }} />,
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
          icon: <BusinessIcon style={{ fontSize: '18px' }} />,
          key: 'system'
        },
        {
          id: 'email',
          name: 'Email Templates',
          path: '/settings/email-templates',
          icon: <EmailIcon style={{ fontSize: '18px' }} />,
          key: 'email'
        }
      ]
    }
  ];

  // Helper function for navigation items  
  const renderNavItems = (section) => {
    return section.items.map(item => (
      <div 
        key={item.id}
        onClick={() => handleNavClick(item)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 10px',
          cursor: 'pointer',
          backgroundColor: activeSection === item.key ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
          borderLeft: activeSection === item.key ? '3px solid #1976d2' : '3px solid transparent',
        }}
      >
        <div style={{ 
          minWidth: '28px', 
          display: 'flex', 
          alignItems: 'center',
          color: activeSection === item.key ? '#1976d2' : 'inherit'
        }}>
          {item.icon}
        </div>
        <div style={{ 
          fontSize: '0.85rem',
          fontWeight: activeSection === item.key ? 500 : 400
        }}>
          {item.name}
        </div>
      </div>
    ));
  };

  return (
    <div className="settings-container-wrapper" style={{ padding: '16px' }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginTop: 0, 
        marginBottom: '16px',
        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
        fontWeight: 400
      }}>
        Settings
      </h1>
      
      {/* Main container with zero-gap layout */}
      <div style={{ 
        display: 'flex',
        width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
        {/* Sidebar - Absolutely positioned */}
        <div style={{
          width: '180px',
          flexShrink: 0,
          borderRight: '1px solid rgba(0,0,0,0.12)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '8px',
          paddingBottom: '8px'
        }}>
          {settingsSections.map((section, index) => (
            <div key={section.id}>
              <div style={{ 
                padding: '8px 16px 4px 16px',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.08333em',
                textTransform: 'uppercase',
                color: 'rgba(0, 0, 0, 0.6)',
                fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
              }}>
                {section.name}
              </div>
              {renderNavItems(section)}
              {index < settingsSections.length - 1 && (
                <div style={{
                  borderBottom: '1px solid rgba(0,0,0,0.12)',
                  margin: '4px 0'
                }} />
              )}
            </div>
          ))}
        </div>
        
        {/* Content area */}
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto'
        }}>
          {/* Only render ProfileSettingsContent for now as an example */}
          {activeSection === 'profile' && <ProfileSettingsContent />}
          
          {/* Placeholder content for other sections */}
          {activeSection === 'notifications' && (
            <h2 style={{
              fontSize: '1.5rem',
              fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
              fontWeight: 400
            }}>Notification Preferences</h2>
          )}
          
          {activeSection === 'security' && (
            <h2 style={{
              fontSize: '1.5rem',
              fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
              fontWeight: 400
            }}>Security Settings</h2>
          )}
          
          {activeSection === 'system' && (
            <h2 style={{
              fontSize: '1.5rem',
              fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
              fontWeight: 400
            }}>Organization Settings</h2>
          )}
          
          {activeSection === 'email' && (
            <h2 style={{
              fontSize: '1.5rem',
              fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
              fontWeight: 400
            }}>Email Templates</h2>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedWidthSettings;
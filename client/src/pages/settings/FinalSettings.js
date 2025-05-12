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
import './FinalSettings.css'; // Import CSS file with !important styles

// Component with hard-coded structure and forceful styling
const FinalSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  
  // Update active section based on current route
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

  // Navigate on menu item click
  const handleNavClick = (sectionKey, path) => {
    setActiveSection(sectionKey);
    navigate(path);
  };

  // Settings navigation data
  const settingsSections = [
    {
      id: 'account',
      name: 'Account',
      items: [
        {
          id: 'profile',
          name: 'Profile Settings',
          path: '/settings/profile',
          icon: <PersonIcon style={{ fontSize: '20px' }} />,
          key: 'profile'
        },
        {
          id: 'notifications',
          name: 'Notification Preferences',
          path: '/settings/notifications',
          icon: <NotificationsIcon style={{ fontSize: '20px' }} />,
          key: 'notifications'
        },
        {
          id: 'security',
          name: 'Security',
          path: '/settings/security',
          icon: <SecurityIcon style={{ fontSize: '20px' }} />,
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
          icon: <BusinessIcon style={{ fontSize: '20px' }} />,
          key: 'system'
        },
        {
          id: 'email',
          name: 'Email Templates',
          path: '/settings/email-templates',
          icon: <EmailIcon style={{ fontSize: '20px' }} />,
          key: 'email'
        }
      ]
    }
  ];

  return (
    <div className="final-settings-container">
      <h1 className="final-settings-header">Settings</h1>
      
      <div className="final-settings-layout">
        {/* Sidebar navigation */}
        <div className="final-settings-sidebar">
          {settingsSections.map((section, sectionIndex) => (
            <React.Fragment key={section.id}>
              <div className="final-settings-section-header">
                {section.name}
              </div>
              
              {section.items.map(item => (
                <div 
                  key={item.id}
                  className={`final-settings-nav-item ${activeSection === item.key ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.key, item.path)}
                >
                  <div className="final-settings-nav-icon">
                    {item.icon}
                  </div>
                  <div className="final-settings-nav-text">
                    {item.name}
                  </div>
                </div>
              ))}
              
              {sectionIndex < settingsSections.length - 1 && (
                <div className="final-settings-divider" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Content area */}
        <div className="final-settings-content">
          {/* Only show profile content for now */}
          {activeSection === 'profile' && <ProfileSettingsContent />}
          
          {/* Placeholders for other sections */}
          {activeSection === 'notifications' && (
            <h2>Notification Preferences</h2>
          )}
          
          {activeSection === 'security' && (
            <h2>Security Settings</h2>
          )}
          
          {activeSection === 'system' && (
            <h2>Organization Settings</h2>
          )}
          
          {activeSection === 'email' && (
            <h2>Email Templates</h2>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalSettings;
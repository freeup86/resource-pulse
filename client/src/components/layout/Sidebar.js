import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Toolbar,
  Box,
  useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import EventIcon from '@mui/icons-material/Event';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import BuildIcon from '@mui/icons-material/Build';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

// Sidebar width
const drawerWidth = 240;

function Sidebar({ open, onClose, variant }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Navigation items with role-based access control
  const navItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      roles: ['admin', 'instructor', 'parent', 'school_admin'] 
    },
    { 
      text: 'Students', 
      icon: <PeopleIcon />, 
      path: '/students',
      roles: ['admin', 'instructor', 'parent'] 
    },
    { 
      text: 'Parents', 
      icon: <FamilyRestroomIcon />, 
      path: '/parents',
      roles: ['admin', 'instructor'] 
    },
    { 
      text: 'Schools', 
      icon: <SchoolIcon />, 
      path: '/schools',
      roles: ['admin', 'instructor', 'school_admin'] 
    },
    { 
      text: 'Courses', 
      icon: <ClassIcon />, 
      path: '/courses',
      roles: ['admin', 'instructor', 'parent', 'school_admin'] 
    },
    { 
      text: 'Sessions', 
      icon: <EventIcon />, 
      path: '/sessions',
      roles: ['admin', 'instructor', 'parent', 'school_admin'] 
    },
    { 
      text: 'Enrollments', 
      icon: <HowToRegIcon />, 
      path: '/enrollments',
      roles: ['admin', 'instructor', 'parent'] 
    },
    { 
      text: 'Equipment', 
      icon: <BuildIcon />, 
      path: '/equipment',
      roles: ['admin', 'instructor'] 
    },
    { 
      text: 'Instructors', 
      icon: <PersonIcon />, 
      path: '/instructors',
      roles: ['admin', 'school_admin'] 
    },
    { 
      text: 'Competitions', 
      icon: <EmojiEventsIcon />, 
      path: '/competitions',
      roles: ['admin', 'instructor', 'parent', 'school_admin'] 
    },
    { 
      text: 'Reports', 
      icon: <AssessmentIcon />, 
      path: '/reports',
      roles: ['admin', 'instructor'] 
    },
    { 
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/settings',
      roles: ['admin'] 
    },
  ];
  
  // Filter items based on user role
  const filteredNavItems = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  );
  
  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar /> {/* Spacer to account for app bar */}
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {filteredNavItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname.startsWith(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light + '30',
                    },
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: location.pathname.startsWith(item.path) 
                      ? theme.palette.primary.main 
                      : 'inherit'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: location.pathname.startsWith(item.path) ? 500 : 400,
                    color: location.pathname.startsWith(item.path) 
                      ? theme.palette.primary.main 
                      : 'inherit'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
}

export default Sidebar;
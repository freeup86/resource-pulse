import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Header sidebarOpen={sidebarOpen} onSidebarToggle={handleSidebarToggle} />
      <Sidebar 
        open={sidebarOpen} 
        onClose={handleSidebarClose} 
        variant={isMobile ? 'temporary' : 'persistent'} 
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          pt: 8, // Account for fixed header height
          px: 3,
          pb: 3,
          width: '100%',
          [theme.breakpoints.up('md')]: {
            ml: sidebarOpen ? '240px' : 0,
            width: sidebarOpen ? 'calc(100% - 240px)' : '100%',
            transition: theme.transitions.create(['width', 'margin-left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
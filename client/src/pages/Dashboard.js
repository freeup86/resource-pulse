import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Mock data for demonstration
const mockData = {
  stats: {
    students: 127,
    activeCourses: 14,
    upcomingSessions: 25,
    schoolPartnerships: 8,
    availableEquipment: 42
  },
  upcomingSessions: [
    { id: 1, name: 'Robotics 101', time: '10:00 AM - 12:00 PM', date: '2023-06-12', location: 'Main Lab', instructor: 'John Smith' },
    { id: 2, name: 'Advanced Programming', time: '2:00 PM - 4:00 PM', date: '2023-06-12', location: 'Computer Lab', instructor: 'Sarah Johnson' },
    { id: 3, name: 'Competition Prep', time: '3:30 PM - 5:30 PM', date: '2023-06-13', location: 'Main Lab', instructor: 'Michael Brown' },
    { id: 4, name: 'Robotics for Beginners', time: '9:00 AM - 11:00 AM', date: '2023-06-14', location: 'Eastside Elementary', instructor: 'John Smith' },
  ],
  recentStudents: [
    { id: 1, name: 'Alex Johnson', age: 10, class: 'Robotics 101', skillLevel: 'Beginner' },
    { id: 2, name: 'Zoe Williams', age: 12, class: 'Advanced Programming', skillLevel: 'Intermediate' },
    { id: 3, name: 'Ethan Davis', age: 15, class: 'Competition Prep', skillLevel: 'Advanced' },
    { id: 4, name: 'Maya Rodriguez', age: 9, class: 'Robotics for Beginners', skillLevel: 'Beginner' },
  ],
  inventoryAlerts: [
    { id: 1, name: 'EV3 Core Set', status: 'Low Stock', count: 3 },
    { id: 2, name: 'Raspberry Pi 4', status: 'Maintenance Required', count: 5 },
    { id: 3, name: 'Arduino Starter Kit', status: 'Low Stock', count: 2 },
  ]
};

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchDashboardData = async () => {
    // In a real application, this would fetch data from the API
    setLoading(true);
    try {
      // For demonstration, we'll just simulate an API call
      // const response = await axios.get('/api/dashboard');
      // setData(response.data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(mockData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading && <LinearProgress sx={{ mb: 3 }} />}
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              height: '100%'
            }}
            elevation={2}
          >
            <PeopleIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" component="div">
              {data.stats.students}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Students
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              height: '100%'
            }}
            elevation={2}
          >
            <ClassIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" component="div">
              {data.stats.activeCourses}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Active Courses
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              height: '100%'
            }}
            elevation={2}
          >
            <EventIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" component="div">
              {data.stats.upcomingSessions}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Upcoming Sessions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              height: '100%'
            }}
            elevation={2}
          >
            <SchoolIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" component="div">
              {data.stats.schoolPartnerships}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              School Partnerships
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              height: '100%'
            }}
            elevation={2}
          >
            <BuildIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" component="div">
              {data.stats.availableEquipment}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Available Equipment
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Detail Widgets */}
      <Grid container spacing={3}>
        {/* Upcoming Sessions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Upcoming Sessions"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <List>
                {data.upcomingSessions.map((session) => (
                  <React.Fragment key={session.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={session.name}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="textPrimary"
                            >
                              {session.date} • {session.time}
                            </Typography>
                            <br />
                            {session.location} • Instructor: {session.instructor}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                  color="primary" 
                  onClick={() => navigate('/sessions')}
                >
                  View All Sessions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Students & Inventory Alerts Combined */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            {/* Recent Students */}
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Recent Students"
                  action={
                    <IconButton aria-label="settings">
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent sx={{ pt: 0 }}>
                  <List>
                    {data.recentStudents.map((student) => (
                      <React.Fragment key={student.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={student.name}
                            secondary={
                              <React.Fragment>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="textPrimary"
                                >
                                  Age: {student.age} • {student.class}
                                </Typography>
                                <br />
                                <Chip 
                                  label={student.skillLevel} 
                                  size="small" 
                                  color={
                                    student.skillLevel === 'Beginner' ? 'success' :
                                    student.skillLevel === 'Intermediate' ? 'primary' :
                                    'secondary'
                                  }
                                  sx={{ mt: 0.5 }}
                                />
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button 
                      color="primary" 
                      onClick={() => navigate('/students')}
                    >
                      View All Students
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Inventory Alerts */}
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Inventory Alerts"
                  action={
                    <IconButton aria-label="settings">
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent sx={{ pt: 0 }}>
                  <List>
                    {data.inventoryAlerts.map((item) => (
                      <React.Fragment key={item.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={item.name}
                            secondary={
                              <React.Fragment>
                                <Chip 
                                  label={item.status} 
                                  size="small" 
                                  color={
                                    item.status === 'Low Stock' ? 'warning' :
                                    item.status === 'Maintenance Required' ? 'error' :
                                    'info'
                                  }
                                  sx={{ mt: 0.5 }}
                                />
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="textPrimary"
                                  sx={{ ml: 1 }}
                                >
                                  Count: {item.count}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button 
                      color="primary" 
                      onClick={() => navigate('/equipment')}
                    >
                      View All Equipment
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
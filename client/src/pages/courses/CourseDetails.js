import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
  ChildCare as ChildCareIcon,
  Construction as ConstructionIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';
import { getCourseById, getCourseSchedule, mockCourses } from '../../services/courseService';
import { mockSessions } from '../../services/sessionService';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        // In a real app, these would be API calls
        // const courseResponse = await getCourseById(id);
        // const sessionsResponse = await getCourseSchedule(id);
        
        // For demonstration, we're using mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        const foundCourse = mockCourses.find(c => c.id === id);
        if (!foundCourse) {
          throw new Error('Course not found');
        }
        
        const courseSessions = mockSessions.filter(s => s.courseId === id);
        
        setCourse(foundCourse);
        setSessions(courseSessions);
        setError(null);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Failed to load course details. Course may not exist or there was a network error.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  const getSkillLevelColor = (skillLevel) => {
    switch (skillLevel.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'primary';
      case 'advanced':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'upcoming':
      case 'registration open':
        return 'primary';
      case 'full':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body1">Loading course details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/courses')}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Course not found
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/courses')}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/courses')}
          sx={{ mb: 2 }}
        >
          Back to Courses
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {course.title}
          </Typography>
          <Box>
            <Tooltip title="Edit Course">
              <IconButton
                color="primary"
                onClick={() => navigate(`/courses/edit/${course.id}`)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Chip 
          label={course.skillLevel} 
          color={getSkillLevelColor(course.skillLevel)} 
          sx={{ mr: 1 }} 
        />
        <Chip 
          label={`Ages ${course.ageRange}`} 
          variant="outlined"
          icon={<ChildCareIcon />}
        />
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {course.description}
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Curriculum
            </Typography>
            <List dense>
              {course.curriculum.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Available Sessions
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddCircleIcon />}
                onClick={() => navigate(`/sessions/add?courseId=${course.id}`)}
              >
                Add Session
              </Button>
            </Box>
            
            {sessions.length === 0 ? (
              <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary" align="center">
                  No sessions scheduled for this course.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table aria-label="sessions table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Schedule</TableCell>
                      <TableCell>Dates</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Instructor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Enrollment</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow hover key={session.id}>
                        <TableCell>{session.schedule}</TableCell>
                        <TableCell>
                          {new Date(session.startDate).toLocaleDateString()} - 
                          {new Date(session.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{session.location}</TableCell>
                        <TableCell>{session.instructor.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={session.status}
                            size="small"
                            color={getStatusColor(session.status)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {session.enrollmentCount}/{session.maxCapacity}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => navigate(`/sessions/${session.id}`)}
                          >
                            <Tooltip title="View Details">
                              <EditIcon fontSize="small" />
                            </Tooltip>
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Duration" 
                    secondary={course.duration} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ChildCareIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Age Range" 
                    secondary={course.ageRange} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CategoryIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Skill Level" 
                    secondary={course.skillLevel} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Maximum Capacity" 
                    secondary={course.maxCapacity} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AttachMoneyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Price" 
                    secondary={`$${course.price.toFixed(2)}`} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Materials & Resources
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Required Materials:</strong>
              </Typography>
              <Typography variant="body2" paragraph>
                {course.materials}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/sessions/add?courseId=${course.id}`)}
                  startIcon={<EventIcon />}
                >
                  Create New Session
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CourseDetails;
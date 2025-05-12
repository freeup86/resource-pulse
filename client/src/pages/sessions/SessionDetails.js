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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
import { getSessionById, getSessionEnrollments, mockSessions } from '../../services/sessionService';
import { mockCourses } from '../../services/courseService';

// Mock student enrollments data
const mockEnrollments = [
  {
    id: '1',
    student: {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      age: 12,
      grade: '7th',
      school: 'Eastside Middle School',
    },
    enrollmentDate: '2023-09-20',
    status: 'Active',
    attendanceRecord: [
      { date: '2023-10-05', status: 'Present' },
      { date: '2023-10-12', status: 'Present' },
      { date: '2023-10-19', status: 'Absent' },
      { date: '2023-10-26', status: 'Present' },
    ]
  },
  {
    id: '2',
    student: {
      id: '2',
      name: 'Maya Rodriguez',
      email: 'maya.r@example.com',
      age: 10,
      grade: '5th',
      school: 'Lincoln Elementary',
    },
    enrollmentDate: '2023-09-22',
    status: 'Active',
    attendanceRecord: [
      { date: '2023-10-05', status: 'Present' },
      { date: '2023-10-12', status: 'Present' },
      { date: '2023-10-19', status: 'Present' },
      { date: '2023-10-26', status: 'Present' },
    ]
  },
  {
    id: '3',
    student: {
      id: '3',
      name: 'Ethan Davis',
      email: 'ethan.d@example.com',
      age: 15,
      grade: '10th',
      school: 'Westside High School',
    },
    enrollmentDate: '2023-09-18',
    status: 'Active',
    attendanceRecord: [
      { date: '2023-10-05', status: 'Present' },
      { date: '2023-10-12', status: 'Absent' },
      { date: '2023-10-19', status: 'Present' },
      { date: '2023-10-26', status: 'Present' },
    ]
  },
  {
    id: '4',
    student: {
      id: '4',
      name: 'Zoe Williams',
      email: 'zoe.w@example.com',
      age: 13,
      grade: '8th',
      school: 'Eastside Middle School',
    },
    enrollmentDate: '2023-09-25',
    status: 'Waitlisted',
    attendanceRecord: []
  },
];

const SessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      setLoading(true);
      try {
        // In a real app, these would be API calls
        // const sessionResponse = await getSessionById(id);
        // const enrollmentsResponse = await getSessionEnrollments(id);
        
        // For demonstration, we're using mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        const foundSession = mockSessions.find(s => s.id === id);
        if (!foundSession) {
          throw new Error('Session not found');
        }
        
        const foundCourse = mockCourses.find(c => c.id === foundSession.courseId);
        
        setSession(foundSession);
        setCourse(foundCourse);
        setEnrollments(mockEnrollments);
        setError(null);
      } catch (err) {
        console.error('Error fetching session details:', err);
        setError('Failed to load session details. Session may not exist or there was a network error.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [id]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      // In a real app, this would call the API
      // await deleteSession(id);
      navigate('/sessions');
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session. Please try again.');
      setDeleteDialogOpen(false);
    }
  };

  // Toggle instructor dialog
  const toggleInstructorDialog = () => {
    setInstructorDialogOpen(!instructorDialogOpen);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body1">Loading session details...</Typography>
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
          onClick={() => navigate('/sessions')}
        >
          Back to Sessions
        </Button>
      </Container>
    );
  }

  if (!session || !course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Session not found
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sessions')}
        >
          Back to Sessions
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
          onClick={() => navigate('/sessions')}
          sx={{ mb: 2 }}
        >
          Back to Sessions
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {session.courseTitle}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Session: {formatDate(session.startDate)} to {formatDate(session.endDate)}
            </Typography>
            <Chip 
              label={session.status} 
              color={getStatusColor(session.status)} 
              sx={{ mr: 1 }} 
            />
          </Box>
          <Box>
            <Tooltip title="Edit Session">
              <IconButton
                color="primary"
                onClick={() => navigate(`/sessions/edit/${session.id}`)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Session">
              <IconButton
                color="error"
                onClick={handleDeleteClick}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Session Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Dates:</strong> {formatDate(session.startDate)} - {formatDate(session.endDate)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Schedule:</strong> {session.schedule}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Location:</strong> {session.location}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Instructor:</strong>{' '}
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={toggleInstructorDialog}
                      sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontWeight: 'normal' }}
                    >
                      {session.instructor.name} <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5 }} />
                    </Button>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GroupIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Enrollment:</strong> {session.enrollmentCount}/{session.maxCapacity}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <AssignmentIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="body1">
                      <strong>Materials:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {session.materials}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            {session.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Notes:
                </Typography>
                <Typography variant="body2" paragraph>
                  {session.notes}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                component={Link}
                to={`/courses/${session.courseId}`}
                startIcon={<SchoolIcon />}
              >
                View Course Details
              </Button>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Enrollments ({enrollments.length})
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/students?addToSession=${session.id}`)}
              >
                Add Student
              </Button>
            </Box>
            
            {enrollments.length === 0 ? (
              <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <GroupIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary" align="center">
                  No students enrolled in this session yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table aria-label="enrollments table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>School</TableCell>
                      <TableCell>Date Enrolled</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Attendance</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow hover key={enrollment.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {enrollment.student.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {enrollment.student.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {enrollment.student.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{enrollment.student.grade}</TableCell>
                        <TableCell>{enrollment.student.school}</TableCell>
                        <TableCell>{formatDate(enrollment.enrollmentDate)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={enrollment.status}
                            size="small"
                            color={enrollment.status === 'Active' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {enrollment.attendanceRecord.length > 0 ? (
                            <Typography variant="body2">
                              {enrollment.attendanceRecord.filter(r => r.status === 'Present').length}/{enrollment.attendanceRecord.length} classes
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Student">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/students/${enrollment.student.id}`)}
                            >
                              <PersonIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
                Course Information
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Course Title:</strong> {course.title}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Age Range:</strong> {course.ageRange}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Skill Level:</strong> {course.skillLevel}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Price:</strong> ${course.price.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Description:</strong>
              </Typography>
              <Typography variant="body2" paragraph>
                {course.description}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(`/sessions/edit/${session.id}`)}
                  startIcon={<EditIcon />}
                >
                  Edit Session
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Overview
              </Typography>
              {enrollments.length > 0 ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Session Progress
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={30} 
                      sx={{ height: 10, borderRadius: 5 }} 
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      {session.status === 'Completed' ? 'Completed' : '3 of 10 sessions completed'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Next Session
                    </Typography>
                    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2">
                        Thursday, November 2, 2023
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        4:00 PM - 5:30 PM
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.location}
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <GroupIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" align="center">
                    No attendance data available yet.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/students?addToSession=${session.id}`)}
                  >
                    Add Students to Track Attendance
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this session? This action cannot be undone,
            and it will remove all student enrollments for this session.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Instructor details dialog */}
      <Dialog
        open={instructorDialogOpen}
        onClose={toggleInstructorDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Instructor Information
          <IconButton
            aria-label="close"
            onClick={toggleInstructorDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Avatar 
                sx={{ width: 100, height: 100, mx: 'auto', bgcolor: 'primary.main', fontSize: 40 }}
              >
                {session.instructor.name.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography variant="h6">{session.instructor.name}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {session.instructor.specialization}
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText primary={session.instructor.email} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText primary={session.instructor.phone} />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Bio
              </Typography>
              <Typography variant="body2" paragraph>
                {session.instructor.bio}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleInstructorDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SessionDetails;
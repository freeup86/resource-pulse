import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Tab,
  Dialog,
  DialogTitle,
  Tabs,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Today as TodayIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';
import { getInstructorById, deleteInstructor } from '../../services/instructorService';

// Mock instructor data (would be from API in production)
const mockInstructorDetails = {
  id: '1',
  firstName: 'Michael',
  lastName: 'Chang',
  email: 'michael.c@example.com',
  phone: '(555) 111-2222',
  bio: 'Robotics engineer with 8 years of experience. Specializes in competition robotics and programming. Michael has led teams to regional and national championships and enjoys teaching students of all skill levels. He is particularly passionate about helping students develop problem-solving skills through robotics challenges.',
  profileImage: null,
  skills: ['Programming', 'Electronics', 'Competition Robotics', 'Arduino', 'Python', 'Mechanical Design', 'Computer Vision', 'Sensors'],
  certifications: [
    { id: '1', name: 'Certified Robotics Instructor', issuer: 'National Robotics Association', date: '2020-05-15', expirationDate: '2023-05-15', description: 'Comprehensive certification covering robotics education best practices' },
    { id: '2', name: 'Python Programming', issuer: 'Code Academy', date: '2019-03-10', expirationDate: null, description: 'Advanced Python programming certification' },
    { id: '3', name: 'Arduino Master', issuer: 'Arduino Foundation', date: '2018-11-22', expirationDate: null, description: 'Expertise in Arduino programming and hardware integration' },
    { id: '4', name: 'First Robotics Competition Mentor', issuer: 'FIRST', date: '2021-01-15', expirationDate: '2023-01-15', description: 'Certified mentor for FRC teams' }
  ],
  teachableCourses: ['Robotics 101', 'Advanced Programming', 'Competition Prep', 'Arduino Workshop', 'Python for Robotics', 'Sensor Integration'],
  availability: {
    monday: ['afternoon', 'evening'],
    tuesday: ['afternoon', 'evening'],
    wednesday: ['evening'],
    thursday: ['afternoon', 'evening'],
    friday: ['afternoon'],
    saturday: ['morning', 'afternoon'],
    sunday: []
  },
  schedule: [
    { id: '1', courseId: '1', courseName: 'Robotics 101', startDate: '2023-09-05', endDate: '2023-12-15', dayOfWeek: 'Monday', startTime: '16:00', endTime: '18:00', location: 'Main Lab', studentsCount: 12 },
    { id: '2', courseId: '3', courseName: 'Competition Prep', startDate: '2023-09-06', endDate: '2023-12-16', dayOfWeek: 'Thursday', startTime: '16:00', endTime: '18:00', location: 'Competition Arena', studentsCount: 8 },
    { id: '3', courseId: '5', courseName: 'Python for Robotics', startDate: '2023-09-09', endDate: '2023-12-16', dayOfWeek: 'Saturday', startTime: '10:00', endTime: '12:00', location: 'Computer Lab', studentsCount: 10 }
  ],
  pastCourses: [
    { id: '4', courseId: '1', courseName: 'Robotics 101', startDate: '2023-01-10', endDate: '2023-05-15', dayOfWeek: 'Monday', rating: 4.8, studentsCount: 14 },
    { id: '5', courseId: '2', courseName: 'Arduino Workshop', startDate: '2023-01-12', endDate: '2023-05-18', dayOfWeek: 'Thursday', rating: 4.9, studentsCount: 12 },
    { id: '6', courseId: '3', courseName: 'Competition Prep', startDate: '2023-02-04', endDate: '2023-06-10', dayOfWeek: 'Saturday', rating: 4.7, studentsCount: 8 }
  ],
  rating: 4.8,
  reviews: [
    { id: '1', studentName: 'Alex Johnson', date: '2023-05-20', rating: 5, comment: 'Mr. Chang is an excellent teacher who makes complex concepts easy to understand.' },
    { id: '2', studentName: 'Maya Rodriguez', date: '2023-05-18', rating: 5, comment: 'My son learned so much in his class. The hands-on approach really helped him stay engaged.' },
    { id: '3', studentName: 'Ethan Davis', date: '2023-05-15', rating: 4, comment: 'Very knowledgeable instructor. Sometimes moves a bit fast but always willing to help outside of class.' }
  ],
  education: [
    { degree: 'M.S. in Robotics Engineering', institution: 'Stanford University', year: '2015' },
    { degree: 'B.S. in Electrical Engineering', institution: 'UC Berkeley', year: '2013' }
  ],
  hireDate: '2021-08-01',
  status: 'Active',
  payRate: 45.00,
  payType: 'Hourly',
  notes: 'Michael is comfortable teaching all age groups but particularly excels with high school students. He is interested in developing a new advanced competition curriculum.'
};

const InstructorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch instructor data
  useEffect(() => {
    const fetchInstructorData = async () => {
      setLoading(true);
      try {
        // In a real app, this would call the API
        // const data = await getInstructorById(id);
        
        // For demonstration, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        setInstructor(mockInstructorDetails);
        setError(null);
      } catch (err) {
        console.error('Error fetching instructor:', err);
        setError('Failed to load instructor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
  }, [id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Confirm instructor deletion
  const handleDeleteConfirm = async () => {
    try {
      // In a real app, this would call the API
      // await deleteInstructor(id);
      
      // For demonstration, we'll just navigate back
      navigate('/instructors');
    } catch (err) {
      console.error('Error deleting instructor:', err);
      setError('Failed to delete instructor. Please try again.');
      setDeleteDialogOpen(false);
    }
  };

  // Format day and time range
  const formatDayAndTime = (dayOfWeek, startTime, endTime) => {
    return `${dayOfWeek}s, ${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  // Format time (convert from 24h to 12h format)
  const formatTime = (time24h) => {
    if (!time24h) return '';
    
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${hour12}:${minutes} ${suffix}`;
  };

  // Format date range
  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
  };

  // Get instructor initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/instructors')}
        >
          Back to Instructors
        </Button>
      </Container>
    );
  }

  if (!instructor) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 3 }}>
          Instructor not found.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/instructors')}
        >
          Back to Instructors
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        {/* Header with actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}
              src={instructor.profileImage}
            >
              {getInitials(instructor.firstName, instructor.lastName)}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1">
                {`${instructor.firstName} ${instructor.lastName}`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Rating 
                  value={instructor.rating} 
                  precision={0.1} 
                  readOnly 
                  size="small"
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {instructor.rating} rating
                </Typography>
                <Chip 
                  label={instructor.status} 
                  color={instructor.status === 'Active' ? 'success' : 'default'}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
            </Box>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ mr: 1 }}
              onClick={() => navigate(`/instructors/edit/${id}`)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Left column - Instructor info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardHeader 
                title="Contact Information" 
                avatar={<PersonIcon color="primary" />} 
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={instructor.email} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Phone" 
                      secondary={instructor.phone} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Hire Date" 
                      secondary={new Date(instructor.hireDate).toLocaleDateString()} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WorkIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Pay Rate" 
                      secondary={`$${instructor.payRate.toFixed(2)} / ${instructor.payType === 'Hourly' ? 'hour' : 'session'}`} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardHeader 
                title="Bio" 
                avatar={<PersonIcon color="primary" />} 
              />
              <CardContent>
                <Typography variant="body2" paragraph>
                  {instructor.bio}
                </Typography>
                {instructor.education && instructor.education.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Education
                    </Typography>
                    <List dense>
                      {instructor.education.map((edu, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon>
                            <SchoolIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={edu.degree} 
                            secondary={`${edu.institution}, ${edu.year}`} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardHeader 
                title="Skills" 
                avatar={<CheckCircleIcon color="primary" />} 
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {instructor.skills.map((skill, index) => (
                    <Chip 
                      key={index} 
                      label={skill} 
                      variant="outlined" 
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardHeader 
                title="Notes" 
                avatar={<AssignmentIcon color="primary" />} 
              />
              <CardContent>
                <Typography variant="body2">
                  {instructor.notes || 'No notes available.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right column - Tabs content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ width: '100%' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Schedule" id="tab-0" />
                <Tab label="Courses" id="tab-1" />
                <Tab label="Certifications" id="tab-2" />
                <Tab label="Availability" id="tab-3" />
              </Tabs>

              {/* Schedule Tab */}
              {tabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Current Teaching Schedule
                    </Typography>
                  </Box>
                  {instructor.schedule.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table aria-label="schedule table">
                        <TableHead>
                          <TableRow>
                            <TableCell>Course</TableCell>
                            <TableCell>Day & Time</TableCell>
                            <TableCell>Date Range</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">Students</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instructor.schedule.map((session) => (
                            <TableRow hover key={session.id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="body2">
                                    {session.courseName}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {formatDayAndTime(session.dayOfWeek, session.startTime, session.endTime)}
                              </TableCell>
                              <TableCell>
                                {formatDateRange(session.startDate, session.endDate)}
                              </TableCell>
                              <TableCell>{session.location}</TableCell>
                              <TableCell align="right">{session.studentsCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No scheduled courses
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    Past Courses
                  </Typography>
                  
                  {instructor.pastCourses.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table aria-label="past courses table">
                        <TableHead>
                          <TableRow>
                            <TableCell>Course</TableCell>
                            <TableCell>Day</TableCell>
                            <TableCell>Date Range</TableCell>
                            <TableCell>Students</TableCell>
                            <TableCell>Rating</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instructor.pastCourses.map((course) => (
                            <TableRow hover key={course.id}>
                              <TableCell>{course.courseName}</TableCell>
                              <TableCell>{course.dayOfWeek}</TableCell>
                              <TableCell>{formatDateRange(course.startDate, course.endDate)}</TableCell>
                              <TableCell>{course.studentsCount}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Rating 
                                    value={course.rating} 
                                    precision={0.1} 
                                    size="small" 
                                    readOnly 
                                  />
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                  >
                                    {course.rating}
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No past courses
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Courses Tab */}
              {tabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Teachable Courses
                    </Typography>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {instructor.teachableCourses.map((course, index) => (
                        <Chip
                          key={index}
                          label={course}
                          color="primary"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Paper>
                  
                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    Student Reviews
                  </Typography>
                  
                  {instructor.reviews.length > 0 ? (
                    <Box>
                      {instructor.reviews.map((review) => (
                        <Paper 
                          key={review.id} 
                          variant="outlined" 
                          sx={{ p: 2, mb: 2 }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1">
                              {review.studentName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(review.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Rating 
                            value={review.rating} 
                            readOnly 
                            size="small" 
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2">
                            {review.comment}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <StarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No reviews yet
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Certifications Tab */}
              {tabValue === 2 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Certifications & Qualifications
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddCircleIcon />}
                      size="small"
                      onClick={() => navigate(`/instructors/edit/${id}?tab=certifications`)}
                    >
                      Add Certification
                    </Button>
                  </Box>
                  {instructor.certifications.length > 0 ? (
                    <Box>
                      {instructor.certifications.map((cert) => (
                        <Accordion key={cert.id} sx={{ mb: 1 }}>
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`certification-${cert.id}-content`}
                            id={`certification-${cert.id}-header`}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="subtitle1">{cert.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {cert.issuer}
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Typography variant="body2">{cert.description || 'No description available.'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Date Issued</Typography>
                                <Typography variant="body1">{new Date(cert.date).toLocaleDateString()}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Expiration Date</Typography>
                                <Typography variant="body1">
                                  {cert.expirationDate ? new Date(cert.expirationDate).toLocaleDateString() : 'Never'}
                                </Typography>
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No certifications recorded
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/instructors/edit/${id}?tab=certifications`)}
                      >
                        Add Certification
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Availability Tab */}
              {tabValue === 3 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Weekly Availability
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      size="small"
                      onClick={() => navigate(`/instructors/edit/${id}?tab=availability`)}
                    >
                      Update Availability
                    </Button>
                  </Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table aria-label="availability table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Day</TableCell>
                          <TableCell>Morning (8-12)</TableCell>
                          <TableCell>Afternoon (12-5)</TableCell>
                          <TableCell>Evening (5-9)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                          const lowerDay = day.toLowerCase();
                          const dayAvailability = instructor.availability[lowerDay] || [];
                          
                          return (
                            <TableRow key={day}>
                              <TableCell component="th" scope="row">
                                {day}
                              </TableCell>
                              <TableCell>
                                {dayAvailability.includes('morning') ? (
                                  <Chip 
                                    icon={<CheckCircleIcon />} 
                                    label="Available" 
                                    color="success" 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Unavailable
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {dayAvailability.includes('afternoon') ? (
                                  <Chip 
                                    icon={<CheckCircleIcon />} 
                                    label="Available" 
                                    color="success" 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Unavailable
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {dayAvailability.includes('evening') ? (
                                  <Chip 
                                    icon={<CheckCircleIcon />} 
                                    label="Available" 
                                    color="success" 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Unavailable
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    * Actual teaching hours may vary based on course scheduling needs. This represents general availability.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will permanently delete this instructor's profile and all associated data.
          </Alert>
          <Typography>
            Are you sure you want to delete {`${instructor.firstName} ${instructor.lastName}`}? This action cannot be undone and will affect:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <ScheduleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All scheduled classes with this instructor" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Their teaching records and history" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SchoolIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Certification and skill records" />
            </ListItem>
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleDeleteCancel} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete Instructor
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
};

export default InstructorDetails;
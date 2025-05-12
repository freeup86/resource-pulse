import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid, 
  Avatar, 
  Chip, 
  Divider, 
  Tabs, 
  Tab, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton, 
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentById, deleteStudent, getStudentAttendance, getStudentProgress } from '../../services/studentService';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch student details
      const studentResponse = await getStudentById(id);
      setStudent(studentResponse.data);
      
      // Fetch attendance data
      const attendanceResponse = await getStudentAttendance(id);
      setAttendance(attendanceResponse.data);
      
      // Fetch progress data
      const progressResponse = await getStudentProgress(id);
      setProgress(progressResponse.data);
      
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load student information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/students');
  };

  const handleEdit = () => {
    navigate(`/students/edit/${id}`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStudent(id);
      setDeleteDialogOpen(false);
      navigate('/students', { state: { message: 'Student deleted successfully' } });
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student. Please try again.');
      setDeleteDialogOpen(false);
    }
  };

  // Function to get the appropriate avatar background color based on skill level
  const getAvatarColor = (skillLevel) => {
    switch (skillLevel) {
      case 'Beginner':
        return 'success.main';
      case 'Intermediate':
        return 'primary.main';
      case 'Advanced':
        return 'secondary.main';
      default:
        return 'grey.500';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Students
        </Button>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Student not found
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Students
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with navigation and actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Students
        </Button>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />} 
            onClick={handleEdit}
            sx={{ mr: 1 }}
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

      {/* Student Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  fontSize: '2rem',
                  bgcolor: getAvatarColor(student.currentSkillLevel)
                }}
              >
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs={12} md={10}>
              <Typography variant="h4">
                {student.firstName} {student.lastName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                <Chip 
                  label={student.currentSkillLevel} 
                  color={
                    student.currentSkillLevel === 'Beginner' ? 'success' :
                    student.currentSkillLevel === 'Intermediate' ? 'primary' :
                    'secondary'
                  }
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="textSecondary">
                  Student ID: {student.id}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Age</Typography>
                  <Typography variant="body1">{student.age} years</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Grade</Typography>
                  <Typography variant="body1">{student.grade}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">School</Typography>
                  <Typography variant="body1">{student.schoolName}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Parent/Guardian</Typography>
                  <Typography variant="body1">
                    {student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Parent Contact</Typography>
                  <Typography variant="body1">
                    {student.parent ? student.parent.email : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Date of Birth</Typography>
                  <Typography variant="body1">{student.dateOfBirth}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<CalendarIcon />} label="Enrollments" />
          <Tab icon={<SchoolIcon />} label="Attendance" />
          <Tab icon={<EmojiEventsIcon />} label="Progress" />
          <Tab icon={<NotesIcon />} label="Notes" />
        </Tabs>

        {/* Enrollments Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {student.enrollments && student.enrollments.length > 0 ? (
                  student.enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} hover>
                      <TableCell>{enrollment.courseName}</TableCell>
                      <TableCell>{enrollment.startDate}</TableCell>
                      <TableCell>{enrollment.endDate}</TableCell>
                      <TableCell>
                        <Chip 
                          label={enrollment.status} 
                          color={
                            enrollment.status === 'Active' ? 'primary' :
                            enrollment.status === 'Completed' ? 'success' :
                            enrollment.status === 'Waitlisted' ? 'warning' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No enrollments found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Attendance Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Attendance Overview</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        mr: 2
                      }}
                    >
                      <CircularProgress
                        variant="determinate"
                        value={student.attendanceRate}
                        size={80}
                        thickness={5}
                        color={
                          student.attendanceRate >= 90 ? 'success' :
                          student.attendanceRate >= 75 ? 'primary' :
                          'error'
                        }
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="body1" component="div" color="text.secondary">
                          {`${student.attendanceRate}%`}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body1">
                        Overall Attendance Rate
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Based on all enrolled classes
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.length > 0 ? (
                      attendance.map((record) => (
                        <TableRow key={record.id} hover>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.courseName}</TableCell>
                          <TableCell>
                            <Chip 
                              label={record.status} 
                              color={
                                record.status === 'Present' ? 'success' :
                                record.status === 'Late' ? 'warning' :
                                record.status === 'Absent' ? 'error' :
                                'default'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">No attendance records found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Progress Tab */}
        <TabPanel value={tabValue} index={2}>
          {progress.length > 0 ? (
            progress.map((record) => (
              <Card key={record.id} sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{record.courseName}</Typography>
                    <Chip 
                      label={record.grade} 
                      color={
                        record.grade.includes('A') ? 'success' :
                        record.grade.includes('B') ? 'primary' :
                        record.grade.includes('C') ? 'warning' :
                        'error'
                      }
                    />
                  </Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Assessment Date: {record.date}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>Skills Acquired</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {record.skills.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>Instructor Assessment</Typography>
                  <Typography variant="body2" paragraph>
                    {record.assessment}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Instructor: {record.instructor}
                  </Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Alert severity="info">No progress records found</Alert>
          )}
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Student Notes</Typography>
              {student.notes ? (
                <Typography variant="body1">{student.notes}</Typography>
              ) : (
                <Typography variant="body2" color="textSecondary">No notes available</Typography>
              )}
            </CardContent>
          </Card>
          
          {student.specialNeeds || student.allergies ? (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Special Considerations</Typography>
                {student.specialNeeds && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="textSecondary">Special Needs</Typography>
                    <Typography variant="body1">{student.specialNeeds}</Typography>
                  </Box>
                )}
                {student.allergies && (
                  <Box>
                    <Typography variant="subtitle1" color="textSecondary">Allergies</Typography>
                    <Typography variant="body1">{student.allergies}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : null}
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Photo Release Consent</Typography>
              <Chip 
                label={student.photoReleaseConsent ? 'Consent Provided' : 'No Consent'} 
                color={student.photoReleaseConsent ? 'success' : 'error'}
              />
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Achievements section (visible on all tabs) */}
      {student.achievements && student.achievements.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Achievements</Typography>
            <List>
              {student.achievements.map((achievement) => (
                <ListItem key={achievement.id}>
                  <ListItemText
                    primary={achievement.name}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {achievement.date}
                        </Typography>
                        {achievement.description && (
                          <>
                            <br />
                            <Typography variant="body2" component="span">
                              {achievement.description}
                            </Typography>
                          </>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Student</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {student.firstName} {student.lastName}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudentDetails;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Box,
  IconButton,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  Clear as ClearIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  EventAvailable as AvailabilityIcon,
} from '@mui/icons-material';
import { getInstructors, deleteInstructor } from '../../services/instructorService';

// Mock data for demonstration
const mockInstructors = [
  {
    id: '1',
    firstName: 'Michael',
    lastName: 'Chang',
    email: 'michael.c@example.com',
    phone: '(555) 111-2222',
    bio: 'Robotics engineer with 8 years of experience. Specializes in competition robotics and programming.',
    profileImage: null,
    skills: ['Programming', 'Electronics', 'Competition Robotics', 'Arduino', 'Python'],
    certifications: [
      { name: 'Certified Robotics Instructor', issuer: 'National Robotics Association', date: '2020-05-15' },
      { name: 'Python Programming', issuer: 'Code Academy', date: '2019-03-10' }
    ],
    teachableCourses: ['Robotics 101', 'Advanced Programming', 'Competition Prep'],
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
      { id: '1', courseId: '1', courseName: 'Robotics 101', startDate: '2023-09-05', endDate: '2023-12-15', dayOfWeek: 'Monday', startTime: '16:00', endTime: '18:00' },
      { id: '2', courseId: '3', courseName: 'Competition Prep', startDate: '2023-09-06', endDate: '2023-12-16', dayOfWeek: 'Thursday', startTime: '16:00', endTime: '18:00' }
    ],
    rating: 4.8,
    hireDate: '2021-08-01',
    status: 'Active'
  },
  {
    id: '2',
    firstName: 'Jessica',
    lastName: 'Martinez',
    email: 'jessica.m@example.com',
    phone: '(555) 222-3333',
    bio: 'Former high school science teacher with a passion for robotics. Skilled at working with younger students.',
    profileImage: null,
    skills: ['Teaching', 'Beginner Robotics', 'Science Education', 'LEGO Robotics'],
    certifications: [
      { name: 'K-12 Science Teacher Certification', issuer: 'State Board of Education', date: '2015-06-20' },
      { name: 'LEGO Education Certified Trainer', issuer: 'LEGO Education', date: '2018-07-12' }
    ],
    teachableCourses: ['Robotics for Beginners', 'Science of Robotics', 'LEGO Robotics'],
    availability: {
      monday: ['afternoon'],
      tuesday: ['afternoon'],
      wednesday: ['afternoon'],
      thursday: ['afternoon'],
      friday: ['afternoon'],
      saturday: ['morning'],
      sunday: []
    },
    schedule: [
      { id: '3', courseId: '2', courseName: 'Robotics for Beginners', startDate: '2023-09-05', endDate: '2023-12-15', dayOfWeek: 'Tuesday', startTime: '15:00', endTime: '16:30' },
      { id: '4', courseId: '4', courseName: 'LEGO Robotics', startDate: '2023-09-07', endDate: '2023-12-14', dayOfWeek: 'Thursday', startTime: '15:00', endTime: '16:30' }
    ],
    rating: 4.9,
    hireDate: '2020-06-15',
    status: 'Active'
  },
  {
    id: '3',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.w@example.com',
    phone: '(555) 333-4444',
    bio: 'Mechanical engineer specialized in robotics design. Experience with multiple robotics competitions.',
    profileImage: null,
    skills: ['Mechanical Design', 'CAD', '3D Printing', 'Competition Robotics', 'Engineering'],
    certifications: [
      { name: 'Mechanical Engineering License', issuer: 'Engineering Board', date: '2012-05-10' },
      { name: 'Autodesk Certified Professional', issuer: 'Autodesk', date: '2018-11-22' }
    ],
    teachableCourses: ['Robot Design', 'Competition Prep', 'Advanced Engineering'],
    availability: {
      monday: [],
      tuesday: ['evening'],
      wednesday: ['evening'],
      thursday: ['evening'],
      friday: [],
      saturday: ['afternoon', 'evening'],
      sunday: ['morning', 'afternoon']
    },
    schedule: [
      { id: '5', courseId: '5', courseName: 'Robot Design', startDate: '2023-09-06', endDate: '2023-12-20', dayOfWeek: 'Tuesday', startTime: '18:00', endTime: '20:00' },
      { id: '6', courseId: '3', courseName: 'Competition Prep', startDate: '2023-09-10', endDate: '2023-12-17', dayOfWeek: 'Sunday', startTime: '13:00', endTime: '15:00' }
    ],
    rating: 4.7,
    hireDate: '2019-11-01',
    status: 'Active'
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.c@example.com',
    phone: '(555) 444-5555',
    bio: 'Computer scientist with focus on AI and machine learning. Ph.D. in Computer Science.',
    profileImage: null,
    skills: ['Programming', 'AI', 'Machine Learning', 'Python', 'Computer Vision'],
    certifications: [
      { name: 'Ph.D. Computer Science', issuer: 'Stanford University', date: '2019-05-20' },
      { name: 'TensorFlow Certified Developer', issuer: 'Google', date: '2020-03-15' }
    ],
    teachableCourses: ['Advanced Programming', 'AI in Robotics', 'Computer Vision'],
    availability: {
      monday: ['evening'],
      tuesday: ['evening'],
      wednesday: [],
      thursday: ['evening'],
      friday: ['evening'],
      saturday: ['morning'],
      sunday: []
    },
    schedule: [
      { id: '7', courseId: '6', courseName: 'AI in Robotics', startDate: '2023-09-11', endDate: '2023-12-18', dayOfWeek: 'Monday', startTime: '18:00', endTime: '20:00' },
      { id: '8', courseId: '7', courseName: 'Computer Vision', startDate: '2023-09-14', endDate: '2023-12-14', dayOfWeek: 'Thursday', startTime: '18:00', endTime: '20:00' }
    ],
    rating: 4.9,
    hireDate: '2022-01-15',
    status: 'Active'
  },
  {
    id: '5',
    firstName: 'Robert',
    lastName: 'Jackson',
    email: 'robert.j@example.com',
    phone: '(555) 555-6666',
    bio: 'Former industry robotics technician. Expert in hardware aspects of robotics.',
    profileImage: null,
    skills: ['Hardware', 'Electronics', 'Troubleshooting', 'Sensors', 'Motors'],
    certifications: [
      { name: 'Electronics Technician Certificate', issuer: 'Technical Institute', date: '2010-06-10' },
      { name: 'Robotics Maintenance Specialist', issuer: 'Industrial Robotics Association', date: '2015-09-05' }
    ],
    teachableCourses: ['Robotics Hardware', 'Electronics Basics', 'Sensor Technology'],
    availability: {
      monday: ['morning', 'afternoon'],
      tuesday: ['morning', 'afternoon'],
      wednesday: ['morning', 'afternoon'],
      thursday: ['morning', 'afternoon'],
      friday: ['morning', 'afternoon'],
      saturday: [],
      sunday: []
    },
    schedule: [
      { id: '9', courseId: '8', courseName: 'Robotics Hardware', startDate: '2023-09-05', endDate: '2023-12-19', dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '12:00' },
      { id: '10', courseId: '9', courseName: 'Electronics Basics', startDate: '2023-09-07', endDate: '2023-12-21', dayOfWeek: 'Thursday', startTime: '10:00', endTime: '12:00' }
    ],
    rating: 4.6,
    hireDate: '2018-05-10',
    status: 'Active'
  },
  {
    id: '6',
    firstName: 'Emily',
    lastName: 'Patel',
    email: 'emily.p@example.com',
    phone: '(555) 666-7777',
    bio: 'Specialist in STEAM education with focus on inclusive teaching methods. Great with elementary age students.',
    profileImage: null,
    skills: ['Teaching', 'STEAM Education', 'Elementary Education', 'Inclusive Education', 'LEGO Robotics'],
    certifications: [
      { name: 'Elementary Education License', issuer: 'State Board of Education', date: '2017-06-15' },
      { name: 'STEAM Education Certificate', issuer: 'Education Innovation Institute', date: '2019-08-10' }
    ],
    teachableCourses: ['Robotics for Beginners', 'LEGO Robotics', 'STEAM Foundations'],
    availability: {
      monday: ['afternoon'],
      tuesday: ['afternoon'],
      wednesday: ['afternoon'],
      thursday: ['afternoon'],
      friday: ['afternoon'],
      saturday: ['morning', 'afternoon'],
      sunday: []
    },
    schedule: [
      { id: '11', courseId: '10', courseName: 'STEAM Foundations', startDate: '2023-09-06', endDate: '2023-12-20', dayOfWeek: 'Wednesday', startTime: '15:00', endTime: '16:30' },
      { id: '12', courseId: '4', courseName: 'LEGO Robotics', startDate: '2023-09-09', endDate: '2023-12-16', dayOfWeek: 'Saturday', startTime: '10:00', endTime: '11:30' }
    ],
    rating: 4.9,
    hireDate: '2021-03-15',
    status: 'Active'
  },
  {
    id: '7',
    firstName: 'James',
    lastName: 'Rodriguez',
    email: 'james.r@example.com',
    phone: '(555) 777-8888',
    bio: 'Experienced in aerospace engineering with expertise in drone technology and flying robotics.',
    profileImage: null,
    skills: ['Aerospace', 'Drones', 'Flight Control', 'Programming', 'CAD'],
    certifications: [
      { name: 'FAA Drone Pilot License', issuer: 'Federal Aviation Administration', date: '2018-04-20' },
      { name: 'Aerospace Engineering Degree', issuer: 'MIT', date: '2015-05-15' }
    ],
    teachableCourses: ['Drone Technology', 'Flying Robotics', 'Advanced Programming'],
    availability: {
      monday: [],
      tuesday: [],
      wednesday: ['evening'],
      thursday: ['evening'],
      friday: ['evening'],
      saturday: ['morning', 'afternoon'],
      sunday: ['morning', 'afternoon']
    },
    schedule: [
      { id: '13', courseId: '11', courseName: 'Drone Technology', startDate: '2023-09-09', endDate: '2023-12-16', dayOfWeek: 'Saturday', startTime: '13:00', endTime: '15:00' },
      { id: '14', courseId: '12', courseName: 'Flying Robotics', startDate: '2023-09-13', endDate: '2023-12-15', dayOfWeek: 'Friday', startTime: '18:00', endTime: '20:00' }
    ],
    rating: 4.8,
    hireDate: '2020-09-01',
    status: 'Active'
  },
  {
    id: '8',
    firstName: 'Lisa',
    lastName: 'Thompson',
    email: 'lisa.t@example.com',
    phone: '(555) 888-9999',
    bio: 'Specializes in programming education with strong background in software development.',
    profileImage: null,
    skills: ['Programming', 'Software Development', 'Python', 'JavaScript', 'Web Development'],
    certifications: [
      { name: 'Computer Science Degree', issuer: 'University of Washington', date: '2016-06-10' },
      { name: 'Certified Programming Instructor', issuer: 'Code.org', date: '2018-01-15' }
    ],
    teachableCourses: ['Programming Fundamentals', 'Web Development', 'Advanced Programming'],
    availability: {
      monday: ['evening'],
      tuesday: ['evening'],
      wednesday: ['evening'],
      thursday: ['evening'],
      friday: [],
      saturday: [],
      sunday: ['morning', 'afternoon', 'evening']
    },
    schedule: [
      { id: '15', courseId: '13', courseName: 'Programming Fundamentals', startDate: '2023-09-11', endDate: '2023-12-18', dayOfWeek: 'Monday', startTime: '18:00', endTime: '20:00' },
      { id: '16', courseId: '14', courseName: 'Web Development', startDate: '2023-09-10', endDate: '2023-12-17', dayOfWeek: 'Sunday', startTime: '13:00', endTime: '15:00' }
    ],
    rating: 4.7,
    hireDate: '2020-01-15',
    status: 'Active'
  }
];

const Instructors = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState(null);

  // Fetch instructors data
  const fetchInstructors = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      // const response = await getInstructors({ search: searchTerm });
      // setInstructors(response.data);
      
      // For demonstration, we'll use mock data with filtering
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      const filteredInstructors = mockInstructors.filter(instructor => 
        `${instructor.firstName} ${instructor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        instructor.teachableCourses.some(course => course.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setInstructors(filteredInstructors);
      setError(null);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Failed to load instructors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load instructors on component mount or search term change
  useEffect(() => {
    fetchInstructors();
  }, [searchTerm]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (instructor) => {
    setInstructorToDelete(instructor);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setInstructorToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Confirm instructor deletion
  const handleDeleteConfirm = async () => {
    if (!instructorToDelete) return;
    
    try {
      // In a real app, this would call the API
      // await deleteInstructor(instructorToDelete.id);
      
      // For demonstration, we'll just update the state
      setInstructors(instructors.filter(i => i.id !== instructorToDelete.id));
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setInstructorToDelete(null);
    } catch (err) {
      console.error('Error deleting instructor:', err);
      setError('Failed to delete instructor. Please try again.');
    }
  };

  // Get instructor initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Format availability for display
  const formatAvailability = (availability) => {
    if (!availability) return 'Not set';
    
    const daysWithAvailability = Object.keys(availability).filter(
      day => availability[day] && availability[day].length > 0
    );
    
    if (daysWithAvailability.length === 0) return 'Not available';
    
    if (daysWithAvailability.length <= 2) {
      return daysWithAvailability.map(day => 
        `${day.charAt(0).toUpperCase()}${day.slice(1)}`
      ).join(', ');
    }
    
    return `${daysWithAvailability.length} days/week`;
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Instructors
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/instructors/add')}
          >
            Add Instructor
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              label="Search instructors"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, skills, or courses..."
              InputProps={{
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Paper>
        
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <LinearProgress />
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                <Table stickyHeader aria-label="instructors table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Instructor</TableCell>
                      <TableCell>Contact Information</TableCell>
                      <TableCell>Skills</TableCell>
                      <TableCell>Courses</TableCell>
                      <TableCell>Availability</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {instructors
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((instructor) => (
                        <TableRow hover key={instructor.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ mr: 2, bgcolor: 'primary.main' }}
                                src={instructor.profileImage}
                              >
                                {getInitials(instructor.firstName, instructor.lastName)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">
                                  {`${instructor.firstName} ${instructor.lastName}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Since {new Date(instructor.hireDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">{instructor.email}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">{instructor.phone}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {instructor.skills.slice(0, 3).map((skill, index) => (
                                <Chip
                                  key={index}
                                  label={skill}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                              {instructor.skills.length > 3 && (
                                <Tooltip title={instructor.skills.slice(3).join(', ')}>
                                  <Chip
                                    label={`+${instructor.skills.length - 3}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {instructor.teachableCourses.map((course, index) => (
                                <Chip
                                  key={index}
                                  label={course}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AvailabilityIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {formatAvailability(instructor.availability)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Rating 
                                value={instructor.rating} 
                                precision={0.1} 
                                size="small" 
                                readOnly 
                              />
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                {instructor.rating}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  color="info"
                                  onClick={() => navigate(`/instructors/${instructor.id}`)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Instructor">
                                <IconButton
                                  color="primary"
                                  onClick={() => navigate(`/instructors/edit/${instructor.id}`)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Instructor">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(instructor)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    {instructors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                              No instructors found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {searchTerm ? 'Try adjusting your search.' : 'Add an instructor to get started.'}
                            </Typography>
                            {!searchTerm && (
                              <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/instructors/add')}
                              >
                                Add Instructor
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={instructors.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Box>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete {instructorToDelete && `${instructorToDelete.firstName} ${instructorToDelete.lastName}`}? This action cannot be undone and will remove all associated data including teaching schedules.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Instructors;
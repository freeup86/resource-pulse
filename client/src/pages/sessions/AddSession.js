import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  LinearProgress,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { createSession } from '../../services/sessionService';
import { mockCourses } from '../../services/courseService';

// Mock instructor data
const mockInstructors = [
  {
    id: '1',
    name: 'Dr. Robert Chen',
    email: 'robert.chen@example.com',
    phone: '(555) 123-4567',
    specialization: 'Elementary robotics education',
    bio: 'Dr. Chen has 10 years of experience teaching STEM to young learners.'
  },
  {
    id: '2',
    name: 'Michelle Rodriguez',
    email: 'michelle.r@example.com',
    phone: '(555) 987-6543',
    specialization: 'Middle school robotics and competitions',
    bio: 'Coach Rodriguez leads our competition teams and has mentored regional champions.'
  },
  {
    id: '3',
    name: 'Alexander Wei, PhD',
    email: 'alex.wei@example.com',
    phone: '(555) 456-7890',
    specialization: 'Computer science and AI applications',
    bio: 'Dr. Wei is a former robotics engineer who now specializes in teaching programming for advanced applications.'
  },
  {
    id: '4',
    name: 'Emily Jackson',
    email: 'emily.j@example.com',
    phone: '(555) 234-5678',
    specialization: 'Early childhood STEM education',
    bio: 'Ms. Jackson specializes in making technology accessible and fun for our youngest students.'
  },
  {
    id: '5',
    name: 'Dr. Aisha Johnson',
    email: 'aisha.j@example.com',
    phone: '(555) 876-5432',
    specialization: 'Computer engineering and STEM outreach',
    bio: 'Dr. Johnson is passionate about increasing diversity in robotics and engineering fields.'
  },
  {
    id: '6',
    name: 'Professor James Thompson',
    email: 'j.thompson@example.com',
    phone: '(555) 789-0123',
    specialization: 'Artificial Intelligence and Robotics',
    bio: 'Prof. Thompson conducts research in AI applications for autonomous systems.'
  },
  {
    id: '7',
    name: 'Dr. Maria Gonzalez',
    email: 'maria.g@example.com',
    phone: '(555) 345-6789',
    specialization: 'Marine robotics and environmental monitoring',
    bio: 'Dr. Gonzalez has worked on underwater robotics projects with oceanographic institutes.'
  },
];

// Mock location data
const mockLocations = [
  'Innovation Lab - Room 102',
  'Tech Center - Main Lab',
  'Innovation Hub - Coding Lab',
  'Competition Arena - North Campus',
  'Junior Lab - East Wing',
  'Tech Center - Studio B',
  'AI Lab - Research Center',
  'Aquatics Center and Tech Lab',
  'Eastside Community Center - Room 3',
  'Westside High School - Robotics Lab',
];

const AddSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedCourseId = queryParams.get('courseId');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [instructor, setInstructor] = useState(null);
  
  const [formData, setFormData] = useState({
    courseId: preselectedCourseId || '',
    courseTitle: '',
    startDate: null,
    endDate: null,
    schedule: '',
    location: '',
    instructorId: '',
    maxCapacity: 0,
    status: 'Registration Open',
    materials: '',
    notes: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    courseId: '',
    startDate: '',
    endDate: '',
    schedule: '',
    location: '',
    instructorId: '',
    maxCapacity: '',
  });
  
  // Update course title when courseId changes
  useEffect(() => {
    if (formData.courseId) {
      const selectedCourse = mockCourses.find(course => course.id === formData.courseId);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          courseTitle: selectedCourse.title,
          maxCapacity: selectedCourse.maxCapacity,
        }));
      }
    }
  }, [formData.courseId]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date,
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // Handle instructor selection
  const handleInstructorChange = (event, newValue) => {
    setInstructor(newValue);
    if (newValue) {
      setFormData({
        ...formData,
        instructorId: newValue.id,
      });
      
      // Clear error
      if (formErrors.instructorId) {
        setFormErrors({
          ...formErrors,
          instructorId: '',
        });
      }
    } else {
      setFormData({
        ...formData,
        instructorId: '',
      });
    }
  };
  
  // Handle location selection
  const handleLocationChange = (event, newValue) => {
    setFormData({
      ...formData,
      location: newValue || '',
    });
    
    // Clear error
    if (formErrors.location) {
      setFormErrors({
        ...formErrors,
        location: '',
      });
    }
  };
  
  // Validate form fields
  const validateForm = () => {
    let valid = true;
    const errors = {
      courseId: '',
      startDate: '',
      endDate: '',
      schedule: '',
      location: '',
      instructorId: '',
      maxCapacity: '',
    };
    
    if (!formData.courseId) {
      errors.courseId = 'Course is required';
      valid = false;
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
      valid = false;
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
      valid = false;
    } else if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End date must be after start date';
      valid = false;
    }
    
    if (!formData.schedule.trim()) {
      errors.schedule = 'Schedule is required';
      valid = false;
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
      valid = false;
    }
    
    if (!formData.instructorId) {
      errors.instructorId = 'Instructor is required';
      valid = false;
    }
    
    if (formData.maxCapacity <= 0) {
      errors.maxCapacity = 'Maximum capacity must be greater than 0';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would call the API
      // const response = await createSession({
      //   ...formData,
      //   instructor: instructor,
      //   enrollmentCount: 0,
      // });
      
      // For demonstration, we'll simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/sessions');
      }, 1500);
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sessions')}
          sx={{ mb: 4 }}
        >
          Back to Sessions
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Session
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Session created successfully! Redirecting...
          </Alert>
        )}
        
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          {loading && <LinearProgress sx={{ mb: 3 }} />}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!formErrors.courseId}>
                <InputLabel id="course-label">Course</InputLabel>
                <Select
                  labelId="course-label"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  label="Course"
                  disabled={loading}
                >
                  {mockCourses.map(course => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title} ({course.skillLevel}, Ages {course.ageRange})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.courseId && <FormHelperText>{formErrors.courseId}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!formErrors.status}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                  disabled={loading}
                >
                  <MenuItem value="Registration Open">Registration Open</MenuItem>
                  <MenuItem value="Upcoming">Upcoming</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Full">Full</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Start Date *"
                value={formData.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    error={!!formErrors.startDate}
                    helperText={formErrors.startDate}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="End Date *"
                value={formData.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    error={!!formErrors.endDate}
                    helperText={formErrors.endDate}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                minDate={formData.startDate}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Schedule"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                placeholder="e.g., Mondays and Wednesdays, 4:00 PM - 5:30 PM"
                error={!!formErrors.schedule}
                helperText={formErrors.schedule}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={mockLocations}
                value={formData.location}
                onChange={handleLocationChange}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location *"
                    required
                    error={!!formErrors.location}
                    helperText={formErrors.location}
                    disabled={loading}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <LocationOnIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Maximum Capacity"
                name="maxCapacity"
                type="number"
                value={formData.maxCapacity}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 1 } }}
                error={!!formErrors.maxCapacity}
                helperText={formErrors.maxCapacity}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                options={mockInstructors}
                getOptionLabel={(option) => option.name}
                value={instructor}
                onChange={handleInstructorChange}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Instructor *"
                    required
                    error={!!formErrors.instructorId}
                    helperText={formErrors.instructorId}
                    disabled={loading}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.specialization}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Materials"
                name="materials"
                value={formData.materials}
                onChange={handleChange}
                placeholder="Any specific materials needed for this session"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special instructions or notes for this session"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/sessions')}
                  sx={{ mr: 1 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  Create Session
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default AddSession;
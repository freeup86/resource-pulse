import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Autocomplete,
  FormHelperText,
  FormGroup,
  FormLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  Edit as EditIcon,
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { getInstructorById, updateInstructor } from '../../services/instructorService';

// Mock data for dropdowns and autocomplete
const mockSkills = [
  'Programming', 'Electronics', 'Mechanical Design', 'CAD', '3D Printing', 
  'Competition Robotics', 'Arduino', 'Python', 'JavaScript', 'C++', 
  'Computer Vision', 'Machine Learning', 'AI', 'Sensors', 'Motors',
  'Teaching', 'Science Education', 'STEAM Education', 'LEGO Robotics', 
  'Hardware', 'Troubleshooting', 'Engineering', 'Flight Control', 'Drones',
  'Aerospace', 'Web Development', 'Software Development', 'Inclusive Education'
];

const mockCourses = [
  'Robotics 101', 'Advanced Programming', 'Competition Prep', 'Robotics for Beginners',
  'Arduino Workshop', 'Python for Robotics', 'LEGO Robotics', 'Science of Robotics',
  'Robot Design', 'Advanced Engineering', 'AI in Robotics', 'Computer Vision',
  'Robotics Hardware', 'Electronics Basics', 'Sensor Technology', 'STEAM Foundations',
  'Drone Technology', 'Flying Robotics', 'Programming Fundamentals', 'Web Development'
];

// Mock instructor data (would be fetched from API in production)
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

const EditInstructor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse tab from URL query params
  const queryParams = new URLSearchParams(location.search);
  const initialTabName = queryParams.get('tab');
  
  const getInitialTabIndex = () => {
    switch (initialTabName) {
      case 'availability':
        return 2;
      case 'certifications':
        return 3;
      case 'pay':
        return 4;
      default:
        return 0;
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(getInitialTabIndex());
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: null,
    education: [
      { degree: '', institution: '', year: '' }
    ],
    skills: [],
    certifications: [
      { id: '', name: '', issuer: '', date: '', expirationDate: '', description: '' }
    ],
    teachableCourses: [],
    availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    payRate: '',
    payType: 'Hourly',
    notes: '',
    status: 'Active',
  });

  // Form validation state
  const [errors, setErrors] = useState({});

  // Fetch instructor data
  useEffect(() => {
    const fetchInstructorData = async () => {
      setLoading(true);
      try {
        // In a real app, this would call the API
        // const data = await getInstructorById(id);
        
        // For demonstration, use mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        const data = mockInstructorDetails;
        
        // Update form data
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          profileImage: data.profileImage,
          education: data.education.length > 0 ? data.education : [{ degree: '', institution: '', year: '' }],
          skills: data.skills,
          certifications: data.certifications.length > 0 ? data.certifications : [{ id: '', name: '', issuer: '', date: '', expirationDate: '', description: '' }],
          teachableCourses: data.teachableCourses,
          availability: data.availability,
          payRate: data.payRate,
          payType: data.payType,
          notes: data.notes,
          status: data.status,
        });
        
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

  // Handle basic input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  // Handle education change
  const handleEducationChange = (index, field, value) => {
    const newEducation = [...formData.education];
    newEducation[index][field] = value;
    
    setFormData({
      ...formData,
      education: newEducation,
    });
  };

  // Add education entry
  const handleAddEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        { degree: '', institution: '', year: '' }
      ],
    });
  };

  // Remove education entry
  const handleRemoveEducation = (index) => {
    const newEducation = [...formData.education];
    newEducation.splice(index, 1);
    
    setFormData({
      ...formData,
      education: newEducation,
    });
  };

  // Handle certification change
  const handleCertificationChange = (index, field, value) => {
    const newCertifications = [...formData.certifications];
    newCertifications[index][field] = value;
    
    setFormData({
      ...formData,
      certifications: newCertifications,
    });
  };

  // Add certification entry
  const handleAddCertification = () => {
    setFormData({
      ...formData,
      certifications: [
        ...formData.certifications,
        { id: `new-${Date.now()}`, name: '', issuer: '', date: '', expirationDate: '', description: '' }
      ],
    });
  };

  // Remove certification entry
  const handleRemoveCertification = (index) => {
    const newCertifications = [...formData.certifications];
    newCertifications.splice(index, 1);
    
    setFormData({
      ...formData,
      certifications: newCertifications,
    });
  };

  // Handle availability change
  const handleAvailabilityChange = (day, timeSlot) => {
    const currentAvailability = [...formData.availability[day]];
    const index = currentAvailability.indexOf(timeSlot);
    
    if (index > -1) {
      currentAvailability.splice(index, 1);
    } else {
      currentAvailability.push(timeSlot);
    }
    
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: currentAvailability,
      },
    });
  };

  // Handle skills change
  const handleSkillsChange = (event, newSkills) => {
    setFormData({
      ...formData,
      skills: newSkills,
    });
  };

  // Handle teachable courses change
  const handleCoursesChange = (event, newCourses) => {
    setFormData({
      ...formData,
      teachableCourses: newCourses,
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Phone validation (simple format check)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s()-+]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number format is invalid';
    }
    
    // Bio validation
    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 50) {
      newErrors.bio = 'Bio should be at least 50 characters';
    }
    
    // Skills validation
    if (formData.skills.length === 0) {
      newErrors.skills = 'At least one skill is required';
    }
    
    // Courses validation
    if (formData.teachableCourses.length === 0) {
      newErrors.teachableCourses = 'At least one course is required';
    }
    
    // Pay rate validation
    if (!formData.payRate.toString().trim()) {
      newErrors.payRate = 'Pay rate is required';
    } else if (isNaN(formData.payRate) || Number(formData.payRate) <= 0) {
      newErrors.payRate = 'Pay rate must be a positive number';
    }
    
    // Education validation - at least one complete entry
    const hasValidEducation = formData.education.some(edu => 
      edu.degree.trim() && edu.institution.trim() && edu.year.trim()
    );
    
    if (!hasValidEducation) {
      newErrors.education = 'At least one complete education entry is required';
    }
    
    // Availability - at least one time slot
    const hasAvailability = Object.values(formData.availability).some(
      slots => slots.length > 0
    );
    
    if (!hasAvailability) {
      newErrors.availability = 'At least one availability time slot is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the form errors before submitting.');
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Clean up form data - filter out empty education and certification entries
      const cleanedEducation = formData.education.filter(
        edu => edu.degree.trim() && edu.institution.trim() && edu.year.trim()
      );
      
      const cleanedCertifications = formData.certifications.filter(
        cert => cert.name.trim() && cert.issuer.trim() && cert.date.trim()
      );
      
      // Prepare data for API
      const instructorData = {
        ...formData,
        education: cleanedEducation,
        certifications: cleanedCertifications,
      };
      
      // Call API to update instructor
      // In a real app, this would call the API
      // await updateInstructor(id, instructorData);
      
      // For demonstration, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      setSuccess(true);
      
      // Navigate to instructor details after short delay
      setTimeout(() => {
        navigate(`/instructors/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating instructor:', err);
      setError('Failed to update instructor. Please try again.');
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
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

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EditIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" component="h1">
            Edit Instructor
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Instructor updated successfully! Redirecting to instructor details...
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="instructor edit tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Personal Information" id="tab-0" />
            <Tab label="Skills & Courses" id="tab-1" />
            <Tab label="Availability" id="tab-2" />
            <Tab label="Certifications" id="tab-3" />
            <Tab label="Pay & Status" id="tab-4" />
          </Tabs>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit}>
          {/* Personal Information Tab */}
          {tabValue === 0 && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    disabled={saving}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    disabled={saving}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={saving}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="phone"
                    label="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.phone}
                    helperText={errors.phone}
                    disabled={saving}
                    placeholder="(555) 123-4567"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="bio"
                    label="Professional Bio"
                    value={formData.bio}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.bio}
                    helperText={errors.bio || 'Describe the instructor\'s experience, expertise, and teaching style.'}
                    disabled={saving}
                    multiline
                    rows={4}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                    Education
                  </Typography>
                  
                  {errors.education && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.education}
                    </Alert>
                  )}
                </Grid>
                
                {formData.education.map((edu, index) => (
                  <Grid item xs={12} key={index}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            label="Degree/Certification"
                            value={edu.degree}
                            onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                            fullWidth
                            required={index === 0}
                            disabled={saving}
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            label="Institution"
                            value={edu.institution}
                            onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                            fullWidth
                            required={index === 0}
                            disabled={saving}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            label="Year"
                            value={edu.year}
                            onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                            fullWidth
                            required={index === 0}
                            disabled={saving}
                          />
                        </Grid>
                        {index > 0 && (
                          <Grid item xs={12} display="flex" justifyContent="flex-end">
                            <Button
                              color="error"
                              onClick={() => handleRemoveEducation(index)}
                              disabled={saving}
                            >
                              Remove
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddEducation}
                    disabled={saving}
                    sx={{ mb: 3 }}
                  >
                    Add Education
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    name="notes"
                    label="Notes"
                    value={formData.notes}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    disabled={saving}
                    placeholder="Add any additional notes about this instructor..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Skills & Courses Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Skills & Expertise
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={mockSkills}
                    value={formData.skills}
                    onChange={handleSkillsChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Skills"
                        required
                        error={!!errors.skills}
                        helperText={errors.skills || 'Select all applicable skills'}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    disabled={saving}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={mockCourses}
                    value={formData.teachableCourses}
                    onChange={handleCoursesChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Courses This Instructor Can Teach"
                        required
                        error={!!errors.teachableCourses}
                        helperText={errors.teachableCourses || 'Select all applicable courses'}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          color="primary"
                          label={option}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    disabled={saving}
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                The courses selected here determine which classes can be assigned to this instructor in the scheduling system.
              </Alert>
            </Box>
          )}

          {/* Availability Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Weekly Availability
              </Typography>
              
              {errors.availability && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.availability}
                </Alert>
              )}
              
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormHelperText>
                  Select all time slots when the instructor is typically available to teach
                </FormHelperText>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Day</TableCell>
                        <TableCell>Morning (8-12)</TableCell>
                        <TableCell>Afternoon (12-5)</TableCell>
                        <TableCell>Evening (5-9)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <TableRow key={day}>
                          <TableCell component="th" scope="row" sx={{ textTransform: 'capitalize' }}>
                            {day}
                          </TableCell>
                          {['morning', 'afternoon', 'evening'].map((timeSlot) => (
                            <TableCell key={`${day}-${timeSlot}`}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={formData.availability[day].includes(timeSlot)}
                                    onChange={() => handleAvailabilityChange(day, timeSlot)}
                                    disabled={saving}
                                  />
                                }
                                label="Available"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </FormControl>

              <Alert severity="info">
                Note: This represents the instructor's general availability. Actual teaching schedule may vary based on course scheduling needs.
              </Alert>
            </Box>
          )}

          {/* Certifications Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Certifications & Qualifications
              </Typography>
              
              {formData.certifications.map((cert, index) => (
                <Box key={cert.id || index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Certification Name"
                        value={cert.name}
                        onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                        fullWidth
                        disabled={saving}
                        placeholder="Certified Robotics Instructor"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Issuing Organization"
                        value={cert.issuer}
                        onChange={(e) => handleCertificationChange(index, 'issuer', e.target.value)}
                        fullWidth
                        disabled={saving}
                        placeholder="National Robotics Association"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Date Issued"
                        type="date"
                        value={cert.date}
                        onChange={(e) => handleCertificationChange(index, 'date', e.target.value)}
                        fullWidth
                        disabled={saving}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Expiration Date (if applicable)"
                        type="date"
                        value={cert.expirationDate || ''}
                        onChange={(e) => handleCertificationChange(index, 'expirationDate', e.target.value)}
                        fullWidth
                        disabled={saving}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Description"
                        value={cert.description || ''}
                        onChange={(e) => handleCertificationChange(index, 'description', e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        disabled={saving}
                        placeholder="Brief description of the certification and its relevance"
                      />
                    </Grid>
                    {index > 0 && (
                      <Grid item xs={12} display="flex" justifyContent="flex-end">
                        <Button
                          color="error"
                          onClick={() => handleRemoveCertification(index)}
                          disabled={saving}
                          startIcon={<DeleteIcon />}
                        >
                          Remove
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddCertification}
                disabled={saving}
                variant="outlined"
                sx={{ mb: 3 }}
              >
                Add Certification
              </Button>
            </Box>
          )}

          {/* Pay & Status Tab */}
          {tabValue === 4 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Pay Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="payRate"
                    label="Pay Rate"
                    value={formData.payRate}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.payRate}
                    helperText={errors.payRate}
                    disabled={saving}
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={saving}>
                    <InputLabel id="pay-type-label">Pay Type</InputLabel>
                    <Select
                      labelId="pay-type-label"
                      name="payType"
                      value={formData.payType}
                      onChange={handleChange}
                      label="Pay Type"
                    >
                      <MenuItem value="Hourly">Hourly</MenuItem>
                      <MenuItem value="Per Session">Per Session</MenuItem>
                      <MenuItem value="Salary">Salary</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Status
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={saving}>
                    <InputLabel id="status-label">Instructor Status</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Instructor Status"
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="On Leave">On Leave</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                    <FormHelperText>
                      Inactive instructors won't appear in scheduling options
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Form Controls */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate(`/instructors/${id}`)}
              sx={{ mr: 2 }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditInstructor;
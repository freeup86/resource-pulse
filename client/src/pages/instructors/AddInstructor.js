import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Autocomplete,
  FormHelperText,
  FormGroup,
  FormLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { createInstructor } from '../../services/instructorService';

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

const AddInstructor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
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
      { name: '', issuer: '', date: '', expirationDate: '', description: '' }
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
  });

  // Form validation state
  const [errors, setErrors] = useState({});

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
        { name: '', issuer: '', date: '', expirationDate: '', description: '' }
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
    
    // Certifications - no validation, can be empty
    
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
    
    setLoading(true);
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
        hireDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        rating: 0,
      };
      
      // Call API to create instructor
      // In a real app, this would call the API
      // const response = await createInstructor(instructorData);
      
      // For demonstration, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      setSuccess(true);
      
      // Navigate to instructor list after short delay
      setTimeout(() => {
        navigate('/instructors');
      }, 1500);
    } catch (err) {
      console.error('Error creating instructor:', err);
      setError('Failed to create instructor. Please try again.');
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonAddIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" component="h1">
            Add New Instructor
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Instructor created successfully! Redirecting to instructor list...
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Personal Information
          </Typography>
          
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>

          {/* Education */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Education
          </Typography>
          
          {errors.education && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.education}
            </Alert>
          )}
          
          {formData.education.map((edu, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Degree/Certification"
                    value={edu.degree}
                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                    fullWidth
                    required={index === 0}
                    disabled={loading}
                    placeholder="M.S. in Robotics Engineering"
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Institution"
                    value={edu.institution}
                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                    fullWidth
                    required={index === 0}
                    disabled={loading}
                    placeholder="Stanford University"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Year"
                    value={edu.year}
                    onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                    fullWidth
                    required={index === 0}
                    disabled={loading}
                    placeholder="2015"
                  />
                </Grid>
                {index > 0 && (
                  <Grid item xs={12} display="flex" justifyContent="flex-end">
                    <Button
                      color="error"
                      onClick={() => handleRemoveEducation(index)}
                      disabled={loading}
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
            onClick={handleAddEducation}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            Add Education
          </Button>

          {/* Skills & Expertise */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
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
                disabled={loading}
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
                disabled={loading}
              />
            </Grid>
          </Grid>
          
          {/* Certifications */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Certifications (Optional)
          </Typography>
          
          {formData.certifications.map((cert, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Certification Name"
                    value={cert.name}
                    onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                    fullWidth
                    disabled={loading}
                    placeholder="Certified Robotics Instructor"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Issuing Organization"
                    value={cert.issuer}
                    onChange={(e) => handleCertificationChange(index, 'issuer', e.target.value)}
                    fullWidth
                    disabled={loading}
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
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Expiration Date (if applicable)"
                    type="date"
                    value={cert.expirationDate}
                    onChange={(e) => handleCertificationChange(index, 'expirationDate', e.target.value)}
                    fullWidth
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={cert.description}
                    onChange={(e) => handleCertificationChange(index, 'description', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    disabled={loading}
                    placeholder="Brief description of the certification and its relevance"
                  />
                </Grid>
                {index > 0 && (
                  <Grid item xs={12} display="flex" justifyContent="flex-end">
                    <Button
                      color="error"
                      onClick={() => handleRemoveCertification(index)}
                      disabled={loading}
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
            disabled={loading}
            sx={{ mb: 3 }}
          >
            Add Certification
          </Button>

          {/* Availability */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
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
                                disabled={loading}
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

          {/* Pay Information */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Pay Information
          </Typography>
          
          <Grid container spacing={2}>
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
                disabled={loading}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
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
          </Grid>

          {/* Additional Notes */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Additional Notes
          </Typography>
          
          <TextField
            name="notes"
            label="Notes"
            value={formData.notes}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            disabled={loading}
            placeholder="Add any additional notes about this instructor..."
          />
          
          {/* Form Controls */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/instructors')}
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Instructor'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddInstructor;
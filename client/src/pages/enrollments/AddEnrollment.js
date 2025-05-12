import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, Button, TextField,
  MenuItem, FormControl, FormHelperText, CircularProgress,
  Alert, Divider, Autocomplete, Chip
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import enrollmentService from '../../services/enrollmentService';

const AddEnrollment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    status: 'enrolled',
    startDate: '',
    endDate: '',
    paymentStatus: 'pending',
    paymentAmount: '',
    paymentMethod: 'credit',
    notes: ''
  });
  
  // Reference data
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  // Fetch students and courses on component mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      setLoading(true);
      try {
        // In a real application, these would be separate API calls
        // For demo purposes, we're mocking the data
        setStudents([
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
          { id: '3', name: 'Michael Johnson', email: 'michael@example.com' },
        ]);
        
        setCourses([
          { id: '1', title: 'Introduction to Robotics', instructor: 'Dr. Smith' },
          { id: '2', title: 'Advanced Programming', instructor: 'Prof. Johnson' },
          { id: '3', title: 'Robotics Engineering Basics', instructor: 'Dr. Williams' },
          { id: '4', title: 'AI for Robotics', instructor: 'Prof. Davis' },
        ]);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching reference data:', err);
        setError('Failed to load required data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferenceData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear the error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  const handleStudentChange = (event, newValue) => {
    setFormData(prevData => ({
      ...prevData,
      studentId: newValue ? newValue.id : ''
    }));
    
    // Clear the error for this field if it exists
    if (formErrors.studentId) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        studentId: null
      }));
    }
  };

  const handleCourseChange = (event, newValue) => {
    setFormData(prevData => ({
      ...prevData,
      courseId: newValue ? newValue.id : ''
    }));
    
    // Clear the error for this field if it exists
    if (formErrors.courseId) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        courseId: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.studentId) errors.studentId = 'Student is required';
    if (!formData.courseId) errors.courseId = 'Course is required';
    if (!formData.status) errors.status = 'Status is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    
    if (formData.paymentStatus === 'paid' && !formData.paymentAmount) {
      errors.paymentAmount = 'Payment amount is required when status is paid';
    }
    
    if (formData.paymentStatus === 'paid' && !formData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required when status is paid';
    }
    
    // Ensure end date is after start date if provided
    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await enrollmentService.createEnrollment(formData);
      setSuccess(true);
      
      // Navigate to the enrollment details page after a short delay
      setTimeout(() => {
        navigate(`/enrollments/view/${response.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating enrollment:', err);
      setError('Failed to create enrollment. Please check your data and try again.');
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button
            component={Link}
            to="/enrollments"
            startIcon={<ArrowBackIcon />}
          >
            Back to Enrollments
          </Button>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Add New Enrollment
          </Typography>
          <Divider sx={{ mb: 4 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Enrollment created successfully! Redirecting...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Student Selection */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="student-select"
                  options={students}
                  getOptionLabel={(option) => `${option.name} (${option.email})`}
                  onChange={handleStudentChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Student"
                      required
                      error={!!formErrors.studentId}
                      helperText={formErrors.studentId}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Course Selection */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="course-select"
                  options={courses}
                  getOptionLabel={(option) => `${option.title} (${option.instructor})`}
                  onChange={handleCourseChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Course"
                      required
                      error={!!formErrors.courseId}
                      helperText={formErrors.courseId}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Enrollment Status */}
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Enrollment Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.status}
                  helperText={formErrors.status}
                >
                  <MenuItem value="enrolled">Enrolled</MenuItem>
                  <MenuItem value="waitlisted">Waitlisted</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </TextField>
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  error={!!formErrors.startDate}
                  helperText={formErrors.startDate}
                />
              </Grid>

              {/* End Date */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.endDate}
                  helperText={formErrors.endDate}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Payment Information
                </Typography>
                <Divider />
              </Grid>

              {/* Payment Status */}
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Payment Status"
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </TextField>
              </Grid>

              {/* Payment Amount */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Payment Amount"
                  type="number"
                  name="paymentAmount"
                  value={formData.paymentAmount}
                  onChange={handleInputChange}
                  InputProps={{ startAdornment: '$' }}
                  error={!!formErrors.paymentAmount}
                  helperText={formErrors.paymentAmount}
                />
              </Grid>

              {/* Payment Method */}
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Payment Method"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  error={!!formErrors.paymentMethod}
                  helperText={formErrors.paymentMethod}
                >
                  <MenuItem value="credit">Credit Card</MenuItem>
                  <MenuItem value="debit">Debit Card</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="transfer">Bank Transfer</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Create Enrollment'}
                </Button>
                <Button
                  component={Link}
                  to="/enrollments"
                  variant="outlined"
                  sx={{ ml: 2 }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AddEnrollment;
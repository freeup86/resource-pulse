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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { createParent } from '../../services/parentService';

const AddParent = () => {
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
    address: '',
    city: '',
    state: '',
    zipCode: '',
    preferredContact: 'Email',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    notes: '',
  });

  // Form validation state
  const [errors, setErrors] = useState({});

  // Handle input change
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
    
    // Address validation
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP Code is required';
    
    // Emergency contact validation
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
    if (!formData.emergencyContactRelationship.trim()) newErrors.emergencyContactRelationship = 'Relationship is required';
    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (!/^[\d\s()-+]{10,15}$/.test(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = 'Phone number format is invalid';
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
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API
      const parentData = {
        ...formData,
        address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone,
        },
        joinDate: new Date().toISOString().split('T')[0],
      };
      
      // Remove properties that are not part of the API model
      delete parentData.city;
      delete parentData.state;
      delete parentData.zipCode;
      delete parentData.emergencyContactName;
      delete parentData.emergencyContactRelationship;
      delete parentData.emergencyContactPhone;
      
      // Call API to create parent
      // In a real app, this would call the API
      // const response = await createParent(parentData);
      
      // For demonstration, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      setSuccess(true);
      
      // Navigate to parent list after short delay
      setTimeout(() => {
        navigate('/parents');
      }, 1500);
    } catch (err) {
      console.error('Error creating parent:', err);
      setError('Failed to create parent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonAddIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" component="h1">
            Add New Parent
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Parent created successfully! Redirecting to parent list...
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
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
          </Grid>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Address
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Street Address"
                value={formData.address}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.address}
                helperText={errors.address}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                name="city"
                label="City"
                value={formData.city}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.city}
                helperText={errors.city}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                name="state"
                label="State"
                value={formData.state}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.state}
                helperText={errors.state}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="zipCode"
                label="ZIP Code"
                value={formData.zipCode}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.zipCode}
                helperText={errors.zipCode}
                disabled={loading}
              />
            </Grid>
          </Grid>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Contact Preferences
          </Typography>
          
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Preferred Contact Method</FormLabel>
            <RadioGroup
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleChange}
              row
            >
              <FormControlLabel value="Email" control={<Radio />} label="Email" />
              <FormControlLabel value="Phone" control={<Radio />} label="Phone" />
              <FormControlLabel value="Both" control={<Radio />} label="Both" />
            </RadioGroup>
          </FormControl>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Emergency Contact
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="emergencyContactName"
                label="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.emergencyContactName}
                helperText={errors.emergencyContactName}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="emergencyContactRelationship"
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.emergencyContactRelationship}
                helperText={errors.emergencyContactRelationship}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="emergencyContactPhone"
                label="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.emergencyContactPhone}
                helperText={errors.emergencyContactPhone}
                disabled={loading}
                placeholder="(555) 123-4567"
              />
            </Grid>
          </Grid>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Additional Information
          </Typography>
          
          <TextField
            name="notes"
            label="Notes"
            value={formData.notes}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            disabled={loading}
            placeholder="Add any additional notes about this parent..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Add any special instructions, preferences, or other information about this parent.">
                    <IconButton edge="end">
                      <HelpIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/parents')}
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
              {loading ? 'Saving...' : 'Save Parent'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddParent;
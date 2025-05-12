import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Build as BuildIcon,
  Cancel as CancelIcon,
  DateRange as DateRangeIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { createEquipment } from '../../services/equipmentService';

const AddEquipment = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'available',
    acquisitionDate: new Date(),
    warrantyExpiration: null,
    purchasePrice: '',
    currentLocation: 'Storage',
    notes: '',
    specifications: ''
  });

  const equipmentTypes = [
    'Robot Kit',
    'Microcontroller',
    'Sensor',
    'Motor',
    'Battery',
    'Tool',
    'Computer',
    'Tablet',
    'Display',
    'Accessory',
    'Other'
  ];

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Equipment name is required';
    if (!formData.type) errors.type = 'Equipment type is required';
    if (!formData.manufacturer.trim()) errors.manufacturer = 'Manufacturer is required';
    
    if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
      errors.purchasePrice = 'Price must be a valid number';
    }
    
    // Validate dates
    if (formData.acquisitionDate && formData.warrantyExpiration) {
      if (new Date(formData.acquisitionDate) > new Date(formData.warrantyExpiration)) {
        errors.warrantyExpiration = 'Warranty expiration must be after acquisition date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleDateChange = (field, date) => {
    setFormData({
      ...formData,
      [field]: date
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createEquipment(formData);
      navigate(`/equipment/${result.id}`);
    } catch (err) {
      setError('Failed to create equipment. Please try again.');
      console.error('Error creating equipment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          component={Link}
          to="/equipment"
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Add New Equipment
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Basic Information
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Equipment Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!formErrors.name}
              helperText={formErrors.name || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              error={!!formErrors.type}
              disabled={isSubmitting}
            >
              <InputLabel id="equipment-type-label">Equipment Type *</InputLabel>
              <Select
                labelId="equipment-type-label"
                name="type"
                value={formData.type}
                label="Equipment Type *"
                onChange={handleChange}
              >
                {equipmentTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              error={!!formErrors.manufacturer}
              helperText={formErrors.manufacturer || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Serial Number"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth
              disabled={isSubmitting}
            >
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleChange}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="in use">In Use</MenuItem>
                <MenuItem value="maintenance">Under Maintenance</MenuItem>
                <MenuItem value="damaged">Damaged</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" color="primary" gutterBottom>
          Acquisition Details
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Acquisition Date"
                value={formData.acquisitionDate}
                onChange={(date) => handleDateChange('acquisitionDate', date)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <DateRangeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                disabled={isSubmitting}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Warranty Expiration"
                value={formData.warrantyExpiration}
                onChange={(date) => handleDateChange('warrantyExpiration', date)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!formErrors.warrantyExpiration}
                    helperText={formErrors.warrantyExpiration || ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <DateRangeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                disabled={isSubmitting}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Purchase Price"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon />
                  </InputAdornment>
                ),
              }}
              error={!!formErrors.purchasePrice}
              helperText={formErrors.purchasePrice || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Location"
              name="currentLocation"
              value={formData.currentLocation}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" color="primary" gutterBottom>
          Additional Information
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Specifications"
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              multiline
              rows={4}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={4}
              disabled={isSubmitting}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            component={Link}
            to="/equipment"
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{ mr: 2 }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={24} /> : <SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Equipment'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddEquipment;
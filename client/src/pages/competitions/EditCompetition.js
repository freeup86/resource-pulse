import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Event as EventIcon, 
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { competitionService } from '../../services/competitionService';

const EditCompetition = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  const [ageCategory, setAgeCategory] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: null,
    endDate: null,
    registrationDeadline: null,
    location: '',
    registrationFee: '',
    ageCategories: [],
    maxTeams: ''
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    location: '',
    registrationFee: ''
  });

  useEffect(() => {
    const fetchCompetitionData = async () => {
      try {
        setInitialLoading(true);
        const data = await competitionService.getCompetitionById(id);
        
        // Ensure dates are Date objects
        const formattedData = {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
          registrationFee: data.registrationFee ? data.registrationFee.toString() : '',
          maxTeams: data.maxTeams ? data.maxTeams.toString() : ''
        };
        
        setFormData(formattedData);
        setOriginalData(JSON.stringify(formattedData)); // Store the original data for change detection
      } catch (err) {
        console.error('Error fetching competition data:', err);
        setError('Failed to load competition. Please try again later.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCompetitionData();
  }, [id]);

  // Check for unsaved changes
  useEffect(() => {
    if (originalData) {
      // Compare current form data with original data
      setHasChanges(JSON.stringify(formData) !== originalData);
    }
  }, [formData, originalData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
    
    // Clear error when user selects a date
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleAgeCategoryAdd = () => {
    if (ageCategory && !formData.ageCategories.includes(ageCategory)) {
      setFormData({
        ...formData,
        ageCategories: [...formData.ageCategories, ageCategory]
      });
      setAgeCategory('');
    }
  };

  const handleAgeCategoryDelete = (categoryToDelete) => {
    setFormData({
      ...formData,
      ageCategories: formData.ageCategories.filter(category => category !== categoryToDelete)
    });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { ...formErrors };
    
    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Competition name is required';
      valid = false;
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
      valid = false;
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
      valid = false;
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
      valid = false;
    }
    
    // Date validations
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
      valid = false;
    }
    
    if (formData.registrationDeadline && formData.startDate && 
        formData.registrationDeadline > formData.startDate) {
      newErrors.registrationDeadline = 'Registration deadline must be before start date';
      valid = false;
    }
    
    // Fee validation
    if (formData.registrationFee && isNaN(parseFloat(formData.registrationFee))) {
      newErrors.registrationFee = 'Registration fee must be a valid number';
      valid = false;
    }
    
    if (formData.maxTeams && (isNaN(parseInt(formData.maxTeams)) || parseInt(formData.maxTeams) <= 0)) {
      newErrors.maxTeams = 'Maximum teams must be a positive number';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format the data for API
      const competitionData = {
        ...formData,
        registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : 0,
        maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null
      };
      
      await competitionService.updateCompetition(id, competitionData);
      
      setSuccessMessage('Competition updated successfully!');
      setHasChanges(false);
      setOriginalData(JSON.stringify(formData)); // Update original data
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        navigate(`/competitions/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating competition:', err);
      setError('Failed to update competition. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setDiscardDialogOpen(true);
    } else {
      navigate(`/competitions/${id}`);
    }
  };

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !formData.name) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          component={Link}
          to="/competitions"
        >
          Return to Competitions
        </Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button 
            component={Link} 
            to={`/competitions/${id}`} 
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Competition
          </Button>
          <Typography variant="h4" component="h1">
            Edit Competition
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Competition Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Competition Name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Start Date *"
                  value={formData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.startDate,
                      helperText: formErrors.startDate,
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="End Date *"
                  value={formData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.endDate,
                      helperText: formErrors.endDate,
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Registration Deadline"
                  value={formData.registrationDeadline}
                  onChange={(date) => handleDateChange('registrationDeadline', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!formErrors.registrationDeadline,
                      helperText: formErrors.registrationDeadline,
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  error={!!formErrors.location}
                  helperText={formErrors.location}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Registration Fee"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleInputChange}
                  error={!!formErrors.registrationFee}
                  helperText={formErrors.registrationFee}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Maximum Teams"
                  name="maxTeams"
                  type="number"
                  value={formData.maxTeams}
                  onChange={handleInputChange}
                  error={!!formErrors.maxTeams}
                  helperText={formErrors.maxTeams}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ mt: 1, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Age Categories
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="age-category-label">Age Category</InputLabel>
                    <Select
                      labelId="age-category-label"
                      value={ageCategory}
                      onChange={(e) => setAgeCategory(e.target.value)}
                      label="Age Category"
                    >
                      <MenuItem value="Elementary (6-10)">Elementary (6-10)</MenuItem>
                      <MenuItem value="Middle School (11-13)">Middle School (11-13)</MenuItem>
                      <MenuItem value="High School (14-18)">High School (14-18)</MenuItem>
                      <MenuItem value="College (18+)">College (18+)</MenuItem>
                      <MenuItem value="Open">Open</MenuItem>
                    </Select>
                  </FormControl>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleAgeCategoryAdd}
                    startIcon={<AddIcon />}
                    disabled={!ageCategory}
                  >
                    Add Category
                  </Button>
                </Stack>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.ageCategories && formData.ageCategories.length > 0 ? (
                    formData.ageCategories.map((category, index) => (
                      <Chip
                        key={index}
                        label={category}
                        onDelete={() => handleAgeCategoryDelete(category)}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No age categories added yet
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button 
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={loading || !hasChanges}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
        
        {/* Discard Changes Dialog */}
        <Dialog
          open={discardDialogOpen}
          onClose={() => setDiscardDialogOpen(false)}
        >
          <DialogTitle>Discard Changes?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You have unsaved changes. Are you sure you want to discard them?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiscardDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => navigate(`/competitions/${id}`)} 
              color="error"
            >
              Discard Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default EditCompetition;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Fab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  School as SchoolIcon,
  Cancel as CancelIcon,
  DateRange as DateRangeIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { getSchoolById, updateSchool, getSchoolContacts, getSchoolPrograms } from '../../services/schoolService';

const EditSchool = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [programToDelete, setProgramToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    district: '',
    partnership: {
      contractId: '',
      startDate: null,
      endDate: null,
      terms: ''
    },
    contacts: [],
    programs: []
  });

  const fetchSchoolData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [schoolData, contactsData, programsData] = await Promise.all([
        getSchoolById(id),
        getSchoolContacts(id),
        getSchoolPrograms(id)
      ]);
      
      setFormData({
        ...schoolData,
        contacts: contactsData,
        programs: programsData,
        partnership: {
          contractId: schoolData.partnership?.contractId || '',
          startDate: schoolData.partnership?.startDate ? new Date(schoolData.partnership.startDate) : null,
          endDate: schoolData.partnership?.endDate ? new Date(schoolData.partnership.endDate) : null,
          terms: schoolData.partnership?.terms || ''
        }
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch school details. Please try again later.');
      console.error('Error loading school details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolData();
  }, [id]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'School name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.zip.trim()) errors.zip = 'Zip code is required';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Partnership validation
    if (formData.partnership.startDate && formData.partnership.endDate) {
      if (new Date(formData.partnership.startDate) >= new Date(formData.partnership.endDate)) {
        errors['partnership.endDate'] = 'End date must be after start date';
      }
    }
    
    // Contact validation
    formData.contacts.forEach((contact, index) => {
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        errors[`contacts[${index}].email`] = 'Invalid email format';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      contacts: updatedContacts
    });
  };
  
  const handleProgramChange = (index, field, value) => {
    const updatedPrograms = [...formData.programs];
    updatedPrograms[index] = {
      ...updatedPrograms[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      programs: updatedPrograms
    });
  };
  
  const handleDateChange = (field, date) => {
    setFormData({
      ...formData,
      partnership: {
        ...formData.partnership,
        [field]: date
      }
    });
  };
  
  const addNewContact = () => {
    setFormData({
      ...formData,
      contacts: [
        ...formData.contacts,
        { name: '', role: '', email: '', phone: '' }
      ]
    });
  };
  
  const addNewProgram = () => {
    setFormData({
      ...formData,
      programs: [
        ...formData.programs,
        { name: '', gradeLevel: '', duration: '', description: '' }
      ]
    });
  };
  
  const openDeleteContactDialog = (index) => {
    setContactToDelete(index);
    setConfirmDialog(true);
  };
  
  const openDeleteProgramDialog = (index) => {
    setProgramToDelete(index);
    setConfirmDialog(true);
  };
  
  const handleDeleteConfirm = () => {
    if (contactToDelete !== null) {
      const updatedContacts = [...formData.contacts];
      updatedContacts.splice(contactToDelete, 1);
      setFormData({
        ...formData,
        contacts: updatedContacts
      });
      setContactToDelete(null);
    }
    
    if (programToDelete !== null) {
      const updatedPrograms = [...formData.programs];
      updatedPrograms.splice(programToDelete, 1);
      setFormData({
        ...formData,
        programs: updatedPrograms
      });
      setProgramToDelete(null);
    }
    
    setConfirmDialog(false);
  };
  
  const handleDeleteCancel = () => {
    setContactToDelete(null);
    setProgramToDelete(null);
    setConfirmDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Filter out empty contacts
      const filteredContacts = formData.contacts.filter(
        contact => contact.name.trim() !== '' || contact.email.trim() !== ''
      );
      
      const schoolData = {
        ...formData,
        contacts: filteredContacts
      };
      
      await updateSchool(id, schoolData);
      navigate(`/schools/${id}`);
    } catch (err) {
      setError('Failed to update school. Please try again.');
      console.error('Error updating school:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          component={Link}
          to={`/schools/${id}`}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Edit School: {formData.name}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          School Information
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="School Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!formErrors.name}
              helperText={formErrors.name || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={!!formErrors.address}
              helperText={formErrors.address || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={!!formErrors.city}
              helperText={formErrors.city || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              error={!!formErrors.state}
              helperText={formErrors.state || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              required
              fullWidth
              label="Zip Code"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              error={!!formErrors.zip}
              helperText={formErrors.zip || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email || ''}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="School District"
              name="district"
              value={formData.district}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" color="primary" gutterBottom>
          Partnership Details
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contract ID"
              name="partnership.contractId"
              value={formData.partnership.contractId}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Terms"
              name="partnership.terms"
              value={formData.partnership.terms}
              onChange={handleChange}
              multiline
              rows={2}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={formData.partnership.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
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
                label="End Date"
                value={formData.partnership.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!formErrors['partnership.endDate']}
                    helperText={formErrors['partnership.endDate'] || ''}
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
        </Grid>

        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="primary">
            School Contacts
          </Typography>
          <Tooltip title="Add Contact">
            <Fab 
              size="small" 
              color="primary" 
              onClick={addNewContact} 
              disabled={isSubmitting}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
        
        {formData.contacts.map((contact, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                Contact #{index + 1}
              </Typography>
              <IconButton 
                color="error" 
                onClick={() => openDeleteContactDialog(index)}
                disabled={isSubmitting}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={contact.name}
                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role"
                  value={contact.role}
                  onChange={(e) => handleContactChange(index, 'role', e.target.value)}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                  error={!!formErrors[`contacts[${index}].email`]}
                  helperText={formErrors[`contacts[${index}].email`] || ''}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={contact.phone}
                  onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                  disabled={isSubmitting}
                />
              </Grid>
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="primary">
            Programs Offered
          </Typography>
          <Tooltip title="Add Program">
            <Fab 
              size="small" 
              color="primary" 
              onClick={addNewProgram} 
              disabled={isSubmitting}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
        
        {formData.programs.map((program, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                Program #{index + 1}
              </Typography>
              <IconButton 
                color="error" 
                onClick={() => openDeleteProgramDialog(index)}
                disabled={isSubmitting}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Program Name"
                  value={program.name}
                  onChange={(e) => handleProgramChange(index, 'name', e.target.value)}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Grade Level"
                  value={program.gradeLevel}
                  onChange={(e) => handleProgramChange(index, 'gradeLevel', e.target.value)}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration"
                  value={program.duration}
                  onChange={(e) => handleProgramChange(index, 'duration', e.target.value)}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={program.description}
                  onChange={(e) => handleProgramChange(index, 'description', e.target.value)}
                  multiline
                  rows={2}
                  disabled={isSubmitting}
                />
              </Grid>
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            component={Link}
            to={`/schools/${id}`}
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
            {isSubmitting ? 'Saving...' : 'Update School'}
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>
          {contactToDelete !== null ? "Delete Contact" : "Delete Program"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {contactToDelete !== null 
              ? "Are you sure you want to delete this contact? This action cannot be undone."
              : "Are you sure you want to delete this program? This action cannot be undone."
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditSchool;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { settingsService } from '../../services/settingsService';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SystemSettings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Organization settings
  const [organizationSettings, setOrganizationSettings] = useState({
    name: '',
    logo: null,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    phone: '',
    email: '',
    website: '',
    taxId: ''
  });
  
  // Locations
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    capacity: '',
    type: 'classroom'
  });
  
  // User roles and permissions
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: []
  });
  
  const availablePermissions = [
    { id: 'view_students', name: 'View Students' },
    { id: 'manage_students', name: 'Manage Students' },
    { id: 'view_courses', name: 'View Courses' },
    { id: 'manage_courses', name: 'Manage Courses' },
    { id: 'view_instructors', name: 'View Instructors' },
    { id: 'manage_instructors', name: 'Manage Instructors' },
    { id: 'view_competitions', name: 'View Competitions' },
    { id: 'manage_competitions', name: 'Manage Competitions' },
    { id: 'view_reports', name: 'View Reports' },
    { id: 'manage_settings', name: 'Manage Settings' },
    { id: 'admin_access', name: 'Admin Access' }
  ];
  
  // System preferences
  const [systemPreferences, setSystemPreferences] = useState({
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    sessionTimeout: 30,
    dataRetentionPeriod: 365,
    enableStudentPortal: true,
    enableParentPortal: true,
    allowPublicRegistration: false,
    requireInstructorApproval: true
  });

  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await settingsService.getSystemSettings();
        
        // Update organization settings
        if (data.organization) {
          setOrganizationSettings(data.organization);
        }
        
        // Update locations
        if (data.locations && Array.isArray(data.locations)) {
          setLocations(data.locations);
        }
        
        // Update roles
        if (data.roles && Array.isArray(data.roles)) {
          setRoles(data.roles);
        }
        
        // Update system preferences
        if (data.preferences) {
          setSystemPreferences(data.preferences);
        }
      } catch (err) {
        console.error('Error fetching system settings:', err);
        setError('Failed to load system settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSystemSettings();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Organization settings handlers
  const handleOrganizationChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setOrganizationSettings({
        ...organizationSettings,
        [parent]: {
          ...organizationSettings[parent],
          [child]: value
        }
      });
    } else {
      setOrganizationSettings({
        ...organizationSettings,
        [name]: value
      });
    }
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a file reader to read the image
      const reader = new FileReader();
      reader.onload = () => {
        setOrganizationSettings({
          ...organizationSettings,
          logo: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Location handlers
  const handleLocationInputChange = (e) => {
    const { name, value } = e.target;
    setNewLocation({
      ...newLocation,
      [name]: value
    });
  };

  const handleAddLocation = () => {
    if (newLocation.name && newLocation.address) {
      const locationToAdd = {
        ...newLocation,
        id: Date.now().toString(),
        capacity: newLocation.capacity ? parseInt(newLocation.capacity) : null
      };
      
      setLocations([...locations, locationToAdd]);
      
      // Reset form
      setNewLocation({
        name: '',
        address: '',
        capacity: '',
        type: 'classroom'
      });
    }
  };

  const handleDeleteLocation = (locationId) => {
    setItemToDelete({ type: 'location', id: locationId });
    setDeleteDialogOpen(true);
  };

  // Role handlers
  const handleRoleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRole({
      ...newRole,
      [name]: value
    });
  };

  const handlePermissionsChange = (event, newPermissions) => {
    setNewRole({
      ...newRole,
      permissions: newPermissions.map(p => p.id)
    });
  };

  const handleAddRole = () => {
    if (newRole.name) {
      const roleToAdd = {
        ...newRole,
        id: Date.now().toString()
      };
      
      setRoles([...roles, roleToAdd]);
      
      // Reset form
      setNewRole({
        name: '',
        description: '',
        permissions: []
      });
    }
  };

  const handleDeleteRole = (roleId) => {
    setItemToDelete({ type: 'role', id: roleId });
    setDeleteDialogOpen(true);
  };

  // System preferences handlers
  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setSystemPreferences({
      ...systemPreferences,
      [name]: value
    });
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setSystemPreferences({
      ...systemPreferences,
      [name]: checked
    });
  };

  // Delete dialog handlers
  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'location') {
        setLocations(locations.filter(loc => loc.id !== itemToDelete.id));
      } else if (itemToDelete.type === 'role') {
        setRoles(roles.filter(role => role.id !== itemToDelete.id));
      }
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const dataToSave = {
        organization: organizationSettings,
        locations,
        roles,
        preferences: systemPreferences
      };
      
      await settingsService.updateSystemSettings(dataToSave);
      
      setSuccess('System settings updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error updating system settings:', err);
      setError('Failed to update system settings. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        System Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="system settings tabs">
            <Tab 
              icon={<BusinessIcon />} 
              iconPosition="start" 
              label="Organization" 
              id="settings-tab-0" 
              aria-controls="settings-tabpanel-0" 
            />
            <Tab 
              icon={<LocationIcon />} 
              iconPosition="start" 
              label="Locations" 
              id="settings-tab-1" 
              aria-controls="settings-tabpanel-1" 
            />
            <Tab 
              icon={<SecurityIcon />} 
              iconPosition="start" 
              label="Roles & Permissions" 
              id="settings-tab-2" 
              aria-controls="settings-tabpanel-2" 
            />
            <Tab 
              icon={<SchoolIcon />} 
              iconPosition="start" 
              label="System Preferences" 
              id="settings-tab-3" 
              aria-controls="settings-tabpanel-3" 
            />
          </Tabs>
        </Box>
        
        {/* Organization Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Box position="relative" mr={3}>
                  {organizationSettings.logo ? (
                    <img 
                      src={organizationSettings.logo} 
                      alt="Organization Logo" 
                      style={{ width: 100, height: 100, objectFit: 'contain' }}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        bgcolor: 'background.default', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '1px dashed grey'
                      }}
                    >
                      <BusinessIcon color="disabled" sx={{ fontSize: 48 }} />
                    </Box>
                  )}
                  <label htmlFor="logo-upload">
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoChange}
                    />
                    <IconButton 
                      color="primary"
                      aria-label="upload logo"
                      component="span"
                      sx={{ 
                        position: 'absolute', 
                        right: -10, 
                        bottom: -10,
                        backgroundColor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': {
                          backgroundColor: 'background.default'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </label>
                </Box>
                <Box>
                  <Typography variant="h6">
                    Organization Logo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload your organization's logo (recommended size: 200x200px)
                  </Typography>
                  <Box mt={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      component="label"
                      htmlFor="logo-upload"
                    >
                      Change Logo
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Organization Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                name="name"
                required
                value={organizationSettings.name}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={organizationSettings.phone}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={organizationSettings.email}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={organizationSettings.website}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax ID / EIN"
                name="taxId"
                value={organizationSettings.taxId}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="address.street"
                value={organizationSettings.address.street}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="address.city"
                value={organizationSettings.address.city}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State / Province"
                name="address.state"
                value={organizationSettings.address.state}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Zip / Postal Code"
                name="address.zipCode"
                value={organizationSettings.address.zipCode}
                onChange={handleOrganizationChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="country-label">Country</InputLabel>
                <Select
                  labelId="country-label"
                  name="address.country"
                  value={organizationSettings.address.country}
                  onChange={handleOrganizationChange}
                  label="Country"
                >
                  <MenuItem value="USA">United States</MenuItem>
                  <MenuItem value="CAN">Canada</MenuItem>
                  <MenuItem value="MEX">Mexico</MenuItem>
                  <MenuItem value="GBR">United Kingdom</MenuItem>
                  <MenuItem value="AUS">Australia</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Locations */}
        <TabPanel value={tabValue} index={1}>
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Teaching Locations
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage the locations where your organization holds classes and events.
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Add New Location
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Location Name"
                    name="name"
                    required
                    value={newLocation.name}
                    onChange={handleLocationInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    required
                    value={newLocation.address}
                    onChange={handleLocationInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Capacity"
                    name="capacity"
                    type="number"
                    value={newLocation.capacity}
                    onChange={handleLocationInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel id="location-type-label">Type</InputLabel>
                    <Select
                      labelId="location-type-label"
                      name="type"
                      value={newLocation.type}
                      onChange={handleLocationInputChange}
                      label="Type"
                    >
                      <MenuItem value="classroom">Classroom</MenuItem>
                      <MenuItem value="lab">Lab</MenuItem>
                      <MenuItem value="field">Field</MenuItem>
                      <MenuItem value="event_space">Event Space</MenuItem>
                      <MenuItem value="virtual">Virtual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddLocation}
                    disabled={!newLocation.name || !newLocation.address}
                  >
                    Add Location
                  </Button>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper>
              <List>
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <ListItem key={location.id} divider>
                      <ListItemText
                        primary={location.name}
                        secondary={
                          <>
                            <span>{location.address}</span>
                            <br />
                            <span>
                              {location.capacity ? `Capacity: ${location.capacity} • ` : ''}
                              Type: {location.type.charAt(0).toUpperCase() + location.type.slice(1).replace('_', ' ')}
                            </span>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleDeleteLocation(location.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No locations added yet" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>
        </TabPanel>
        
        {/* Roles & Permissions */}
        <TabPanel value={tabValue} index={2}>
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              User Roles & Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure access levels for different types of users in your organization.
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Add New Role
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Role Name"
                    name="name"
                    required
                    value={newRole.name}
                    onChange={handleRoleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={newRole.description}
                    onChange={handleRoleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={availablePermissions}
                    getOptionLabel={(option) => option.name}
                    value={availablePermissions.filter(p => newRole.permissions.includes(p.id))}
                    onChange={handlePermissionsChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Permissions"
                        placeholder="Select permissions"
                      />
                    )}
                    renderTags={(selectedPermissions, getTagProps) =>
                      selectedPermissions.map((permission, index) => (
                        <Chip
                          label={permission.name}
                          {...getTagProps({ index })}
                          key={permission.id}
                        />
                      ))
                    }
                  />
                </Grid>
                
                <Grid item xs={12} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddRole}
                    disabled={!newRole.name}
                  >
                    Add Role
                  </Button>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper>
              <List>
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <ListItem key={role.id} divider>
                      <ListItemText
                        primary={role.name}
                        secondary={
                          <>
                            <span>{role.description}</span>
                            <br />
                            <Box sx={{ mt: 1 }}>
                              {role.permissions.map(permId => {
                                const perm = availablePermissions.find(p => p.id === permId);
                                return perm ? (
                                  <Chip
                                    key={permId}
                                    label={perm.name}
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ) : null;
                              })}
                            </Box>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleDeleteRole(role.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No roles added yet" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>
        </TabPanel>
        
        {/* System Preferences */}
        <TabPanel value={tabValue} index={3}>
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              System Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure global settings for your robotics education platform.
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="date-format-label">Date Format</InputLabel>
                    <Select
                      labelId="date-format-label"
                      name="dateFormat"
                      value={systemPreferences.dateFormat}
                      onChange={handlePreferenceChange}
                      label="Date Format"
                    >
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="time-format-label">Time Format</InputLabel>
                    <Select
                      labelId="time-format-label"
                      name="timeFormat"
                      value={systemPreferences.timeFormat}
                      onChange={handlePreferenceChange}
                      label="Time Format"
                    >
                      <MenuItem value="12h">12-hour (AM/PM)</MenuItem>
                      <MenuItem value="24h">24-hour</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="default-language-label">Default Language</InputLabel>
                    <Select
                      labelId="default-language-label"
                      name="defaultLanguage"
                      value={systemPreferences.defaultLanguage}
                      onChange={handlePreferenceChange}
                      label="Default Language"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="default-currency-label">Default Currency</InputLabel>
                    <Select
                      labelId="default-currency-label"
                      name="defaultCurrency"
                      value={systemPreferences.defaultCurrency}
                      onChange={handlePreferenceChange}
                      label="Default Currency"
                    >
                      <MenuItem value="USD">US Dollar ($)</MenuItem>
                      <MenuItem value="EUR">Euro (€)</MenuItem>
                      <MenuItem value="GBP">British Pound (£)</MenuItem>
                      <MenuItem value="CAD">Canadian Dollar (C$)</MenuItem>
                      <MenuItem value="AUD">Australian Dollar (A$)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Session Timeout (minutes)"
                    name="sessionTimeout"
                    type="number"
                    InputProps={{ inputProps: { min: 5, max: 120 } }}
                    value={systemPreferences.sessionTimeout}
                    onChange={handlePreferenceChange}
                    helperText="Time before a user is automatically logged out due to inactivity"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Retention Period (days)"
                    name="dataRetentionPeriod"
                    type="number"
                    InputProps={{ inputProps: { min: 30 } }}
                    value={systemPreferences.dataRetentionPeriod}
                    onChange={handlePreferenceChange}
                    helperText="Period to retain user data before automatic archiving"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Portal & Registration Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={systemPreferences.enableStudentPortal}
                        onChange={handleToggleChange}
                        name="enableStudentPortal"
                        color="primary"
                      />
                    }
                    label="Enable Student Portal"
                  />
                  <FormHelperText>Allow students to access their own dashboard</FormHelperText>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={systemPreferences.enableParentPortal}
                        onChange={handleToggleChange}
                        name="enableParentPortal"
                        color="primary"
                      />
                    }
                    label="Enable Parent Portal"
                  />
                  <FormHelperText>Allow parents to manage their children's accounts</FormHelperText>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={systemPreferences.allowPublicRegistration}
                        onChange={handleToggleChange}
                        name="allowPublicRegistration"
                        color="primary"
                      />
                    }
                    label="Allow Public Registration"
                  />
                  <FormHelperText>Allow new users to register without an invitation</FormHelperText>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={systemPreferences.requireInstructorApproval}
                        onChange={handleToggleChange}
                        name="requireInstructorApproval"
                        color="primary"
                      />
                    }
                    label="Require Instructor Approval for Registrations"
                  />
                  <FormHelperText>Require approval before student can join a course</FormHelperText>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </TabPanel>
        
        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </form>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {itemToDelete && itemToDelete.type === 'location'
              ? 'Are you sure you want to delete this location? This action cannot be undone.'
              : 'Are you sure you want to delete this role? This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;
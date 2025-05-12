import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { settingsService } from '../../services/settingsService';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [notificationSettings, setNotificationSettings] = useState({
    // Application notifications
    applicationEnabled: true,
    upcomingCompetitions: true,
    endingRegistration: true,
    newTeamRegistrations: true,
    competitionResults: true,
    staffAssignments: true,
    systemAnnouncements: true,
    // Email notifications
    emailEnabled: true,
    emailDigest: 'daily',
    emailAddress: '',
    // SMS notifications
    smsEnabled: false,
    phoneNumber: '',
    competitionReminders: false,
    emergencyAlerts: true
  });
  
  const [customChannels, setCustomChannels] = useState([]);
  const [newChannel, setNewChannel] = useState('');

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await settingsService.getNotificationSettings();
        setNotificationSettings({
          // Application notifications
          applicationEnabled: data.applicationEnabled ?? true,
          upcomingCompetitions: data.upcomingCompetitions ?? true,
          endingRegistration: data.endingRegistration ?? true,
          newTeamRegistrations: data.newTeamRegistrations ?? true,
          competitionResults: data.competitionResults ?? true,
          staffAssignments: data.staffAssignments ?? true,
          systemAnnouncements: data.systemAnnouncements ?? true,
          // Email notifications
          emailEnabled: data.emailEnabled ?? true,
          emailDigest: data.emailDigest || 'daily',
          emailAddress: data.emailAddress || '',
          // SMS notifications
          smsEnabled: data.smsEnabled ?? false,
          phoneNumber: data.phoneNumber || '',
          competitionReminders: data.competitionReminders ?? false,
          emergencyAlerts: data.emergencyAlerts ?? true
        });
        
        if (data.customChannels && Array.isArray(data.customChannels)) {
          setCustomChannels(data.customChannels);
        }
      } catch (err) {
        console.error('Error fetching notification settings:', err);
        setError('Failed to load notification settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotificationSettings();
  }, []);

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: value
    });
  };

  const handleAddCustomChannel = () => {
    if (newChannel.trim() && !customChannels.includes(newChannel.trim())) {
      setCustomChannels([...customChannels, newChannel.trim()]);
      setNewChannel('');
    }
  };

  const handleRemoveCustomChannel = (channelToRemove) => {
    setCustomChannels(customChannels.filter(channel => channel !== channelToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const dataToSave = {
        ...notificationSettings,
        customChannels
      };
      
      await settingsService.updateNotificationSettings(dataToSave);
      
      setSuccess('Notification settings updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Failed to update notification settings. Please try again later.');
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
        Notification Preferences
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
        <Grid container spacing={3}>
          {/* Application Notifications */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">In-App Notifications</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={notificationSettings.applicationEnabled}
                    onChange={handleSwitchChange}
                    name="applicationEnabled"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="subtitle1" fontWeight={500}>
                    Enable in-app notifications
                  </Typography>
                }
              />
              
              <Box mt={2} pl={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notificationSettings.upcomingCompetitions}
                          onChange={handleSwitchChange}
                          name="upcomingCompetitions"
                          color="primary"
                          disabled={!notificationSettings.applicationEnabled}
                        />
                      }
                      label="Upcoming competitions"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notificationSettings.endingRegistration}
                          onChange={handleSwitchChange}
                          name="endingRegistration"
                          color="primary"
                          disabled={!notificationSettings.applicationEnabled}
                        />
                      }
                      label="Registration deadlines"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notificationSettings.newTeamRegistrations}
                          onChange={handleSwitchChange}
                          name="newTeamRegistrations"
                          color="primary"
                          disabled={!notificationSettings.applicationEnabled}
                        />
                      }
                      label="New team registrations"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notificationSettings.competitionResults}
                          onChange={handleSwitchChange}
                          name="competitionResults"
                          color="primary"
                          disabled={!notificationSettings.applicationEnabled}
                        />
                      }
                      label="Competition results"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notificationSettings.staffAssignments}
                          onChange={handleSwitchChange}
                          name="staffAssignments"
                          color="primary"
                          disabled={!notificationSettings.applicationEnabled}
                        />
                      }
                      label="Staff assignments"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notificationSettings.systemAnnouncements}
                          onChange={handleSwitchChange}
                          name="systemAnnouncements"
                          color="primary"
                          disabled={!notificationSettings.applicationEnabled}
                        />
                      }
                      label="System announcements"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
          
          {/* Email Notifications */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <EmailIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Email Notifications</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={notificationSettings.emailEnabled}
                    onChange={handleSwitchChange}
                    name="emailEnabled"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="subtitle1" fontWeight={500}>
                    Enable email notifications
                  </Typography>
                }
              />
              
              <Box mt={3}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="emailAddress"
                  type="email"
                  value={notificationSettings.emailAddress}
                  onChange={handleInputChange}
                  disabled={!notificationSettings.emailEnabled}
                  sx={{ mb: 3 }}
                />
                
                <FormControl fullWidth disabled={!notificationSettings.emailEnabled}>
                  <InputLabel id="email-digest-label">Email Digest Frequency</InputLabel>
                  <Select
                    labelId="email-digest-label"
                    name="emailDigest"
                    value={notificationSettings.emailDigest}
                    onChange={handleInputChange}
                    label="Email Digest Frequency"
                  >
                    <MenuItem value="daily">Daily Digest</MenuItem>
                    <MenuItem value="weekly">Weekly Digest</MenuItem>
                    <MenuItem value="immediate">Send Immediately</MenuItem>
                    <MenuItem value="none">No Digest</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Grid>
          
          {/* SMS Notifications */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <SmsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">SMS Notifications</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={notificationSettings.smsEnabled}
                    onChange={handleSwitchChange}
                    name="smsEnabled"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="subtitle1" fontWeight={500}>
                    Enable SMS notifications
                  </Typography>
                }
              />
              
              <Box mt={3}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={notificationSettings.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!notificationSettings.smsEnabled}
                  sx={{ mb: 3 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notificationSettings.competitionReminders}
                      onChange={handleSwitchChange}
                      name="competitionReminders"
                      color="primary"
                      disabled={!notificationSettings.smsEnabled}
                    />
                  }
                  label="Competition reminders"
                />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notificationSettings.emergencyAlerts}
                      onChange={handleSwitchChange}
                      name="emergencyAlerts"
                      color="primary"
                      disabled={!notificationSettings.smsEnabled}
                    />
                  }
                  label="Emergency alerts"
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* Custom Notification Channels */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationsActiveIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Custom Notification Channels</Typography>
              </Box>
              
              <Box mb={3} display="flex" alignItems="flex-start">
                <TextField
                  label="Add New Channel (e.g., Slack, Teams, Discord)"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  sx={{ flexGrow: 1, mr: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddCustomChannel}
                  startIcon={<AddIcon />}
                  disabled={!newChannel.trim()}
                >
                  Add
                </Button>
              </Box>
              
              {customChannels.length > 0 ? (
                <List dense>
                  {customChannels.map((channel, index) => (
                    <ListItem key={index} divider={index < customChannels.length - 1}>
                      <ListItemText 
                        primary={channel} 
                        secondary="Integration details can be configured in system settings"
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveCustomChannel(channel)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No custom notification channels added yet
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Save Button */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default NotificationSettings;
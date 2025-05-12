import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  History as HistoryIcon,
  DevicesOther as DevicesIcon,
  PhonelinkLock as TwoFactorIcon
} from '@mui/icons-material';
import { settingsService } from '../../services/settingsService';

const SecuritySettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [deviceToRevoke, setDeviceToRevoke] = useState(null);
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    unusualActivityAlerts: true,
    preventMultipleSessions: false,
    sessionTimeout: 30
  });
  
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch security settings
        const data = await settingsService.getSecuritySettings();
        
        setSecuritySettings({
          twoFactorEnabled: data.twoFactorEnabled ?? false,
          loginNotifications: data.loginNotifications ?? true,
          unusualActivityAlerts: data.unusualActivityAlerts ?? true,
          preventMultipleSessions: data.preventMultipleSessions ?? false,
          sessionTimeout: data.sessionTimeout ?? 30
        });
        
        // Fetch connected devices
        if (data.connectedDevices && Array.isArray(data.connectedDevices)) {
          setConnectedDevices(data.connectedDevices);
        }
        
        // Fetch login history
        if (data.loginHistory && Array.isArray(data.loginHistory)) {
          setLoginHistory(data.loginHistory);
        }
      } catch (err) {
        console.error('Error fetching security settings:', err);
        setError('Failed to load security settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSecurityData();
  }, []);

  const handleSettingChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'sessionTimeout') {
      setSecuritySettings({
        ...securitySettings,
        [name]: Number(value)
      });
    } else {
      setSecuritySettings({
        ...securitySettings,
        [name]: checked
      });
    }
  };

  const handleEnableTwoFactor = () => {
    setActionType('enable2fa');
    setConfirmDialogOpen(true);
  };

  const handleDisableTwoFactor = () => {
    setActionType('disable2fa');
    setConfirmDialogOpen(true);
  };

  const handleRevokeDevice = (deviceId) => {
    setDeviceToRevoke(deviceId);
    setActionType('revokeDevice');
    setConfirmDialogOpen(true);
  };

  const handleRevokeAllDevices = () => {
    setActionType('revokeAllDevices');
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setActionType(null);
    setDeviceToRevoke(null);
  };

  const handleConfirmDialogAction = async () => {
    try {
      setSaving(true);

      // If actionType is null or undefined, just close the dialog
      if (!actionType) {
        handleConfirmDialogClose();
        return;
      }

      switch (actionType) {
        case 'enable2fa':
          await settingsService.enableTwoFactor();
          setSecuritySettings({
            ...securitySettings,
            twoFactorEnabled: true
          });
          setSuccess('Two-factor authentication has been enabled.');
          break;

        case 'disable2fa':
          await settingsService.disableTwoFactor();
          setSecuritySettings({
            ...securitySettings,
            twoFactorEnabled: false
          });
          setSuccess('Two-factor authentication has been disabled.');
          break;

        case 'revokeDevice':
          if (deviceToRevoke) {
            await settingsService.revokeDevice(deviceToRevoke);
            setConnectedDevices(connectedDevices.filter(device => device.id !== deviceToRevoke));
            setSuccess('Device has been revoked successfully.');
          }
          break;

        case 'revokeAllDevices':
          await settingsService.revokeAllDevices();
          setConnectedDevices([]);
          setSuccess('All devices have been revoked successfully.');
          break;

        default:
          // Handle unknown action types
          console.warn(`Unknown action type: ${actionType}`);
          break;
      }
    } catch (err) {
      console.error('Error performing security action:', err);
      setError('Failed to perform the requested action. Please try again later.');
    } finally {
      setSaving(false);
      handleConfirmDialogClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await settingsService.updateSecuritySettings(securitySettings);
      
      setSuccess('Security settings updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error updating security settings:', err);
      setError('Failed to update security settings. Please try again later.');
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
        Security Settings
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
          {/* Two-Factor Authentication */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <TwoFactorIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Two-Factor Authentication</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Add an extra layer of security to your account by requiring a verification code in addition to your password when signing in.
              </Typography>
              
              <Box display="flex" alignItems="center" mt={2}>
                <Box flexGrow={1}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {securitySettings.twoFactorEnabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
                  </Typography>
                  {securitySettings.twoFactorEnabled && (
                    <Typography variant="body2" color="text.secondary">
                      You'll be asked for a verification code when signing in from an unrecognized device.
                    </Typography>
                  )}
                </Box>
                
                <Button
                  variant="contained"
                  color={securitySettings.twoFactorEnabled ? "error" : "primary"}
                  onClick={securitySettings.twoFactorEnabled ? handleDisableTwoFactor : handleEnableTwoFactor}
                  disabled={saving}
                >
                  {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Security Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Security Preferences</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={securitySettings.loginNotifications}
                        onChange={handleSettingChange}
                        name="loginNotifications"
                        color="primary"
                      />
                    }
                    label="Email me when there's a new login to my account"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={securitySettings.unusualActivityAlerts}
                        onChange={handleSettingChange}
                        name="unusualActivityAlerts"
                        color="primary"
                      />
                    }
                    label="Alert me about unusual account activity"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={securitySettings.preventMultipleSessions}
                        onChange={handleSettingChange}
                        name="preventMultipleSessions"
                        color="primary"
                      />
                    }
                    label="Prevent multiple active sessions (signing in elsewhere will log you out here)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Session Timeout (minutes)"
                    name="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={handleSettingChange}
                    InputProps={{ inputProps: { min: 5, max: 120 } }}
                    helperText="Time before you're automatically logged out due to inactivity"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Connected Devices */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <DevicesIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Connected Devices</Typography>
              </Box>
              
              <List dense>
                {connectedDevices.length > 0 ? (
                  connectedDevices.map((device) => (
                    <ListItem key={device.id} divider>
                      <ListItemText
                        primary={device.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary">
                              {device.browser} • {device.os}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              Last active: {device.lastActive}
                            </Typography>
                            {device.current && (
                              <Chip 
                                label="Current" 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        {!device.current && (
                          <IconButton edge="end" onClick={() => handleRevokeDevice(device.id)}>
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No connected devices found" />
                  </ListItem>
                )}
              </List>
              
              {connectedDevices.length > 1 && (
                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleRevokeAllDevices}
                    disabled={saving}
                  >
                    Revoke All Other Devices
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Login History */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Login History</Typography>
              </Box>
              
              <List dense>
                {loginHistory.length > 0 ? (
                  loginHistory.map((login, index) => (
                    <ListItem key={index} divider={index < loginHistory.length - 1}>
                      <ListItemText
                        primary={`${login.date} • ${login.time}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {login.browser} on {login.os}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              IP: {login.ip} • Location: {login.location}
                            </Typography>
                            {login.status === 'success' ? (
                              <Chip 
                                label="Successful" 
                                size="small" 
                                color="success" 
                                sx={{ ml: 1 }} 
                              />
                            ) : (
                              <Chip 
                                label="Failed" 
                                size="small" 
                                color="error" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No login history available" />
                  </ListItem>
                )}
              </List>
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
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmDialogClose}
      >
        <DialogTitle>
          {actionType === 'enable2fa' && 'Enable Two-Factor Authentication'}
          {actionType === 'disable2fa' && 'Disable Two-Factor Authentication'}
          {actionType === 'revokeDevice' && 'Revoke Device Access'}
          {actionType === 'revokeAllDevices' && 'Revoke All Devices'}
          {!actionType && 'Confirm Action'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'enable2fa' && 'This will enable two-factor authentication for your account. You will need to set up an authenticator app. Do you want to continue?'}
            {actionType === 'disable2fa' && 'This will disable two-factor authentication for your account, making it less secure. Are you sure you want to continue?'}
            {actionType === 'revokeDevice' && 'This will revoke access for the selected device. The user will need to sign in again. Do you want to continue?'}
            {actionType === 'revokeAllDevices' && 'This will revoke access for all devices except your current one. All other users will need to sign in again. Do you want to continue?'}
            {!actionType && 'Are you sure you want to perform this action?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button
            onClick={handleConfirmDialogAction}
            color={actionType === 'disable2fa' || (actionType && actionType.includes('revoke')) ? 'error' : 'primary'}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySettings;
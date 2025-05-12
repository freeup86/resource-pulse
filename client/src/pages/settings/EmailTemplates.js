import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tab,
  Tabs,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  ContentCopy as DuplicateIcon,
  Refresh as ResetIcon
} from '@mui/icons-material';
import { settingsService } from '../../services/settingsService';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`email-template-tabpanel-${index}`}
      aria-labelledby={`email-template-tab-${index}`}
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

const EmailTemplates = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [templateCategories, setTemplateCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState({
    id: null,
    name: '',
    subject: '',
    content: '',
    category: '',
    variables: []
  });
  const [newTemplateName, setNewTemplateName] = useState('');
  
  const openMenu = Boolean(menuAnchorEl);
  
  useEffect(() => {
    const fetchEmailTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await settingsService.getEmailTemplates();
        
        if (data.categories && Array.isArray(data.categories)) {
          setTemplateCategories(data.categories);
        }
        
        if (data.templates && Array.isArray(data.templates)) {
          setTemplates(data.templates);
          
          // Set initial template if available
          if (data.templates.length > 0) {
            setCurrentTemplate(data.templates[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching email templates:', err);
        setError('Failed to load email templates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmailTemplates();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleMenuClick = (event, template) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleTemplateSelect = (template) => {
    setCurrentTemplate(template);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTemplate({
      ...currentTemplate,
      [name]: value
    });
  };
  
  const handleOpenDialog = (action) => {
    setDialogAction(action);
    setDialogOpen(true);
    handleMenuClose();
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogAction(null);
  };
  
  const handleDialogAction = async () => {
    try {
      setSaving(true);
      
      switch (dialogAction) {
        case 'delete':
          await settingsService.deleteEmailTemplate(selectedTemplate.id);
          setTemplates(templates.filter(t => t.id !== selectedTemplate.id));
          
          // If we deleted the current template, select another one
          if (currentTemplate.id === selectedTemplate.id) {
            const remainingTemplates = templates.filter(t => t.id !== selectedTemplate.id);
            if (remainingTemplates.length > 0) {
              setCurrentTemplate(remainingTemplates[0]);
            } else {
              setCurrentTemplate({
                id: null,
                name: '',
                subject: '',
                content: '',
                category: '',
                variables: []
              });
            }
          }
          
          setSuccess('Email template deleted successfully!');
          break;
          
        case 'duplicate':
          const duplicatedTemplate = await settingsService.duplicateEmailTemplate(selectedTemplate.id, `${selectedTemplate.name} (Copy)`);
          setTemplates([...templates, duplicatedTemplate]);
          setSuccess('Email template duplicated successfully!');
          break;
          
        case 'reset':
          const resetTemplate = await settingsService.resetEmailTemplate(selectedTemplate.id);
          setTemplates(templates.map(t => t.id === resetTemplate.id ? resetTemplate : t));
          
          // Update current template if it's the one being reset
          if (currentTemplate.id === resetTemplate.id) {
            setCurrentTemplate(resetTemplate);
          }
          
          setSuccess('Email template reset to default successfully!');
          break;
          
        case 'create':
          if (newTemplateName.trim()) {
            const newTemplate = await settingsService.createEmailTemplate({
              name: newTemplateName,
              subject: 'New Email Subject',
              content: 'Your email content here.',
              category: templateCategories[0]
            });
            
            setTemplates([...templates, newTemplate]);
            setCurrentTemplate(newTemplate);
            setNewTemplateName('');
            setSuccess('New email template created successfully!');
          }
          break;
          
        default:
          break;
      }
    } catch (err) {
      console.error('Error performing template action:', err);
      setError('Failed to perform the requested action. Please try again later.');
    } finally {
      setSaving(false);
      handleCloseDialog();
    }
  };
  
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const updatedTemplate = await settingsService.updateEmailTemplate(currentTemplate);
      
      // Update templates list with the updated template
      setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
      
      setSuccess('Email template saved successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error saving email template:', err);
      setError('Failed to save email template. Please try again later.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle tab category filtering
  const filteredTemplates = tabValue === 0 
    ? templates 
    : templates.filter(t => t.category === templateCategories[tabValue - 1]);
  
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
        Email Templates
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
      
      <Grid container spacing={3}>
        {/* Template Categories Tabs */}
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              aria-label="email template categories"
            >
              <Tab label="All Templates" id="email-template-tab-0" aria-controls="email-template-tabpanel-0" />
              {templateCategories.map((category, index) => (
                <Tab 
                  key={index} 
                  label={category} 
                  id={`email-template-tab-${index + 1}`} 
                  aria-controls={`email-template-tabpanel-${index + 1}`}
                />
              ))}
            </Tabs>
          </Box>
        </Grid>
        
        {/* Template List and Editor */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
              <Typography variant="subtitle1" fontWeight={500}>
                Templates
              </Typography>
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={() => handleOpenDialog('create')}
              >
                New
              </Button>
            </Box>
            <Divider />
            <List sx={{ maxHeight: 500, overflow: 'auto' }}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <ListItem 
                    key={template.id} 
                    button
                    selected={currentTemplate.id === template.id}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <ListItemText 
                      primary={template.name}
                      secondary={template.category}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={(e) => handleMenuClick(e, template)}
                        aria-label="template options"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No templates found" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {currentTemplate.id ? (
            <Paper sx={{ p: 3 }}>
              <form onSubmit={handleSaveTemplate}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">{currentTemplate.name}</Typography>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </Button>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Template Name"
                      name="name"
                      value={currentTemplate.name}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="template-category-label">Category</InputLabel>
                      <Select
                        labelId="template-category-label"
                        name="category"
                        value={currentTemplate.category}
                        onChange={handleInputChange}
                        label="Category"
                      >
                        {templateCategories.map((category, index) => (
                          <MenuItem key={index} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Subject"
                      name="subject"
                      value={currentTemplate.subject}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Content"
                      name="content"
                      value={currentTemplate.content}
                      onChange={handleInputChange}
                      multiline
                      rows={10}
                      required
                    />
                  </Grid>
                  
                  {currentTemplate.variables && currentTemplate.variables.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Variables
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {currentTemplate.variables.map((variable, index) => (
                          <Button 
                            key={index} 
                            variant="outlined" 
                            size="small"
                            sx={{ textTransform: 'none' }}
                            onClick={() => {
                              const content = `${currentTemplate.content}{{${variable}}}`;
                              setCurrentTemplate({
                                ...currentTemplate,
                                content
                              });
                            }}
                          >
                            {`{{${variable}}}`}
                          </Button>
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </form>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <EmailIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" align="center" gutterBottom>
                No Template Selected
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Select a template from the list or create a new one.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('create')}
                sx={{ mt: 2 }}
              >
                Create New Template
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Template Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={openMenu}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOpenDialog('duplicate')}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => handleOpenDialog('reset')}>
          <ResetIcon fontSize="small" sx={{ mr: 1 }} />
          Reset to Default
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenDialog('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
      
      {/* Confirmation Dialogs */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
      >
        {dialogAction === 'create' ? (
          <>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Enter a name for your new email template.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Template Name"
                fullWidth
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button 
                onClick={handleDialogAction} 
                color="primary"
                disabled={!newTemplateName.trim()}
              >
                Create
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>
              {dialogAction === 'delete' && 'Delete Template'}
              {dialogAction === 'duplicate' && 'Duplicate Template'}
              {dialogAction === 'reset' && 'Reset Template'}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                {dialogAction === 'delete' && `Are you sure you want to delete the template "${selectedTemplate?.name}"? This action cannot be undone.`}
                {dialogAction === 'duplicate' && `Are you sure you want to duplicate the template "${selectedTemplate?.name}"?`}
                {dialogAction === 'reset' && `Are you sure you want to reset the template "${selectedTemplate?.name}" to its default state? This will overwrite any changes you've made.`}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button 
                onClick={handleDialogAction} 
                color={dialogAction === 'delete' ? 'error' : 'primary'}
              >
                {dialogAction === 'delete' && 'Delete'}
                {dialogAction === 'duplicate' && 'Duplicate'}
                {dialogAction === 'reset' && 'Reset'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default EmailTemplates;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  AttachMoney as PaymentIcon,
  CalendarToday as CalendarIcon,
  Comment as CommentIcon,
  Add as AddIcon,
  CheckCircle as PaidIcon,
  Pending as PendingIcon,
  Cancel as CancelledIcon,
} from '@mui/icons-material';
import { getParentById, deleteParent, addCommunicationLog } from '../../services/parentService';

// Mock parent data (would be from API in production)
const mockParentDetails = {
  id: '1',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.j@example.com',
  phone: '(555) 123-4567',
  address: '123 Oak St, Anytown, CA 94123',
  students: [
    { id: '1', name: 'Alex Johnson', grade: '7th', courses: ['Robotics 101', 'Competition Prep'] }
  ],
  paymentHistory: [
    { id: '1', date: '2023-10-01', amount: 250.00, status: 'Paid', method: 'Credit Card', description: 'Robotics 101 - October' },
    { id: '2', date: '2023-09-01', amount: 250.00, status: 'Paid', method: 'Credit Card', description: 'Robotics 101 - September' },
    { id: '3', date: '2023-08-01', amount: 250.00, status: 'Paid', method: 'Credit Card', description: 'Robotics 101 - August' },
    { id: '4', date: '2023-07-15', amount: 75.00, status: 'Paid', method: 'Credit Card', description: 'Registration Fee' }
  ],
  communicationLogs: [
    { id: '1', date: '2023-10-15', type: 'Email', subject: 'Schedule Change', notes: 'Informed about the holiday schedule', createdBy: 'Admin' },
    { id: '2', date: '2023-09-20', type: 'Phone', subject: 'Payment Reminder', notes: 'Left voicemail about upcoming payment', createdBy: 'Admin' },
    { id: '3', date: '2023-08-12', type: 'Email', subject: 'Welcome', notes: 'Sent welcome email with orientation details', createdBy: 'System' },
    { id: '4', date: '2023-07-15', type: 'In Person', subject: 'Registration', notes: 'Completed registration paperwork and discussed program details', createdBy: 'Admin' }
  ],
  preferredContact: 'Email',
  notes: 'Sarah prefers to be contacted in the evenings after 6pm. Interested in volunteering for the next competition.',
  emergencyContact: {
    name: 'John Johnson',
    relationship: 'Spouse',
    phone: '(555) 234-5678'
  },
  joinDate: '2023-07-15'
};

const ParentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commDialogOpen, setCommDialogOpen] = useState(false);
  const [newComm, setNewComm] = useState({
    type: 'Email',
    subject: '',
    notes: ''
  });
  const [commError, setCommError] = useState(null);

  // Fetch parent data
  useEffect(() => {
    const fetchParentData = async () => {
      setLoading(true);
      try {
        // In a real app, this would call the API
        // const data = await getParentById(id);
        
        // For demonstration, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        setParent(mockParentDetails);
        setError(null);
      } catch (err) {
        console.error('Error fetching parent:', err);
        setError('Failed to load parent details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, [id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Confirm parent deletion
  const handleDeleteConfirm = async () => {
    try {
      // In a real app, this would call the API
      // await deleteParent(id);
      
      // For demonstration, we'll just navigate back
      navigate('/parents');
    } catch (err) {
      console.error('Error deleting parent:', err);
      setError('Failed to delete parent. Please try again.');
      setDeleteDialogOpen(false);
    }
  };

  // Open communication log dialog
  const handleAddCommClick = () => {
    setCommDialogOpen(true);
  };

  // Close communication log dialog
  const handleCommCancel = () => {
    setCommDialogOpen(false);
    setNewComm({
      type: 'Email',
      subject: '',
      notes: ''
    });
    setCommError(null);
  };

  // Handle input change for new communication log
  const handleCommChange = (e) => {
    const { name, value } = e.target;
    setNewComm({
      ...newComm,
      [name]: value
    });
  };

  // Add new communication log
  const handleCommSubmit = async () => {
    // Validation
    if (!newComm.subject.trim()) {
      setCommError('Subject is required');
      return;
    }
    if (!newComm.notes.trim()) {
      setCommError('Notes are required');
      return;
    }

    try {
      // In a real app, this would call the API
      // await addCommunicationLog(id, newComm);
      
      // For demonstration, we'll update the state
      const newEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        type: newComm.type,
        subject: newComm.subject,
        notes: newComm.notes,
        createdBy: 'Admin'
      };
      
      setParent({
        ...parent,
        communicationLogs: [newEntry, ...parent.communicationLogs]
      });
      
      // Close the dialog
      handleCommCancel();
    } catch (err) {
      console.error('Error adding communication log:', err);
      setCommError('Failed to add communication log. Please try again.');
    }
  };

  // Render payment status badge
  const renderPaymentStatus = (status) => {
    let icon;
    let color;
    
    switch (status.toLowerCase()) {
      case 'paid':
        icon = <PaidIcon />;
        color = 'success';
        break;
      case 'pending':
        icon = <PendingIcon />;
        color = 'warning';
        break;
      case 'cancelled':
        icon = <CancelledIcon />;
        color = 'error';
        break;
      default:
        icon = <PaymentIcon />;
        color = 'default';
    }
    
    return (
      <Chip 
        icon={icon} 
        label={status} 
        color={color} 
        size="small" 
        variant={status.toLowerCase() === 'paid' ? 'filled' : 'outlined'} 
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/parents')}
        >
          Back to Parents
        </Button>
      </Container>
    );
  }

  if (!parent) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 3 }}>
          Parent not found.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/parents')}
        >
          Back to Parents
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        {/* Header with actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {`${parent.firstName} ${parent.lastName}`}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ mr: 1 }}
              onClick={() => navigate(`/parents/edit/${id}`)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Left column - Parent info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardHeader 
                title="Contact Information" 
                avatar={<PersonIcon color="primary" />} 
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={parent.email} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Phone" 
                      secondary={parent.phone} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Address" 
                      secondary={parent.address} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Join Date" 
                      secondary={new Date(parent.joinDate).toLocaleDateString()} 
                    />
                  </ListItem>
                </List>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preferred Contact Method
                  </Typography>
                  <Chip 
                    label={parent.preferredContact} 
                    color={
                      parent.preferredContact === 'Email' ? 'primary' :
                      parent.preferredContact === 'Phone' ? 'secondary' : 'default'
                    }
                  />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardHeader 
                title="Emergency Contact" 
                avatar={<PhoneIcon color="error" />} 
              />
              <CardContent>
                <Typography variant="subtitle1">
                  {parent.emergencyContact.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {parent.emergencyContact.relationship}
                </Typography>
                <Typography variant="body1">
                  {parent.emergencyContact.phone}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader 
                title="Notes" 
                avatar={<CommentIcon color="primary" />} 
              />
              <CardContent>
                <Typography variant="body2">
                  {parent.notes || 'No notes available.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right column - Tabs content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ width: '100%' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Students" id="tab-0" />
                <Tab label="Payment History" id="tab-1" />
                <Tab label="Communication Log" id="tab-2" />
              </Tabs>

              {/* Students Tab */}
              {tabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Linked Students
                    </Typography>
                  </Box>
                  {parent.students.length > 0 ? (
                    <List>
                      {parent.students.map((student) => (
                        <Paper key={student.id} sx={{ mb: 2, p: 1 }}>
                          <ListItem
                            button
                            onClick={() => navigate(`/students/${student.id}`)}
                            component="div"
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <SchoolIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={student.name}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2">
                                    Grade: {student.grade}
                                  </Typography>
                                  <Box sx={{ mt: 1 }}>
                                    {student.courses && student.courses.map((course, index) => (
                                      <Chip
                                        key={index}
                                        label={course}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                    ))}
                                  </Box>
                                </>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Tooltip title="View Student Details">
                                <IconButton 
                                  edge="end" 
                                  onClick={() => navigate(`/students/${student.id}`)}
                                >
                                  <PersonIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </Paper>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No students linked
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/students/add?parentId=${id}`)}
                      >
                        Add Student
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Payment History Tab */}
              {tabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Payment History
                    </Typography>
                  </Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table aria-label="payment history table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parent.paymentHistory.map((payment) => (
                          <TableRow hover key={payment.id}>
                            <TableCell>
                              {new Date(payment.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{payment.description}</TableCell>
                            <TableCell>${payment.amount.toFixed(2)}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>
                              {renderPaymentStatus(payment.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {parent.paymentHistory.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Box sx={{ py: 3 }}>
                                <Typography variant="body1" color="text.secondary">
                                  No payment history available
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Communication Log Tab */}
              {tabValue === 2 && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Communication Log
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddCommClick}
                    >
                      Add Entry
                    </Button>
                  </Box>
                  {parent.communicationLogs.length > 0 ? (
                    <List>
                      {parent.communicationLogs.map((log) => (
                        <Paper key={log.id} sx={{ mb: 2, p: 1 }}>
                          <ListItem component="div">
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: 
                                  log.type === 'Email' ? 'primary.main' : 
                                  log.type === 'Phone' ? 'secondary.main' : 
                                  'info.main' 
                              }}>
                                {log.type === 'Email' ? <EmailIcon /> : 
                                 log.type === 'Phone' ? <PhoneIcon /> : 
                                 <CommentIcon />}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="subtitle1">
                                    {log.subject}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(log.date).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" 
                                    sx={{ display: 'block', color: 'text.primary', mb: 1 }}
                                  >
                                    Type: {log.type}
                                  </Typography>
                                  <Typography 
                                    component="span" 
                                    variant="body2"
                                    sx={{ whiteSpace: 'pre-wrap' }}
                                  >
                                    {log.notes}
                                  </Typography>
                                  <Typography component="div" variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    Added by: {log.createdBy}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        </Paper>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CommentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No communication logs
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                        onClick={handleAddCommClick}
                      >
                        Add Communication Log
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete {`${parent.firstName} ${parent.lastName}`}? This action cannot be undone and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add communication log dialog */}
      <Dialog
        open={commDialogOpen}
        onClose={handleCommCancel}
        aria-labelledby="comm-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="comm-dialog-title">Add Communication Log</DialogTitle>
        <DialogContent>
          {commError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {commError}
            </Alert>
          )}
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              select
              label="Communication Type"
              fullWidth
              name="type"
              value={newComm.type}
              onChange={handleCommChange}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="In Person">In Person</option>
              <option value="Text Message">Text Message</option>
            </TextField>
            <TextField
              label="Subject"
              fullWidth
              name="subject"
              value={newComm.subject}
              onChange={handleCommChange}
              margin="normal"
              required
            />
            <TextField
              label="Notes"
              fullWidth
              name="notes"
              value={newComm.notes}
              onChange={handleCommChange}
              margin="normal"
              required
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCommCancel}>Cancel</Button>
          <Button onClick={handleCommSubmit} color="primary">
            Add Log
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ParentDetails;
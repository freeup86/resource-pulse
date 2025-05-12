import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, Chip, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, CardHeader, CircularProgress, Alert, Tab, Tabs,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  List, ListItem, ListItemText, ListItemIcon, MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  PersonOutline as PersonIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as PaymentIcon,
  Assignment as AssignmentIcon,
  CheckCircleOutline as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import enrollmentService from '../../services/enrollmentService';

const statusColors = {
  enrolled: 'success',
  waitlisted: 'warning',
  cancelled: 'error',
  completed: 'info'
};

const EnrollmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [progressDialog, setProgressDialog] = useState(false);
  
  // Form states
  const [attendanceForm, setAttendanceForm] = useState({
    date: '',
    status: 'present',
    notes: ''
  });
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'credit',
    date: '',
    notes: ''
  });
  
  const [progressForm, setProgressForm] = useState({
    date: '',
    moduleCompleted: '',
    score: '',
    notes: ''
  });

  useEffect(() => {
    fetchEnrollmentDetails();
  }, [id]);

  const fetchEnrollmentDetails = async () => {
    setLoading(true);
    try {
      const data = await enrollmentService.getEnrollmentById(id);
      setEnrollment(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching enrollment details:', err);
      setError('Failed to load enrollment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle attendance dialog
  const openAttendanceDialog = () => {
    setAttendanceForm({
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      notes: ''
    });
    setAttendanceDialog(true);
  };

  const handleAttendanceFormChange = (e) => {
    const { name, value } = e.target;
    setAttendanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitAttendance = async () => {
    try {
      await enrollmentService.recordAttendance(id, attendanceForm);
      setAttendanceDialog(false);
      fetchEnrollmentDetails();
    } catch (err) {
      console.error('Error recording attendance:', err);
      setError('Failed to record attendance. Please try again.');
    }
  };

  // Handle payment dialog
  const openPaymentDialog = () => {
    setPaymentForm({
      amount: '',
      method: 'credit',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setPaymentDialog(true);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitPayment = async () => {
    try {
      await enrollmentService.recordPayment(id, paymentForm);
      setPaymentDialog(false);
      fetchEnrollmentDetails();
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Failed to record payment. Please try again.');
    }
  };

  // Handle progress dialog
  const openProgressDialog = () => {
    setProgressForm({
      date: new Date().toISOString().split('T')[0],
      moduleCompleted: '',
      score: '',
      notes: ''
    });
    setProgressDialog(true);
  };

  const handleProgressFormChange = (e) => {
    const { name, value } = e.target;
    setProgressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitProgress = async () => {
    try {
      await enrollmentService.updateProgress(id, progressForm);
      setProgressDialog(false);
      fetchEnrollmentDetails();
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress. Please try again.');
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

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            component={Link}
            to="/enrollments"
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            Back to Enrollments
          </Button>
        </Box>
      </Container>
    );
  }

  if (!enrollment) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="warning">Enrollment not found</Alert>
          <Button
            component={Link}
            to="/enrollments"
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            Back to Enrollments
          </Button>
        </Box>
      </Container>
    );
  }

  const generateAttendanceData = () => {
    if (!enrollment.attendance || enrollment.attendance.length === 0) {
      return [];
    }
    
    return enrollment.attendance.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      status: item.status === 'present' ? 1 : 0
    }));
  };

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
          <Button
            component={Link}
            to={`/enrollments/edit/${id}`}
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Edit Enrollment
          </Button>
        </Box>

        {/* Enrollment Header */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" component="h1" gutterBottom>
                {enrollment.student?.name || 'Unknown Student'}'s Enrollment
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {enrollment.course?.title || 'Unknown Course'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} container justifyContent="flex-end" alignItems="center">
              <Box>
                <Typography variant="body2" color="textSecondary" align="right">
                  Status
                </Typography>
                <Chip 
                  label={enrollment.status} 
                  color={statusColors[enrollment.status] || 'default'}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ width: '100%', mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="enrollment details tabs">
              <Tab label="Overview" />
              <Tab label="Attendance" />
              <Tab label="Payments" />
              <Tab label="Progress" />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          {tabValue === 0 && (
            <Box sx={{ py: 3 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Student Information" />
                    <Divider />
                    <CardContent>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Name" 
                            secondary={enrollment.student?.name || 'N/A'} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Email" 
                            secondary={enrollment.student?.email || 'N/A'} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Phone" 
                            secondary={enrollment.student?.phone || 'N/A'} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Course Information" />
                    <Divider />
                    <CardContent>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <SchoolIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Course Title" 
                            secondary={enrollment.course?.title || 'N/A'} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Duration" 
                            secondary={enrollment.course?.duration || 'N/A'} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SchoolIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Instructor" 
                            secondary={enrollment.course?.instructor || 'N/A'} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Enrollment Details" />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Enrollment Date
                          </Typography>
                          <Typography variant="body1">
                            {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Start Date
                          </Typography>
                          <Typography variant="body1">
                            {new Date(enrollment.startDate).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            End Date
                          </Typography>
                          <Typography variant="body1">
                            {enrollment.endDate 
                              ? new Date(enrollment.endDate).toLocaleDateString() 
                              : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Payment Status
                          </Typography>
                          <Chip 
                            label={enrollment.paymentStatus} 
                            color={enrollment.paymentStatus === 'paid' ? 'success' : 'warning'}
                            size="small" 
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Attendance Tab */}
          {tabValue === 1 && (
            <Box sx={{ py: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" component="h2">
                  Attendance Records
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={openAttendanceDialog}
                >
                  Record Attendance
                </Button>
              </Box>

              {enrollment.attendance && enrollment.attendance.length > 0 ? (
                <>
                  <Paper sx={{ mb: 4 }}>
                    <Box sx={{ height: 250, p: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={generateAttendanceData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis ticks={[0, 1]} domain={[0, 1]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="status" stroke="#8884d8" name="Attendance" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>

                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Notes</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {enrollment.attendance.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip 
                                label={record.status} 
                                color={record.status === 'present' ? 'success' : 'error'}
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>{record.notes || '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">No attendance records found</Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Payments Tab */}
          {tabValue === 2 && (
            <Box sx={{ py: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" component="h2">
                  Payment History
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={openPaymentDialog}
                >
                  Record Payment
                </Button>
              </Box>

              {enrollment.payments && enrollment.payments.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enrollment.payments.map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                          <TableCell>${payment.amount.toFixed(2)}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>
                            <Chip 
                              label={payment.status} 
                              color={payment.status === 'completed' ? 'success' : 'warning'}
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{payment.notes || '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small">
                              <PdfIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">No payment records found</Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Progress Tab */}
          {tabValue === 3 && (
            <Box sx={{ py: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" component="h2">
                  Student Progress
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={openProgressDialog}
                >
                  Update Progress
                </Button>
              </Box>

              {enrollment.progress && enrollment.progress.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Module</TableCell>
                        <TableCell>Score/Grade</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enrollment.progress.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.moduleCompleted}</TableCell>
                          <TableCell>{record.score || '-'}</TableCell>
                          <TableCell>{record.notes || '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">No progress records found</Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialog} onClose={() => setAttendanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Attendance</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Date"
                  type="date"
                  name="date"
                  value={attendanceForm.date}
                  onChange={handleAttendanceFormChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Status"
                  name="status"
                  value={attendanceForm.status}
                  onChange={handleAttendanceFormChange}
                  margin="normal"
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="excused">Excused</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={attendanceForm.notes}
                  onChange={handleAttendanceFormChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceDialog(false)}>Cancel</Button>
          <Button onClick={submitAttendance} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Amount"
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handlePaymentFormChange}
                  InputProps={{ startAdornment: '$' }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Date"
                  type="date"
                  name="date"
                  value={paymentForm.date}
                  onChange={handlePaymentFormChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Payment Method"
                  name="method"
                  value={paymentForm.method}
                  onChange={handlePaymentFormChange}
                  margin="normal"
                >
                  <MenuItem value="credit">Credit Card</MenuItem>
                  <MenuItem value="debit">Debit Card</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="transfer">Bank Transfer</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentFormChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button onClick={submitPayment} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={progressDialog} onClose={() => setProgressDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Progress</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Date"
                  type="date"
                  name="date"
                  value={progressForm.date}
                  onChange={handleProgressFormChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Module Completed"
                  name="moduleCompleted"
                  value={progressForm.moduleCompleted}
                  onChange={handleProgressFormChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Score/Grade"
                  name="score"
                  value={progressForm.score}
                  onChange={handleProgressFormChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={progressForm.notes}
                  onChange={handleProgressFormChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialog(false)}>Cancel</Button>
          <Button onClick={submitProgress} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EnrollmentDetails;
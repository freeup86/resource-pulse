import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  CalendarToday as CalendarIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon,
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  ChangeCircle as ChangeCircleIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  getEquipmentById, 
  deleteEquipment, 
  getMaintenanceHistory,
  getCheckoutHistory,
  getEquipmentAllocations,
  addMaintenanceRecord,
  updateEquipmentStatus,
  checkoutEquipment,
  checkinEquipment
} from '../../services/equipmentService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`equipment-tabpanel-${index}`}
      aria-labelledby={`equipment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EquipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState({
    type: '',
    description: '',
    performedBy: '',
    date: new Date()
  });
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    checkedOutTo: '',
    purpose: '',
    expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // One week from now
  });

  const fetchEquipmentData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [equipmentData, maintenanceData, checkoutData, allocationsData] = await Promise.all([
        getEquipmentById(id),
        getMaintenanceHistory(id),
        getCheckoutHistory(id),
        getEquipmentAllocations(id)
      ]);
      
      setEquipment(equipmentData);
      setMaintenanceHistory(maintenanceData);
      setCheckoutHistory(checkoutData);
      setAllocations(allocationsData);
      setNewStatus(equipmentData.status); // Initialize status dialog with current status
      setError(null);
    } catch (err) {
      setError('Failed to fetch equipment details. Please try again later.');
      console.error('Error loading equipment details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
  }, [id]);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteEquipment = async () => {
    if (window.confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      try {
        await deleteEquipment(id);
        navigate('/equipment');
      } catch (err) {
        setError('Failed to delete equipment. Please try again.');
        console.error('Error deleting equipment:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleStatusDialogOpen = () => {
    setStatusDialogOpen(true);
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
  };

  const handleStatusChange = (event) => {
    setNewStatus(event.target.value);
  };

  const handleStatusUpdate = async () => {
    try {
      await updateEquipmentStatus(id, newStatus);
      setEquipment({ ...equipment, status: newStatus });
      setStatusDialogOpen(false);
    } catch (err) {
      setError('Failed to update equipment status. Please try again.');
      console.error('Error updating equipment status:', err);
    }
  };

  const handleMaintenanceDialogOpen = () => {
    setMaintenanceDialogOpen(true);
  };

  const handleMaintenanceDialogClose = () => {
    setMaintenanceDialogOpen(false);
  };

  const handleMaintenanceDataChange = (field, value) => {
    setMaintenanceData({
      ...maintenanceData,
      [field]: value
    });
  };

  const handleAddMaintenance = async () => {
    try {
      const result = await addMaintenanceRecord(id, maintenanceData);
      setMaintenanceHistory([result, ...maintenanceHistory]);
      setMaintenanceDialogOpen(false);
      // Reset form
      setMaintenanceData({
        type: '',
        description: '',
        performedBy: '',
        date: new Date()
      });
      // If maintenance is being performed, update status
      if (equipment.status !== 'maintenance') {
        await updateEquipmentStatus(id, 'maintenance');
        setEquipment({ ...equipment, status: 'maintenance' });
      }
    } catch (err) {
      setError('Failed to add maintenance record. Please try again.');
      console.error('Error adding maintenance record:', err);
    }
  };

  const handleCheckoutDialogOpen = () => {
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutDialogClose = () => {
    setCheckoutDialogOpen(false);
  };

  const handleCheckoutDataChange = (field, value) => {
    setCheckoutData({
      ...checkoutData,
      [field]: value
    });
  };

  const handleCheckoutEquipment = async () => {
    try {
      const result = await checkoutEquipment(id, checkoutData);
      setCheckoutHistory([result, ...checkoutHistory]);
      setCheckoutDialogOpen(false);
      // Update equipment status to 'in use'
      await updateEquipmentStatus(id, 'in use');
      setEquipment({ 
        ...equipment, 
        status: 'in use',
        currentLocation: `Checked out to ${checkoutData.checkedOutTo}`
      });
      // Reset form
      setCheckoutData({
        checkedOutTo: '',
        purpose: '',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    } catch (err) {
      setError('Failed to checkout equipment. Please try again.');
      console.error('Error checking out equipment:', err);
    }
  };

  const handleCheckinEquipment = async (checkoutId) => {
    if (window.confirm('Are you sure you want to check in this equipment?')) {
      try {
        await checkinEquipment(id, checkoutId);
        // Refresh checkout history
        const updatedHistory = await getCheckoutHistory(id);
        setCheckoutHistory(updatedHistory);
        // Update equipment status to 'available'
        await updateEquipmentStatus(id, 'available');
        setEquipment({
          ...equipment,
          status: 'available',
          currentLocation: 'Storage'
        });
      } catch (err) {
        setError('Failed to checkin equipment. Please try again.');
        console.error('Error checking in equipment:', err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in use':
        return 'primary';
      case 'maintenance':
        return 'warning';
      case 'damaged':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getMaintenanceTypeColor = (type) => {
    switch (type) {
      case 'routine':
        return 'success';
      case 'repair':
        return 'warning';
      case 'calibration':
        return 'info';
      case 'upgrade':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          component={Link}
          to="/equipment"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Equipment
        </Button>
      </Container>
    );
  }

  if (!equipment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Equipment not found</Alert>
        <Button
          component={Link}
          to="/equipment"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Equipment
        </Button>
      </Container>
    );
  }

  const isCheckedOut = equipment.status === 'in use';
  const activeCheckout = checkoutHistory.find(checkout => !checkout.returnDate);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton
          component={Link}
          to="/equipment"
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {equipment.name}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ChangeCircleIcon />}
          onClick={handleStatusDialogOpen}
          sx={{ mr: 2 }}
        >
          Update Status
        </Button>
        <Button
          component={Link}
          to={`/equipment/${id}/edit`}
          variant="outlined"
          startIcon={<EditIcon />}
          sx={{ mr: 2 }}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteEquipment}
        >
          Delete
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Equipment Information
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {equipment.type || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Manufacturer:</strong> {equipment.manufacturer || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Model:</strong> {equipment.model || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Serial Number:</strong> {equipment.serialNumber || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Acquisition Date:</strong> {formatDate(equipment.acquisitionDate)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Purchase Price:</strong> {equipment.purchasePrice 
                  ? `$${parseFloat(equipment.purchasePrice).toFixed(2)}` 
                  : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  <strong>Status:</strong>
                </Typography>
                <Chip
                  label={getStatusLabel(equipment.status)}
                  color={getStatusColor(equipment.status)}
                />
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>Current Location:</strong> {equipment.currentLocation || 'Storage'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Last Maintenance:</strong> {
                  maintenanceHistory.length > 0 
                    ? formatDate(maintenanceHistory[0].date) 
                    : 'No maintenance records'
                }
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Warranty Expiration:</strong> {formatDate(equipment.warrantyExpiration)}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                {equipment.status === 'available' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<InventoryIcon />}
                    onClick={handleCheckoutDialogOpen}
                    sx={{ mr: 2 }}
                  >
                    Check Out
                  </Button>
                )}
                
                {isCheckedOut && activeCheckout && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleCheckinEquipment(activeCheckout.id)}
                    sx={{ mr: 2 }}
                  >
                    Check In
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EngineeringIcon />}
                  onClick={handleMaintenanceDialogOpen}
                >
                  Log Maintenance
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<HistoryIcon />} label="Maintenance History" />
          <Tab icon={<InventoryIcon />} label="Checkout History" />
          <Tab icon={<SchoolIcon />} label="Course Allocations" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {maintenanceHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Performed By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                          color={getMaintenanceTypeColor(record.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.performedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No maintenance history available</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleMaintenanceDialogOpen}
                sx={{ mt: 2 }}
              >
                Log Maintenance
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {checkoutHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Checked Out Date</TableCell>
                    <TableCell>Checked Out To</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Expected Return</TableCell>
                    <TableCell>Return Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {checkoutHistory.map((checkout) => {
                    const isActive = !checkout.returnDate;
                    const isOverdue = isActive && new Date(checkout.expectedReturnDate) < new Date();
                    
                    return (
                      <TableRow key={checkout.id}>
                        <TableCell>{formatDate(checkout.checkoutDate)}</TableCell>
                        <TableCell>{checkout.checkedOutTo}</TableCell>
                        <TableCell>{checkout.purpose}</TableCell>
                        <TableCell>{formatDate(checkout.expectedReturnDate)}</TableCell>
                        <TableCell>{formatDate(checkout.returnDate)}</TableCell>
                        <TableCell>
                          {isActive ? (
                            <Chip 
                              label={isOverdue ? "Overdue" : "Checked Out"} 
                              color={isOverdue ? "error" : "primary"}
                              size="small"
                            />
                          ) : (
                            <Chip label="Returned" color="success" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {isActive && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleCheckinEquipment(checkout.id)}
                            >
                              Check In
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No checkout history available</Typography>
              {equipment.status === 'available' && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleCheckoutDialogOpen}
                  sx={{ mt: 2 }}
                >
                  Check Out Equipment
                </Button>
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {allocations.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>School</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allocations.map((allocation) => {
                    const now = new Date();
                    const startDate = new Date(allocation.startDate);
                    const endDate = new Date(allocation.endDate);
                    
                    let status = "Upcoming";
                    let statusColor = "info";
                    
                    if (now >= startDate && now <= endDate) {
                      status = "Active";
                      statusColor = "success";
                    } else if (now > endDate) {
                      status = "Completed";
                      statusColor = "default";
                    }
                    
                    return (
                      <TableRow key={allocation.id}>
                        <TableCell>{allocation.courseName}</TableCell>
                        <TableCell>{allocation.schoolName}</TableCell>
                        <TableCell>{formatDate(allocation.startDate)}</TableCell>
                        <TableCell>{formatDate(allocation.endDate)}</TableCell>
                        <TableCell>{allocation.quantity}</TableCell>
                        <TableCell>
                          <Chip 
                            label={status} 
                            color={statusColor}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No course allocations available</Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose}>
        <DialogTitle>Update Equipment Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={newStatus}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="in use">In Use</MenuItem>
              <MenuItem value="maintenance">Under Maintenance</MenuItem>
              <MenuItem value="damaged">Damaged</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Log Dialog */}
      <Dialog open={maintenanceDialogOpen} onClose={handleMaintenanceDialogClose}>
        <DialogTitle>Log Maintenance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="maintenance-type-label">Maintenance Type</InputLabel>
                <Select
                  labelId="maintenance-type-label"
                  value={maintenanceData.type}
                  label="Maintenance Type"
                  onChange={(e) => handleMaintenanceDataChange('type', e.target.value)}
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                  <MenuItem value="calibration">Calibration</MenuItem>
                  <MenuItem value="upgrade">Upgrade</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={maintenanceData.description}
                onChange={(e) => handleMaintenanceDataChange('description', e.target.value)}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Performed By"
                value={maintenanceData.performedBy}
                onChange={(e) => handleMaintenanceDataChange('performedBy', e.target.value)}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Maintenance Date"
                  value={maintenanceData.date}
                  onChange={(date) => handleMaintenanceDataChange('date', date)}
                  renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 1 }} />}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMaintenanceDialogClose}>Cancel</Button>
          <Button 
            onClick={handleAddMaintenance} 
            variant="contained"
            disabled={!maintenanceData.type || !maintenanceData.description || !maintenanceData.performedBy}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onClose={handleCheckoutDialogClose}>
        <DialogTitle>Check Out Equipment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Checked Out To"
                value={checkoutData.checkedOutTo}
                onChange={(e) => handleCheckoutDataChange('checkedOutTo', e.target.value)}
                sx={{ mt: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purpose"
                multiline
                rows={2}
                value={checkoutData.purpose}
                onChange={(e) => handleCheckoutDataChange('purpose', e.target.value)}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Expected Return Date"
                  value={checkoutData.expectedReturnDate}
                  onChange={(date) => handleCheckoutDataChange('expectedReturnDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 1 }} />}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCheckoutDialogClose}>Cancel</Button>
          <Button 
            onClick={handleCheckoutEquipment} 
            variant="contained"
            disabled={!checkoutData.checkedOutTo || !checkoutData.purpose}
          >
            Check Out
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EquipmentDetails;
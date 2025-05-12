import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getEquipment, deleteEquipment } from '../../services/equipmentService';

function Equipment() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Sample equipment data for demonstration
  const mockEquipment = [
    {
      id: 1,
      name: 'LEGO EV3 Kit',
      type: 'Robot Kit',
      serialNumber: 'EV3-4503-AB',
      status: 'available',
      acquisitionDate: '2022-05-15',
      lastMaintenanceDate: '2023-01-10',
      location: 'Main Lab',
      notes: 'Complete kit with all parts'
    },
    {
      id: 2,
      name: 'Arduino Starter Kit',
      type: 'Electronics',
      serialNumber: 'ARD-1234-XY',
      status: 'in-use',
      acquisitionDate: '2022-03-22',
      lastMaintenanceDate: '2022-11-05',
      location: 'Electronics Lab',
      notes: 'Used by advanced classes'
    },
    {
      id: 3,
      name: 'Raspberry Pi 4',
      type: 'Computer',
      serialNumber: 'RPI-7829-CD',
      status: 'maintenance',
      acquisitionDate: '2021-11-30',
      lastMaintenanceDate: '2023-02-15',
      location: 'Repair Shop',
      notes: 'SD card issues, being repaired'
    },
    {
      id: 4,
      name: 'VEX Robotics Kit',
      type: 'Robot Kit',
      serialNumber: 'VEX-6712-EF',
      status: 'available',
      acquisitionDate: '2022-09-10',
      lastMaintenanceDate: '2023-01-25',
      location: 'Storage Room',
      notes: 'Competition grade kit'
    },
    {
      id: 5,
      name: 'Soldering Station',
      type: 'Tool',
      serialNumber: 'SOL-9876-GH',
      status: 'in-use',
      acquisitionDate: '2022-02-18',
      lastMaintenanceDate: '2022-10-12',
      location: 'Electronics Lab',
      notes: 'For instructor use only'
    },
    {
      id: 6,
      name: 'Drone Kit',
      type: 'Robot Kit',
      serialNumber: 'DRN-5432-IJ',
      status: 'retired',
      acquisitionDate: '2020-07-05',
      lastMaintenanceDate: '2021-08-20',
      location: 'Storage Room',
      notes: 'Outdated model, used for parts'
    }
  ];

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would use the actual API
      // const response = await getEquipment();
      // setEquipment(response.data);
      
      // For demo purposes, we'll use the mock data
      // Simulate API delay
      setTimeout(() => {
        setEquipment(mockEquipment);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError('Failed to load equipment. Please try again.');
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleAddEquipment = () => {
    navigate('/equipment/add');
  };

  const handleViewEquipment = (id) => {
    navigate(`/equipment/${id}`);
  };

  const handleEditEquipment = (id) => {
    navigate(`/equipment/edit/${id}`);
  };

  const handleDeleteConfirmation = (equipment) => {
    setSelectedEquipment(equipment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedEquipment(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEquipment) return;
    
    try {
      await deleteEquipment(selectedEquipment.id);
      
      // Remove from local state
      setEquipment(equipment.filter(item => item.id !== selectedEquipment.id));
      
      setSnackbar({
        open: true,
        message: 'Equipment deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete equipment',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEquipment(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Filter equipment based on search term and filters
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
                         item.notes.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in-use':
        return 'primary';
      case 'maintenance':
        return 'warning';
      case 'retired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get unique types for the filter
  const uniqueTypes = equipment.length > 0 
    ? ['all', ...new Set(equipment.map(item => item.type))]
    : ['all'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Equipment Inventory
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddEquipment}
        >
          Add Equipment
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search Equipment"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="type-filter-label">Equipment Type</InputLabel>
              <Select
                labelId="type-filter-label"
                id="type-filter"
                value={typeFilter}
                onChange={handleTypeFilterChange}
                label="Equipment Type"
              >
                {uniqueTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="in-use">In Use</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="retired">Retired</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Equipment List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredEquipment.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No equipment found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEquipment.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.serialNumber}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(item.status)} 
                      color={getStatusColor(item.status)}
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewEquipment(item.id)}
                      aria-label="view"
                    >
                      <BuildIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditEquipment(item.id)}
                      aria-label="edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteConfirmation(item)}
                      aria-label="delete"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Equipment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedEquipment?.name}? This action cannot be undone.
          </DialogContentText>
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Equipment;
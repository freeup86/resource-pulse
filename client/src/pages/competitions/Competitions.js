import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function Competitions() {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Mock data for competitions
  const mockCompetitions = [
    {
      id: 1,
      name: 'City Robotics Championship',
      type: 'Local',
      description: 'Annual robotics competition for schools within the city',
      startDate: '2023-06-15',
      endDate: '2023-06-17',
      location: 'City Convention Center',
      registrationDeadline: '2023-05-30',
      ageCategories: ['Elementary', 'Middle School', 'High School'],
      teamsRegistered: 28,
      status: 'upcoming'
    },
    {
      id: 2,
      name: 'State Robotics Challenge',
      type: 'Regional',
      description: 'Statewide competition with qualifying rounds',
      startDate: '2023-08-10',
      endDate: '2023-08-12',
      location: 'State University Arena',
      registrationDeadline: '2023-07-15',
      ageCategories: ['Middle School', 'High School'],
      teamsRegistered: 64,
      status: 'registration'
    },
    {
      id: 3,
      name: 'FIRST LEGO League',
      type: 'National',
      description: 'Official FIRST LEGO League competition',
      startDate: '2023-11-05',
      endDate: '2023-11-08',
      location: 'National Exhibition Center',
      registrationDeadline: '2023-09-30',
      ageCategories: ['Elementary', 'Middle School'],
      teamsRegistered: 120,
      status: 'registration'
    },
    {
      id: 4,
      name: 'VEX Robotics Competition',
      type: 'International',
      description: 'International VEX Robotics competition',
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      location: 'International Convention Center',
      registrationDeadline: '2024-01-10',
      ageCategories: ['Middle School', 'High School'],
      teamsRegistered: 200,
      status: 'planning'
    },
    {
      id: 5,
      name: 'Summer Robotics Camp Competition',
      type: 'Internal',
      description: 'Competition for summer camp participants',
      startDate: '2023-07-28',
      endDate: '2023-07-29',
      location: 'Main Campus',
      registrationDeadline: '2023-07-20',
      ageCategories: ['Elementary', 'Middle School'],
      teamsRegistered: 16,
      status: 'upcoming'
    },
    {
      id: 6,
      name: 'Robotics Innovation Challenge',
      type: 'Regional',
      description: 'Competition focused on innovative robot designs',
      startDate: '2023-10-12',
      endDate: '2023-10-14',
      location: 'Tech Innovation Center',
      registrationDeadline: '2023-09-15',
      ageCategories: ['High School'],
      teamsRegistered: 35,
      status: 'registration'
    }
  ];

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would fetch from an API
      // const response = await getAllCompetitions();
      // setCompetitions(response.data);
      
      // For demo, use mock data with a short delay
      setTimeout(() => {
        setCompetitions(mockCompetitions);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error fetching competitions:', err);
      setError('Failed to load competitions. Please try again.');
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
  };

  const handleAddCompetition = () => {
    navigate('/competitions/add');
  };

  const handleEditCompetition = (id) => {
    navigate(`/competitions/edit/${id}`);
  };

  const handleViewCompetition = (id) => {
    navigate(`/competitions/${id}`);
  };

  const handleDeleteConfirmation = (competition) => {
    setSelectedCompetition(competition);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedCompetition(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCompetition) return;
    
    try {
      // In a real app, this would call an API
      // await deleteCompetition(selectedCompetition.id);
      
      // For demo, just remove from state
      setCompetitions(competitions.filter(comp => comp.id !== selectedCompetition.id));
      
      setSnackbar({
        open: true,
        message: 'Competition deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting competition:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete competition',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCompetition(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'primary';
      case 'registration':
        return 'success';
      case 'planning':
        return 'info';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'registration':
        return 'Registration Open';
      case 'planning':
        return 'In Planning';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Filter competitions based on search and type filter
  const filteredCompetitions = competitions.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(search.toLowerCase()) ||
                         comp.location.toLowerCase().includes(search.toLowerCase()) ||
                         comp.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'all' || comp.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Get unique competition types for filter
  const competitionTypes = competitions.length > 0 
    ? ['all', ...new Set(competitions.map(comp => comp.type))]
    : ['all'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Robotics Competitions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCompetition}
        >
          Add Competition
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search competitions..."
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
              <InputLabel id="type-filter-label">Competition Type</InputLabel>
              <Select
                labelId="type-filter-label"
                id="type-filter"
                value={typeFilter}
                onChange={handleTypeFilterChange}
                label="Competition Type"
              >
                {competitionTypes.map((type, index) => (
                  <MenuItem key={index} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Competitions Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredCompetitions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No competitions found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Competition</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Teams</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCompetitions.map((competition) => (
                <TableRow 
                  key={competition.id} 
                  hover 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewCompetition(competition.id)}
                >
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">{competition.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {format(new Date(competition.startDate), 'MMM d, yyyy')} - {format(new Date(competition.endDate), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{competition.location}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{competition.type}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <GroupIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{competition.teamsRegistered}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(competition.status)} 
                      color={getStatusColor(competition.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCompetition(competition.id);
                      }}
                      aria-label="edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConfirmation(competition);
                      }}
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
        <DialogTitle>Delete Competition</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedCompetition?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
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

export default Competitions;
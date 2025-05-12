import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
  MonetizationOn as FeeIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { competitionService } from '../../services/competitionService';

const CompetitionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      try {
        setLoading(true);
        const data = await competitionService.getCompetitionById(id);
        setCompetition(data);
      } catch (err) {
        console.error('Error fetching competition details:', err);
        setError('Failed to load competition details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionDetails();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await competitionService.deleteCompetition(id);
      setDeleteDialogOpen(false);
      navigate('/competitions', { state: { message: 'Competition deleted successfully' } });
    } catch (err) {
      console.error('Error deleting competition:', err);
      setError('Failed to delete competition. Please try again later.');
      setDeleteDialogOpen(false);
    }
  };

  const getStatusColor = (startDate, endDate) => {
    if (!startDate || !endDate) return 'default';
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'info'; // Upcoming
    if (now >= start && now <= end) return 'success'; // Active
    return 'default'; // Past
  };

  const getStatusText = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Unknown';
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'Upcoming';
    if (now >= start && now <= end) return 'Active';
    return 'Completed';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/competitions')}
          sx={{ mt: 2 }}
        >
          Return to Competitions
        </Button>
      </Box>
    );
  }

  if (!competition) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Competition not found</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/competitions')}
          sx={{ mt: 2 }}
        >
          Return to Competitions
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {competition.name}
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <Chip 
              icon={<EventIcon />}
              label={`${format(new Date(competition.startDate), 'MMM d, yyyy')} - ${format(new Date(competition.endDate), 'MMM d, yyyy')}`}
              sx={{ mr: 1 }}
            />
            <Chip 
              icon={<LocationIcon />}
              label={competition.location}
              sx={{ mr: 1 }}
            />
            <Chip 
              label={getStatusText(competition.startDate, competition.endDate)}
              color={getStatusColor(competition.startDate, competition.endDate)}
            />
          </Box>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<EditIcon />}
            component={Link}
            to={`/competitions/edit/${id}`}
            sx={{ mr: 1 }}
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

      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Competition Details
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography variant="body1">{competition.description || 'No description provided'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Registration Deadline</Typography>
            <Typography variant="body1">
              {competition.registrationDeadline ? 
                format(new Date(competition.registrationDeadline), 'MMMM d, yyyy') : 
                'No deadline specified'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Registration Fee</Typography>
            <Typography variant="body1">
              ${competition.registrationFee ? competition.registrationFee.toFixed(2) : '0.00'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Age Categories</Typography>
            <Box>
              {competition.ageCategories && competition.ageCategories.length > 0 ? (
                competition.ageCategories.map((category, index) => (
                  <Chip key={index} label={category} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                ))
              ) : (
                <Typography variant="body2">No age categories specified</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Teams" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Participants" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Results" icon={<TrophyIcon />} iconPosition="start" />
          <Tab label="Assignments" icon={<AssignmentIcon />} iconPosition="start" />
        </Tabs>
        <Divider />
        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Registered Teams</Typography>
                <Button variant="contained" size="small">Register Team</Button>
              </Box>
              {competition.teams && competition.teams.length > 0 ? (
                <List>
                  {competition.teams.map((team) => (
                    <ListItem key={team.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <SchoolIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={team.name} 
                        secondary={`${team.membersCount || 0} members • ${team.school || 'No school'}`} 
                      />
                      <Button variant="outlined" size="small" sx={{ mr: 1 }}>View</Button>
                      <Button variant="outlined" size="small">Edit</Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="text.secondary">No teams registered yet</Typography>
                </Box>
              )}
            </>
          )}
          {tabValue === 1 && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Participants</Typography>
                <Button variant="contained" size="small">Add Participant</Button>
              </Box>
              {competition.participants && competition.participants.length > 0 ? (
                <List>
                  {competition.participants.map((participant) => (
                    <ListItem key={participant.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${participant.firstName} ${participant.lastName}`} 
                        secondary={`${participant.role || 'Participant'} • ${participant.team || 'No team'}`} 
                      />
                      <Chip label={participant.status || 'Registered'} size="small" sx={{ mr: 1 }} />
                      <Button variant="outlined" size="small">Details</Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="text.secondary">No participants added yet</Typography>
                </Box>
              )}
            </>
          )}
          {tabValue === 2 && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Competition Results</Typography>
                <Button variant="contained" size="small">Add Results</Button>
              </Box>
              {competition.results && competition.results.length > 0 ? (
                <List>
                  {competition.results.map((result, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <TrophyIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={result.category} 
                        secondary={`${result.date ? format(new Date(result.date), 'MMM d, yyyy') : 'No date'}`} 
                      />
                      <Button variant="outlined" size="small">View Details</Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="text.secondary">No results recorded yet</Typography>
                </Box>
              )}
            </>
          )}
          {tabValue === 3 && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Staff & Instructor Assignments</Typography>
                <Button variant="contained" size="small">Add Assignment</Button>
              </Box>
              {competition.assignments && competition.assignments.length > 0 ? (
                <List>
                  {competition.assignments.map((assignment, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${assignment.staffName}`} 
                        secondary={`${assignment.role} • ${assignment.area || 'General'}`} 
                      />
                      <Chip 
                        label={assignment.status || 'Assigned'} 
                        color={assignment.status === 'Confirmed' ? 'success' : 'default'}
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="text.secondary">No assignments created yet</Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Competition</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this competition? This action cannot be undone.
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

export default CompetitionDetails;
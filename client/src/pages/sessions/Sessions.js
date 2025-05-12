import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Box,
  IconButton,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Event as EventIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { getSessions, deleteSession, mockSessions } from '../../services/sessionService';
import { mockCourses } from '../../services/courseService';

const Sessions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courseIdParam = queryParams.get('courseId');
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState(courseIdParam || 'all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Fetch sessions data
  const fetchSessions = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API with filters
      // const response = await getSessions({ 
      //   search: searchTerm,
      //   status: statusFilter !== 'all' ? statusFilter : undefined,
      //   courseId: courseFilter !== 'all' ? courseFilter : undefined
      // });
      // setSessions(response.data);
      
      // For demonstration, we'll use mock data with filtering
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      let filteredSessions = [...mockSessions];
      
      // Apply search filter
      if (searchTerm) {
        filteredSessions = filteredSessions.filter(session => 
          session.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
          session.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filteredSessions = filteredSessions.filter(session => 
          session.status.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      // Apply course filter
      if (courseFilter !== 'all') {
        filteredSessions = filteredSessions.filter(session => 
          session.courseId === courseFilter
        );
      }
      
      setSessions(filteredSessions);
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load sessions on component mount or filter change
  useEffect(() => {
    fetchSessions();
  }, [searchTerm, statusFilter, courseFilter]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };
  
  // Handle course filter change
  const handleCourseFilterChange = (event) => {
    setCourseFilter(event.target.value);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setSessionToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Confirm session deletion
  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    
    try {
      // In a real app, this would call the API
      // await deleteSession(sessionToDelete.id);
      
      // For demonstration, we'll just update the state
      setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session. Please try again.');
    }
  };

  // Get status color for chip
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'upcoming':
      case 'registration open':
        return 'primary';
      case 'full':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {courseFilter !== 'all' 
              ? `Sessions for ${mockCourses.find(c => c.id === courseFilter)?.title || 'Course'}`
              : 'All Sessions'
            }
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(courseFilter !== 'all' 
              ? `/sessions/add?courseId=${courseFilter}`
              : '/sessions/add'
            )}
          >
            Add Session
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              <TextField
                label="Search sessions"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by course, location, or instructor..."
                InputProps={{
                  endAdornment: searchTerm && (
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon />
                    </IconButton>
                  ),
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, minWidth: { xs: '100%', md: '50%' } }}>
              <FormControl size="small" sx={{ minWidth: '150px' }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="registration open">Registration Open</MenuItem>
                  <MenuItem value="full">Full</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: '200px' }}>
                <InputLabel id="course-filter-label">Course</InputLabel>
                <Select
                  labelId="course-filter-label"
                  value={courseFilter}
                  label="Course"
                  onChange={handleCourseFilterChange}
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {mockCourses.map(course => (
                    <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>
        
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <LinearProgress />
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                <Table stickyHeader aria-label="sessions table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell>Schedule</TableCell>
                      <TableCell>Dates</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Instructor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Enrollment</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((session) => (
                        <TableRow hover key={session.id}>
                          <TableCell component="th" scope="row">
                            <Link to={`/courses/${session.courseId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <Typography sx={{ fontWeight: 'medium', '&:hover': { color: 'primary.main' } }}>
                                {session.courseTitle}
                              </Typography>
                            </Link>
                          </TableCell>
                          <TableCell>{session.schedule}</TableCell>
                          <TableCell>
                            {formatDate(session.startDate)} - {formatDate(session.endDate)}
                          </TableCell>
                          <TableCell>{session.location}</TableCell>
                          <TableCell>{session.instructor.name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={session.status}
                              size="small"
                              color={getStatusColor(session.status)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {session.enrollmentCount}/{session.maxCapacity}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  color="info"
                                  onClick={() => navigate(`/sessions/${session.id}`)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Session">
                                <IconButton
                                  color="primary"
                                  onClick={() => navigate(`/sessions/edit/${session.id}`)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Session">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(session)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    {sessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                              No sessions found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                                ? 'Try adjusting your search or filters.'
                                : 'Add a session to get started.'
                              }
                            </Typography>
                            {!searchTerm && statusFilter === 'all' && courseFilter === 'all' && (
                              <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/sessions/add')}
                              >
                                Add Session
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={sessions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
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
            Are you sure you want to delete the session for "{sessionToDelete?.courseTitle}" 
            scheduled for {sessionToDelete && formatDate(sessionToDelete.startDate)}? 
            This action cannot be undone, and it may affect student enrollments.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Sessions;
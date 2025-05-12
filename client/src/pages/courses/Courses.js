import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  Clear as ClearIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
import { getCourses, deleteCourse, mockCourses } from '../../services/courseService';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Fetch courses data
  const fetchCourses = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      // const response = await getCourses({ search: searchTerm });
      // setCourses(response.data);
      
      // For demonstration, we'll use mock data with filtering
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      const filteredCourses = mockCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.skillLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.ageRange.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setCourses(filteredCourses);
      setError(null);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load courses on component mount or search term change
  useEffect(() => {
    fetchCourses();
  }, [searchTerm]);

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

  // Open delete confirmation dialog
  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setCourseToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Confirm course deletion
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    
    try {
      // In a real app, this would call the API
      // await deleteCourse(courseToDelete.id);
      
      // For demonstration, we'll just update the state
      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course. Please try again.');
    }
  };

  // Render skill level badge
  const renderSkillLevelBadge = (skillLevel) => {
    let color;
    
    switch (skillLevel.toLowerCase()) {
      case 'beginner':
        color = 'success';
        break;
      case 'intermediate':
        color = 'primary';
        break;
      case 'advanced':
        color = 'secondary';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={skillLevel} color={color} size="small" />;
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Robotics Courses
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/courses/add')}
          >
            Add Course
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              label="Search courses"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by title, description, skill level, or age range..."
              InputProps={{
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Paper>
        
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <LinearProgress />
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                <Table stickyHeader aria-label="courses table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Age Range</TableCell>
                      <TableCell>Skill Level</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Max Capacity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((course) => (
                        <TableRow hover key={course.id}>
                          <TableCell component="th" scope="row">
                            {course.title}
                          </TableCell>
                          <TableCell>{course.ageRange}</TableCell>
                          <TableCell>
                            {renderSkillLevelBadge(course.skillLevel)}
                          </TableCell>
                          <TableCell>{course.duration}</TableCell>
                          <TableCell>{course.maxCapacity}</TableCell>
                          <TableCell>${course.price.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  color="info"
                                  onClick={() => navigate(`/courses/${course.id}`)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Sessions">
                                <IconButton
                                  color="secondary"
                                  onClick={() => navigate(`/sessions?courseId=${course.id}`)}
                                >
                                  <EventNoteIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Course">
                                <IconButton
                                  color="primary"
                                  onClick={() => navigate(`/courses/edit/${course.id}`)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Course">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(course)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    {courses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                              No courses found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {searchTerm ? 'Try adjusting your search.' : 'Add a course to get started.'}
                            </Typography>
                            {!searchTerm && (
                              <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/courses/add')}
                              >
                                Add Course
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
                count={courses.length}
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
            Are you sure you want to delete the "{courseToDelete?.title}" course? This action cannot be undone, and it may affect any associated sessions or student enrollments.
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

export default Courses;
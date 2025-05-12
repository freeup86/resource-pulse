import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, MenuItem, Box, Chip, IconButton,
  TablePagination, CircularProgress, Card, CardContent, Grid, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import enrollmentService from '../../services/enrollmentService';

const statusColors = {
  enrolled: 'success',
  waitlisted: 'warning',
  cancelled: 'error',
  completed: 'info'
};

const Enrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    course: '',
    search: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Stats counters
  const [stats, setStats] = useState({
    enrolled: 0,
    waitlisted: 0,
    cancelled: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchEnrollments();
  }, [filters, page, rowsPerPage]);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const queryParams = {
        ...filters,
        page: page + 1,
        limit: rowsPerPage
      };
      
      const data = await enrollmentService.getEnrollments(queryParams);
      setEnrollments(data.enrollments || []);
      setTotalCount(data.totalCount || 0);
      
      // Update stats counters
      if (data.stats) {
        setStats(data.stats);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to load enrollments. Please try again.');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
    setPage(0); // Reset to first page when filters change
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        await enrollmentService.deleteEnrollment(id);
        fetchEnrollments();
      } catch (err) {
        console.error('Error deleting enrollment:', err);
        setError('Failed to delete enrollment. Please try again.');
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Enrollments
          </Typography>
          <Button
            component={Link}
            to="/enrollments/add"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            Add Enrollment
          </Button>
        </Box>

        {/* Stats Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Active</Typography>
                <Typography variant="h4">{stats.enrolled}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Waitlisted</Typography>
                <Typography variant="h4">{stats.waitlisted}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Completed</Typography>
                <Typography variant="h4">{stats.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Cancelled</Typography>
                <Typography variant="h4">{stats.cancelled}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                }}
                placeholder="Student name, email, or ID"
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="enrolled">Enrolled</MenuItem>
                <MenuItem value="waitlisted">Waitlisted</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Course"
                name="course"
                value={filters.course}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
                placeholder="Course name or ID"
              />
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff4f4' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        {/* Enrollments Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No enrollments found
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        {enrollment.student?.name || 'N/A'}
                        {enrollment.student?.email && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            {enrollment.student.email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{enrollment.course?.title || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={enrollment.status} 
                          color={statusColors[enrollment.status] || 'default'}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(enrollment.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {enrollment.endDate ? new Date(enrollment.endDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={enrollment.paymentStatus} 
                          color={enrollment.paymentStatus === 'paid' ? 'success' : 'warning'}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          component={Link} 
                          to={`/enrollments/view/${enrollment.id}`}
                          size="small"
                          title="View details"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          component={Link} 
                          to={`/enrollments/edit/${enrollment.id}`}
                          size="small"
                          title="Edit enrollment"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(enrollment.id)}
                          size="small"
                          title="Delete enrollment"
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default Enrollments;
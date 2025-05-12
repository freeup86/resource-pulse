import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent,
  Button, 
  Typography, 
  TextField, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  IconButton,
  Chip,
  MenuItem,
  Menu,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getStudents, deleteStudent } from '../../services/studentService';

function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    skillLevel: '',
    ageMin: '',
    ageMax: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch students on component mount and when filters change
  useEffect(() => {
    fetchStudents();
  }, [page, rowsPerPage, search, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getStudents({
        search,
        ...filters,
        page: page + 1,
        limit: rowsPerPage
      });
      
      setStudents(response.data);
      setTotalCount(response.totalCount);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page when search changes
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
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

  const handleActionClick = (event, studentId) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedStudentId(studentId);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedStudentId(null);
  };

  const handleViewStudent = () => {
    navigate(`/students/${selectedStudentId}`);
    handleActionClose();
  };

  const handleEditStudent = () => {
    navigate(`/students/edit/${selectedStudentId}`);
    handleActionClose();
  };

  const handleDeleteStudent = async () => {
    try {
      await deleteStudent(selectedStudentId);
      setSnackbar({
        open: true,
        message: 'Student deleted successfully',
        severity: 'success'
      });
      fetchStudents(); // Refresh the list
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete student',
        severity: 'error'
      });
    }
    handleActionClose();
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAddStudent = () => {
    navigate('/students/add');
  };

  // Skill level options for filtering
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Students
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddStudent}
        >
          Add Student
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search students..."
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
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  select
                  name="skillLevel"
                  label="Skill Level"
                  variant="outlined"
                  value={filters.skillLevel}
                  onChange={handleFilterChange}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {skillLevels.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  name="ageMin"
                  label="Min Age"
                  type="number"
                  variant="outlined"
                  value={filters.ageMin}
                  onChange={handleFilterChange}
                  inputProps={{ min: 0 }}
                  sx={{ width: 100 }}
                />
                <TextField
                  name="ageMax"
                  label="Max Age"
                  type="number"
                  variant="outlined"
                  value={filters.ageMax}
                  onChange={handleFilterChange}
                  inputProps={{ min: 0 }}
                  sx={{ width: 100 }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Students Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Skill Level</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.age}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.schoolName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={student.currentSkillLevel} 
                        color={
                          student.currentSkillLevel === 'Beginner' ? 'success' :
                          student.currentSkillLevel === 'Intermediate' ? 'primary' :
                          'secondary'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : 'N/A'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        aria-label="more"
                        aria-controls="long-menu"
                        aria-haspopup="true"
                        onClick={(e) => handleActionClick(e, student.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        id="action-menu"
        anchorEl={actionMenuAnchor}
        keepMounted
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleViewStudent}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View
        </MenuItem>
        <MenuItem onClick={handleEditStudent}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteStudent} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

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
    </Box>
  );
}

export default Students;
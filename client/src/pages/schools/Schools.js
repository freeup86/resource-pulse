import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { getSchools, deleteSchool } from '../../services/schoolService';

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const data = await getSchools();
      setSchools(data);
      setFilteredSchools(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch schools. Please try again later.');
      console.error('Error loading schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = schools.filter(
        (school) =>
          school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          school.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          school.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSchools(filtered);
    } else {
      setFilteredSchools(schools);
    }
    setPage(0);
  }, [searchTerm, schools]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleDeleteSchool = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        await deleteSchool(id);
        fetchSchools();
      } catch (err) {
        setError('Failed to delete school. Please try again.');
        console.error('Error deleting school:', err);
      }
    }
  };

  const getPartnershipStatus = (school) => {
    if (!school.partnership || !school.partnership.endDate) return 'Unknown';
    
    const endDate = new Date(school.partnership.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays < 30) return 'Ending Soon';
    return 'Active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Ending Soon':
        return 'warning';
      case 'Expired':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          School Partnerships
        </Typography>
        <Button
          component={Link}
          to="/schools/add"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Add School
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, address, or city..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ mr: 1 }}
            />
            {searchTerm && (
              <IconButton onClick={clearSearch} size="small">
                <ClearIcon />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredSchools.length > 0 ? (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="schools table">
              <TableHead>
                <TableRow>
                  <TableCell>School Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Programs</TableCell>
                  <TableCell>Partnership Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchools
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((school) => {
                    const partnershipStatus = getPartnershipStatus(school);
                    return (
                      <TableRow key={school.id} hover>
                        <TableCell>
                          <Link to={`/schools/${school.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                              {school.name}
                            </Typography>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {school.address}, {school.city}, {school.state} {school.zip}
                        </TableCell>
                        <TableCell>
                          {school.phone} <br /> {school.email}
                        </TableCell>
                        <TableCell>
                          {school.programs && school.programs.map((program, index) => (
                            <Chip
                              key={index}
                              label={program.name}
                              size="small"
                              sx={{ m: 0.5 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={partnershipStatus}
                            color={getStatusColor(partnershipStatus)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <IconButton
                              component={Link}
                              to={`/schools/${school.id}/edit`}
                              color="primary"
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteSchool(school.id)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSchools.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            {searchTerm ? 'No schools match your search criteria' : 'No schools available'}
          </Typography>
          {searchTerm && (
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearSearch}
              sx={{ mt: 2 }}
            >
              Clear Search
            </Button>
          )}
          {!searchTerm && (
            <Button
              component={Link}
              to="/schools/add"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add School
            </Button>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default Schools;
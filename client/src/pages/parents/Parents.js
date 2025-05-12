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
  People as PeopleIcon,
  Clear as ClearIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { getParents, deleteParent } from '../../services/parentService';

// Mock data for demonstration
const mockParents = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@example.com',
    phone: '(555) 123-4567',
    address: '123 Oak St, Anytown, CA 94123',
    students: [
      { id: '1', name: 'Alex Johnson', grade: '7th' }
    ],
    paymentHistory: [
      { id: '1', date: '2023-10-01', amount: 250.00, status: 'Paid', method: 'Credit Card' },
      { id: '2', date: '2023-09-01', amount: 250.00, status: 'Paid', method: 'Credit Card' }
    ],
    communicationLogs: [
      { id: '1', date: '2023-10-15', type: 'Email', subject: 'Schedule Change', notes: 'Informed about the holiday schedule' },
      { id: '2', date: '2023-09-20', type: 'Phone', subject: 'Payment Reminder', notes: 'Left voicemail about upcoming payment' }
    ],
    preferredContact: 'Email',
    joinDate: '2023-07-15'
  },
  {
    id: '2',
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    email: 'carlos.r@example.com',
    phone: '(555) 987-6543',
    address: '456 Pine Ave, Anytown, CA 94123',
    students: [
      { id: '2', name: 'Maya Rodriguez', grade: '5th' }
    ],
    paymentHistory: [
      { id: '3', date: '2023-10-05', amount: 200.00, status: 'Paid', method: 'Bank Transfer' },
      { id: '4', date: '2023-09-05', amount: 200.00, status: 'Paid', method: 'Bank Transfer' }
    ],
    communicationLogs: [
      { id: '3', date: '2023-10-10', type: 'Email', subject: 'Progress Report', notes: 'Sent Maya\'s quarterly progress report' }
    ],
    preferredContact: 'Phone',
    joinDate: '2023-08-10'
  },
  {
    id: '3',
    firstName: 'Jennifer',
    lastName: 'Davis',
    email: 'jennifer.d@example.com',
    phone: '(555) 456-7890',
    address: '789 Maple Dr, Anytown, CA 94123',
    students: [
      { id: '3', name: 'Ethan Davis', grade: '10th' }
    ],
    paymentHistory: [
      { id: '5', date: '2023-10-03', amount: 300.00, status: 'Paid', method: 'Credit Card' },
      { id: '6', date: '2023-09-03', amount: 300.00, status: 'Paid', method: 'Credit Card' }
    ],
    communicationLogs: [
      { id: '4', date: '2023-10-18', type: 'In Person', subject: 'Competition Details', notes: 'Discussed upcoming robotics competition' },
      { id: '5', date: '2023-09-25', type: 'Email', subject: 'Advanced Class', notes: 'Information about advanced programming class' }
    ],
    preferredContact: 'Email',
    joinDate: '2023-06-20'
  },
  {
    id: '4',
    firstName: 'Michael',
    lastName: 'Williams',
    email: 'michael.w@example.com',
    phone: '(555) 321-7654',
    address: '101 Cedar Ln, Anytown, CA 94123',
    students: [
      { id: '4', name: 'Zoe Williams', grade: '8th' }
    ],
    paymentHistory: [
      { id: '7', date: '2023-10-02', amount: 250.00, status: 'Paid', method: 'PayPal' },
      { id: '8', date: '2023-09-02', amount: 250.00, status: 'Paid', method: 'PayPal' }
    ],
    communicationLogs: [
      { id: '6', date: '2023-10-12', type: 'Phone', subject: 'Absences', notes: 'Discussed Zoe\'s recent absences' }
    ],
    preferredContact: 'Phone',
    joinDate: '2023-07-05'
  },
  {
    id: '5',
    firstName: 'Wei',
    lastName: 'Chen',
    email: 'wei.c@example.com',
    phone: '(555) 789-0123',
    address: '202 Birch Rd, Anytown, CA 94123',
    students: [
      { id: '5', name: 'Liam Chen', grade: '6th' }
    ],
    paymentHistory: [
      { id: '9', date: '2023-10-10', amount: 200.00, status: 'Paid', method: 'Credit Card' },
      { id: '10', date: '2023-09-10', amount: 200.00, status: 'Paid', method: 'Credit Card' }
    ],
    communicationLogs: [
      { id: '7', date: '2023-10-05', type: 'Email', subject: 'New Course Options', notes: 'Sent information about upcoming courses' }
    ],
    preferredContact: 'Email',
    joinDate: '2023-08-15'
  },
  {
    id: '6',
    firstName: 'Sofia',
    lastName: 'Martinez',
    email: 'sofia.m@example.com',
    phone: '(555) 654-3210',
    address: '303 Walnut St, Anytown, CA 94123',
    students: [
      { id: '6', name: 'Isabella Martinez', grade: '11th' }
    ],
    paymentHistory: [
      { id: '11', date: '2023-10-05', amount: 300.00, status: 'Paid', method: 'Bank Transfer' },
      { id: '12', date: '2023-09-05', amount: 300.00, status: 'Paid', method: 'Bank Transfer' }
    ],
    communicationLogs: [
      { id: '8', date: '2023-10-20', type: 'Phone', subject: 'College Preparation', notes: 'Discussed how robotics can help with college applications' }
    ],
    preferredContact: 'Both',
    joinDate: '2023-06-05'
  },
  {
    id: '7',
    firstName: 'David',
    lastName: 'Parker',
    email: 'david.p@example.com',
    phone: '(555) 234-5678',
    address: '404 Elm Ct, Anytown, CA 94123',
    students: [
      { id: '7', name: 'Noah Parker', grade: '9th' }
    ],
    paymentHistory: [
      { id: '13', date: '2023-10-08', amount: 250.00, status: 'Paid', method: 'Credit Card' },
      { id: '14', date: '2023-09-08', amount: 250.00, status: 'Pending', method: 'Credit Card' }
    ],
    communicationLogs: [
      { id: '9', date: '2023-10-25', type: 'Email', subject: 'Payment Reminder', notes: 'Sent gentle reminder about pending payment' }
    ],
    preferredContact: 'Email',
    joinDate: '2023-07-25'
  },
  {
    id: '8',
    firstName: 'Rebecca',
    lastName: 'Wilson',
    email: 'rebecca.w@example.com',
    phone: '(555) 876-5432',
    address: '505 Spruce Way, Anytown, CA 94123',
    students: [
      { id: '8', name: 'Emma Wilson', grade: '4th' }
    ],
    paymentHistory: [
      { id: '15', date: '2023-10-15', amount: 200.00, status: 'Paid', method: 'PayPal' },
      { id: '16', date: '2023-09-15', amount: 200.00, status: 'Paid', method: 'PayPal' }
    ],
    communicationLogs: [
      { id: '10', date: '2023-10-23', type: 'In Person', subject: 'Beginner Robotics', notes: 'Discussed Emma\'s progress in beginner class' }
    ],
    preferredContact: 'Phone',
    joinDate: '2023-08-25'
  }
];

const Parents = () => {
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [parentToDelete, setParentToDelete] = useState(null);

  // Fetch parents data
  const fetchParents = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      // const response = await getParents({ search: searchTerm });
      // setParents(response.data);
      
      // For demonstration, we'll use mock data with filtering
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      const filteredParents = mockParents.filter(parent => 
        `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
        parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.phone.includes(searchTerm) ||
        parent.students.some(student => student.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setParents(filteredParents);
      setError(null);
    } catch (err) {
      console.error('Error fetching parents:', err);
      setError('Failed to load parents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load parents on component mount or search term change
  useEffect(() => {
    fetchParents();
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
  const handleDeleteClick = (parent) => {
    setParentToDelete(parent);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setParentToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Confirm parent deletion
  const handleDeleteConfirm = async () => {
    if (!parentToDelete) return;
    
    try {
      // In a real app, this would call the API
      // await deleteParent(parentToDelete.id);
      
      // For demonstration, we'll just update the state
      setParents(parents.filter(p => p.id !== parentToDelete.id));
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setParentToDelete(null);
    } catch (err) {
      console.error('Error deleting parent:', err);
      setError('Failed to delete parent. Please try again.');
    }
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Parents
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/parents/add')}
          >
            Add Parent
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
              label="Search parents"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, email, phone, or student..."
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
                <Table stickyHeader aria-label="parents table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Contact Information</TableCell>
                      <TableCell>Students</TableCell>
                      <TableCell>Preferred Contact</TableCell>
                      <TableCell>Join Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parents
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((parent) => (
                        <TableRow hover key={parent.id}>
                          <TableCell component="th" scope="row">
                            {`${parent.firstName} ${parent.lastName}`}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">{parent.email}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">{parent.phone}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {parent.students.map((student) => (
                              <Chip
                                key={student.id}
                                label={`${student.name} (${student.grade})`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                                onClick={() => navigate(`/students/${student.id}`)}
                              />
                            ))}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={parent.preferredContact} 
                              size="small" 
                              color={
                                parent.preferredContact === 'Email' ? 'primary' :
                                parent.preferredContact === 'Phone' ? 'secondary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(parent.joinDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  color="info"
                                  onClick={() => navigate(`/parents/${parent.id}`)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Parent">
                                <IconButton
                                  color="primary"
                                  onClick={() => navigate(`/parents/edit/${parent.id}`)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Parent">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(parent)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    {parents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                              No parents found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {searchTerm ? 'Try adjusting your search.' : 'Add a parent to get started.'}
                            </Typography>
                            {!searchTerm && (
                              <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/parents/add')}
                              >
                                Add Parent
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
                count={parents.length}
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
            Are you sure you want to delete {parentToDelete && `${parentToDelete.firstName} ${parentToDelete.lastName}`}? This action cannot be undone and will remove all associated data.
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

export default Parents;
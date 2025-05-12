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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  HistoryEdu as HistoryIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { 
  getSchoolById, 
  deleteSchool, 
  getSchoolClassesHistory, 
  getSchoolContacts,
  getSchoolPrograms
} from '../../services/schoolService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`school-tabpanel-${index}`}
      aria-labelledby={`school-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SchoolDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [classes, setClasses] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchSchoolData = async () => {
    try {
      setLoading(true);
      const schoolData = await getSchoolById(id);
      setSchool(schoolData);
      
      // Fetch additional data in parallel
      const [classesData, contactsData, programsData] = await Promise.all([
        getSchoolClassesHistory(id),
        getSchoolContacts(id),
        getSchoolPrograms(id)
      ]);
      
      setClasses(classesData);
      setContacts(contactsData);
      setPrograms(programsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch school details. Please try again later.');
      console.error('Error loading school details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolData();
  }, [id]);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteSchool = async () => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      try {
        await deleteSchool(id);
        navigate('/schools');
      } catch (err) {
        setError('Failed to delete school. Please try again.');
        console.error('Error deleting school:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPartnershipStatusChip = () => {
    if (!school.partnership || !school.partnership.endDate) return <Chip label="Unknown" />;
    
    const endDate = new Date(school.partnership.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <Chip label="Expired" color="error" />;
    if (diffDays < 30) return <Chip label="Ending Soon" color="warning" />;
    return <Chip label="Active" color="success" />;
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
          to="/schools"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Schools
        </Button>
      </Container>
    );
  }

  if (!school) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">School not found</Alert>
        <Button
          component={Link}
          to="/schools"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Schools
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton
          component={Link}
          to="/schools"
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {school.name}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          component={Link}
          to={`/schools/${id}/edit`}
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
          onClick={handleDeleteSchool}
        >
          Delete
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                School Information
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Address:</strong> {school.address}, {school.city}, {school.state} {school.zip}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Phone:</strong> {school.phone || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {school.email || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>School District:</strong> {school.district || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Partnership Details
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  <strong>Status:</strong>
                </Typography>
                {getPartnershipStatusChip()}
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>Contract ID:</strong> {school.partnership?.contractId || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Start Date:</strong> {formatDate(school.partnership?.startDate)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>End Date:</strong> {formatDate(school.partnership?.endDate)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Terms:</strong> {school.partnership?.terms || 'N/A'}
              </Typography>
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
          <Tab icon={<PersonIcon />} label="Contacts" />
          <Tab icon={<DescriptionIcon />} label="Programs" />
          <Tab icon={<HistoryIcon />} label="Class History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {contacts.length > 0 ? (
            <List>
              {contacts.map((contact) => (
                <ListItem key={contact.id} divider>
                  <Avatar sx={{ mr: 2 }}>{contact.name.charAt(0)}</Avatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {contact.name} - {contact.role}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {contact.email}
                        </Typography>
                        <Typography variant="body2" component="span" display="block">
                          {contact.phone}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No contacts available</Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {programs.length > 0 ? (
            <List>
              {programs.map((program) => (
                <ListItem key={program.id} divider>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {program.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          <strong>Grade Level:</strong> {program.gradeLevel}
                        </Typography>
                        <Typography variant="body2" component="span" display="block">
                          <strong>Duration:</strong> {program.duration}
                        </Typography>
                        <Typography variant="body2" component="span" display="block">
                          <strong>Description:</strong> {program.description}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No programs available</Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {classes.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class Name</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Instructor</TableCell>
                    <TableCell>Students</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell>{classItem.name}</TableCell>
                      <TableCell>{classItem.program}</TableCell>
                      <TableCell>{formatDate(classItem.startDate)}</TableCell>
                      <TableCell>{formatDate(classItem.endDate)}</TableCell>
                      <TableCell>{classItem.instructor}</TableCell>
                      <TableCell>{classItem.studentCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No class history available</Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default SchoolDetails;
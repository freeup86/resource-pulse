import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, Button, Card, CardContent,
  TextField, MenuItem, FormControl, InputLabel, Select, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, IconButton, Alert, Tab, Tabs
} from '@mui/material';
import {
  DownloadOutlined as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  PeopleAlt as PeopleIcon,
  DoneAll as DoneAllIcon,
  HourglassEmpty as HourglassIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
  AreaChart, Area
} from 'recharts';
import reportService from '../../services/reportService';

const EnrollmentReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    courseId: '',
    status: '',
    ageGroup: ''
  });

  useEffect(() => {
    fetchEnrollmentData();
  }, []);

  const fetchEnrollmentData = async () => {
    setLoading(true);
    try {
      const data = await reportService.getEnrollmentStats(filters);
      setEnrollmentData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching enrollment data:', err);
      setError('Failed to load enrollment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchEnrollmentData();
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      courseId: '',
      status: '',
      ageGroup: ''
    });
  };

  const exportReport = async (format) => {
    try {
      const blob = await reportService.exportReport('enrollment', format, filters);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enrollment_report.${format}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('Failed to export report. Please try again.');
    }
  };

  // Mock data for development purposes
  // In a real application, this would come from the API
  const mockData = {
    summary: {
      totalEnrollments: 600,
      activeEnrollments: 320,
      completedEnrollments: 185,
      cancelledEnrollments: 45,
      waitlistedEnrollments: 50,
      enrollmentGrowth: '+12%',
      retentionRate: 85,
      conversionRate: 72
    },
    enrollmentsByStatus: [
      { name: 'Enrolled', value: 320 },
      { name: 'Waitlisted', value: 50 },
      { name: 'Completed', value: 185 },
      { name: 'Cancelled', value: 45 }
    ],
    enrollmentsByMonth: [
      { name: 'Jan', enrollments: 35 },
      { name: 'Feb', enrollments: 42 },
      { name: 'Mar', enrollments: 50 },
      { name: 'Apr', enrollments: 48 },
      { name: 'May', enrollments: 55 },
      { name: 'Jun', enrollments: 70 },
      { name: 'Jul', enrollments: 85 },
      { name: 'Aug', enrollments: 65 },
      { name: 'Sep', enrollments: 60 },
      { name: 'Oct', enrollments: 55 },
      { name: 'Nov', enrollments: 45 },
      { name: 'Dec', enrollments: 40 }
    ],
    enrollmentsByCourse: [
      { name: 'Robotics Basics', enrolled: 85, waitlisted: 12, completed: 45 },
      { name: 'Advanced Programming', enrolled: 65, waitlisted: 8, completed: 38 },
      { name: 'AI for Robotics', enrolled: 55, waitlisted: 15, completed: 32 },
      { name: 'Mechanical Design', enrolled: 45, waitlisted: 5, completed: 25 },
      { name: 'Electronics Basics', enrolled: 70, waitlisted: 10, completed: 45 }
    ],
    enrollmentsByAgeGroup: [
      { name: '8-10', value: 120 },
      { name: '11-13', value: 180 },
      { name: '14-16', value: 150 },
      { name: '17-18', value: 100 },
      { name: '19+', value: 50 }
    ],
    enrollmentsByGender: [
      { name: 'Male', value: 340 },
      { name: 'Female', value: 250 },
      { name: 'Non-binary', value: 10 }
    ],
    enrollmentProjections: [
      { name: 'May', actual: 55, projected: 60 },
      { name: 'Jun', actual: 70, projected: 75 },
      { name: 'Jul', actual: 85, projected: 80 },
      { name: 'Aug', actual: 65, projected: 70 },
      { name: 'Sep', actual: 60, projected: 65 },
      { name: 'Oct', projected: 70 },
      { name: 'Nov', projected: 75 },
      { name: 'Dec', projected: 65 }
    ],
    topCourseConversions: [
      { course: 'Robotics Basics', inquiries: 120, enrollments: 85, rate: 71 },
      { course: 'Advanced Programming', inquiries: 95, enrollments: 65, rate: 68 },
      { course: 'AI for Robotics', inquiries: 90, enrollments: 55, rate: 61 },
      { course: 'Electronics Basics', inquiries: 105, enrollments: 70, rate: 67 },
      { course: 'Mechanical Design', inquiries: 80, enrollments: 45, rate: 56 }
    ],
    enrollmentRetention: [
      { courseLevel: 'Beginner', enrollments: 200, continued: 160, rate: 80 },
      { courseLevel: 'Intermediate', enrollments: 150, continued: 120, rate: 80 },
      { courseLevel: 'Advanced', enrollments: 100, continued: 75, rate: 75 },
      { courseLevel: 'Expert', enrollments: 50, continued: 30, rate: 60 }
    ]
  };

  // Use mock data for development, in production would use enrollmentData
  const data = mockData;

  // Color configurations
  const COLORS = ['#4caf50', '#ff9800', '#2196f3', '#f44336', '#9c27b0'];
  const STATUS_COLORS = {
    enrolled: 'success',
    waitlisted: 'warning',
    completed: 'info',
    cancelled: 'error'
  };

  if (loading && !enrollmentData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <Button
              component={Link}
              to="/reports"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Back to Reports
            </Button>
            <Typography variant="h4" component="h1">
              Enrollment Report
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={() => exportReport('pdf')} title="Export as PDF">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={() => exportReport('csv')} title="Export as CSV" sx={{ ml: 1 }}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={fetchEnrollmentData} title="Refresh Data" sx={{ ml: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                select
                fullWidth
                label="Course"
                name="courseId"
                value={filters.courseId}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">All Courses</MenuItem>
                <MenuItem value="1">Robotics Basics</MenuItem>
                <MenuItem value="2">Advanced Programming</MenuItem>
                <MenuItem value="3">AI for Robotics</MenuItem>
                <MenuItem value="4">Mechanical Design</MenuItem>
                <MenuItem value="5">Electronics Basics</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="enrolled">Enrolled</MenuItem>
                <MenuItem value="waitlisted">Waitlisted</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                select
                fullWidth
                label="Age Group"
                name="ageGroup"
                value={filters.ageGroup}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">All Ages</MenuItem>
                <MenuItem value="8-10">8-10 years</MenuItem>
                <MenuItem value="11-13">11-13 years</MenuItem>
                <MenuItem value="14-16">14-16 years</MenuItem>
                <MenuItem value="17-18">17-18 years</MenuItem>
                <MenuItem value="19+">19+ years</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} container justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                onClick={applyFilters}
                sx={{ mr: 1 }}
              >
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Enrollment Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Enrollments
                </Typography>
                <Box display="flex" alignItems="center">
                  <PeopleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h4">{data.summary.activeEnrollments}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Waitlisted
                </Typography>
                <Box display="flex" alignItems="center">
                  <HourglassIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h4">{data.summary.waitlistedEnrollments}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Box display="flex" alignItems="center">
                  <DoneAllIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h4">{data.summary.completedEnrollments}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cancelled
                </Typography>
                <Box display="flex" alignItems="center">
                  <CancelIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h4">{data.summary.cancelledEnrollments}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for different views */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Enrollment Overview" />
            <Tab label="Demographics" />
            <Tab label="Projections & Retention" />
          </Tabs>
        </Paper>

        {/* Enrollment Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={4}>
            {/* Enrollment by Status */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Enrollment by Status</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.enrollmentsByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.enrollmentsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Students`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Monthly Enrollment Trends */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Monthly Enrollment Trends</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.enrollmentsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} Students`, 'Enrollments']} />
                      <Legend />
                      <Line type="monotone" dataKey="enrollments" stroke="#4caf50" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Enrollment by Course */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Enrollment by Course</Typography>
                <Box height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.enrollmentsByCourse}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="enrolled" name="Enrolled" stackId="a" fill="#4caf50" />
                      <Bar dataKey="waitlisted" name="Waitlisted" stackId="a" fill="#ff9800" />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Course Conversion Rates */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Course Conversion Rates</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Course</TableCell>
                        <TableCell align="right">Inquiries</TableCell>
                        <TableCell align="right">Enrollments</TableCell>
                        <TableCell align="right">Conversion Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topCourseConversions.map((course, index) => (
                        <TableRow key={index}>
                          <TableCell>{course.course}</TableCell>
                          <TableCell align="right">{course.inquiries}</TableCell>
                          <TableCell align="right">{course.enrollments}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${course.rate}%`} 
                              color={course.rate >= 70 ? 'success' : course.rate >= 60 ? 'info' : 'warning'}
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Demographics Tab */}
        {tabValue === 1 && (
          <Grid container spacing={4}>
            {/* Enrollment by Age Group */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Enrollment by Age Group</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.enrollmentsByAgeGroup}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.enrollmentsByAgeGroup.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Students`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Enrollment by Gender */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Enrollment by Gender</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.enrollmentsByGender}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.enrollmentsByGender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Students`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Age Demographics Summary Card */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Demographics Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        Most Popular Age Group
                      </Typography>
                      <Typography variant="h5">11-13 years</Typography>
                      <Typography variant="body2">
                        Representing 30% of all students
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        Gender Distribution
                      </Typography>
                      <Typography variant="h5">57% Male / 42% Female</Typography>
                      <Typography variant="body2">
                        1% identify as non-binary
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        Growth Demographics
                      </Typography>
                      <Typography variant="h5">Fastest Growth: 14-16 years</Typography>
                      <Typography variant="body2">
                        Increased by 18% year-over-year
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Projections & Retention Tab */}
        {tabValue === 2 && (
          <Grid container spacing={4}>
            {/* Enrollment Projections */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Enrollment Projections</Typography>
                <Box height={320}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.enrollmentProjections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="actual" name="Actual" fill="#4caf50" />
                      <Bar dataKey="projected" name="Projected" fill="#ff9800" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Retention & Growth Metrics */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Enrollment Growth</Typography>
                      <Typography variant="h5" color="success.main">{data.summary.enrollmentGrowth}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Retention Rate</Typography>
                      <Typography variant="h5">{data.summary.retentionRate}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Conversion Rate</Typography>
                      <Typography variant="h5">{data.summary.conversionRate}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Total Enrollments</Typography>
                      <Typography variant="h5">{data.summary.totalEnrollments}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Course Level Retention Rates</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Course Level</TableCell>
                        <TableCell align="right">Enrollments</TableCell>
                        <TableCell align="right">Continued</TableCell>
                        <TableCell align="right">Retention Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.enrollmentRetention.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.courseLevel}</TableCell>
                          <TableCell align="right">{row.enrollments}</TableCell>
                          <TableCell align="right">{row.continued}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${row.rate}%`} 
                              color={row.rate >= 80 ? 'success' : row.rate >= 70 ? 'info' : 'warning'}
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Enrollment Flow Chart */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Enrollment Flow</Typography>
                <Box height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.enrollmentsByMonth}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="enrollments" stroke="#8884d8" fill="#8884d8" name="Monthly Enrollments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>Enrollment Projections for Next Quarter</Typography>
                  <Typography variant="body2">
                    Based on historical trends and current growth rate ({data.summary.enrollmentGrowth}), 
                    we project {Math.floor(data.summary.activeEnrollments * 1.12)} total active enrollments 
                    by the end of next quarter, representing a 12% increase from current figures.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default EnrollmentReport;
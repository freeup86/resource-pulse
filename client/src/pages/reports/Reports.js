import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, Button, Card, CardContent,
  CardHeader, Divider, CircularProgress, Tabs, Tab, List, ListItem,
  ListItemText, ListItemIcon, Alert
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  School as SchoolIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Bookmark as BookmarkIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Initialize dashboardData with an empty structure to prevent null errors
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalStudents: 0,
      activeEnrollments: 0,
      completedCourses: 0,
      revenueTotal: 0,
      revenueTrend: '0%',
      attendanceRate: 0,
      newEnrollments: 0,
      newEnrollmentsTrend: '0%'
    },
    enrollmentsByStatus: [],
    enrollmentsByMonth: [],
    studentsByAgeGroup: [],
    revenueByMonth: [],
    topCourses: [],
    attendanceByDay: []
  });
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(0);
  
  // Define time frame options
  const timeFrames = [
    { label: 'Last 30 Days', value: 'month' },
    { label: 'Last Quarter', value: 'quarter' },
    { label: 'Year to Date', value: 'ytd' },
    { label: 'Last Year', value: 'year' }
  ];

  // Mock data for development purposes
  const mockData = {
    summary: {
      totalStudents: 456,
      activeEnrollments: 320,
      completedCourses: 842,
      revenueTotal: 124500,
      revenueTrend: '+12%',
      attendanceRate: 87,
      newEnrollments: 124,
      newEnrollmentsTrend: '+8%'
    },
    enrollmentsByStatus: [
      { name: 'Enrolled', value: 320 },
      { name: 'Waitlisted', value: 85 },
      { name: 'Completed', value: 150 },
      { name: 'Cancelled', value: 45 }
    ],
    enrollmentsByMonth: [
      { name: 'Jan', enrollments: 65 },
      { name: 'Feb', enrollments: 72 },
      { name: 'Mar', enrollments: 80 },
      { name: 'Apr', enrollments: 93 },
      { name: 'May', enrollments: 110 },
      { name: 'Jun', enrollments: 130 },
      { name: 'Jul', enrollments: 92 },
      { name: 'Aug', enrollments: 85 },
      { name: 'Sep', enrollments: 105 },
      { name: 'Oct', enrollments: 112 },
      { name: 'Nov', enrollments: 124 },
      { name: 'Dec', enrollments: 90 }
    ],
    studentsByAgeGroup: [
      { name: '5-8', value: 120 },
      { name: '9-12', value: 180 },
      { name: '13-15', value: 110 },
      { name: '16-18', value: 46 }
    ],
    revenueByMonth: [
      { name: 'Jan', amount: 8500 },
      { name: 'Feb', amount: 9200 },
      { name: 'Mar', amount: 9800 },
      { name: 'Apr', amount: 10500 },
      { name: 'May', amount: 11800 },
      { name: 'Jun', amount: 12400 },
      { name: 'Jul', amount: 9500 },
      { name: 'Aug', amount: 8800 },
      { name: 'Sep', amount: 10200 },
      { name: 'Oct', amount: 11000 },
      { name: 'Nov', amount: 12200 },
      { name: 'Dec', amount: 10600 }
    ],
    topCourses: [
      { name: 'Robotics Fundamentals', enrollments: 85, revenue: 21250 },
      { name: 'Advanced LEGO Robotics', enrollments: 72, revenue: 19800 },
      { name: 'Programming for Robotics', enrollments: 64, revenue: 17600 },
      { name: 'Competition Prep', enrollments: 56, revenue: 15400 },
      { name: 'Robotics for Beginners', enrollments: 43, revenue: 10750 }
    ],
    attendanceByDay: [
      { day: 'Monday', rate: 92 },
      { day: 'Tuesday', rate: 88 },
      { day: 'Wednesday', rate: 90 },
      { day: 'Thursday', rate: 85 },
      { day: 'Friday', rate: 82 },
      { day: 'Saturday', rate: 94 }
    ]
  };

  useEffect(() => {
    fetchDashboardData(timeFrames[selectedTimeFrame].value);
  }, [selectedTimeFrame]);

  const fetchDashboardData = async (timeframe) => {
    setLoading(true);
    try {
      // Simulate API call delay
      setTimeout(() => {
        // Set data first, then update loading state
        setDashboardData(mockData);
        setError(null);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  const handleTimeFrameChange = (event, newValue) => {
    setSelectedTimeFrame(newValue);
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Show loading state when loading or when data is not available
  if (loading || !dashboardData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Tabs
          value={selectedTimeFrame}
          onChange={handleTimeFrameChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {timeFrames.map((frame, index) => (
            <Tab key={index} label={frame.label} />
          ))}
        </Tabs>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Total Students
                </Typography>
              </Box>
              <Typography variant="h3">{dashboardData.summary.totalStudents}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active students in our programs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Active Enrollments
                </Typography>
              </Box>
              <Typography variant="h3">{dashboardData.summary.activeEnrollments}</Typography>
              <Typography variant="body2" color="text.secondary">
                Current class enrollments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Revenue
                </Typography>
              </Box>
              <Typography variant="h3">${dashboardData.summary.revenueTotal.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total revenue {dashboardData.summary.revenueTrend}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Attendance Rate
                </Typography>
              </Box>
              <Typography variant="h3">{dashboardData.summary.attendanceRate}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Average class attendance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enrollment Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Enrollment Trends" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardData.enrollmentsByMonth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enrollments" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Enrollment Status" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {dashboardData.enrollmentsByStatus.length > 0 ? (
                      <Pie
                        data={dashboardData.enrollmentsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.enrollmentsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    ) : (
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        No data available
                      </text>
                    )}
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Revenue by Month" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.revenueByMonth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Courses and Demographics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader title="Top Courses" />
            <Divider />
            <CardContent>
              {dashboardData.topCourses.length > 0 ? (
                <List>
                  {dashboardData.topCourses.map((course, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <BookmarkIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={course.name}
                          secondary={`${course.enrollments} enrollments • $${course.revenue.toLocaleString()} revenue`}
                        />
                      </ListItem>
                      {index < dashboardData.topCourses.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No course data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader title="Student Demographics" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {dashboardData.studentsByAgeGroup.length > 0 ? (
                      <Pie
                        data={dashboardData.studentsByAgeGroup}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.studentsByAgeGroup.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    ) : (
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        No data available
                      </text>
                    )}
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Reports */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Available Reports
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                component={Link}
                to="/reports/enrollment"
                variant="outlined"
                fullWidth
                startIcon={<AssessmentIcon />}
                sx={{ justifyContent: 'flex-start', py: 2 }}
              >
                Enrollment Report
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                component={Link}
                to="/reports/financial"
                variant="outlined"
                fullWidth
                startIcon={<MoneyIcon />}
                sx={{ justifyContent: 'flex-start', py: 2 }}
              >
                Financial Report
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                component={Link}
                to="/reports/attendance"
                variant="outlined"
                fullWidth
                startIcon={<EventIcon />}
                sx={{ justifyContent: 'flex-start', py: 2 }}
              >
                Attendance Report
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                component={Link}
                to="/reports/students"
                variant="outlined"
                fullWidth
                startIcon={<PeopleIcon />}
                sx={{ justifyContent: 'flex-start', py: 2 }}
              >
                Student Progress Report
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                component={Link}
                to="/reports/schools"
                variant="outlined"
                fullWidth
                startIcon={<SchoolIcon />}
                sx={{ justifyContent: 'flex-start', py: 2 }}
              >
                School Partnership Report
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                component={Link}
                to="/reports/instructors"
                variant="outlined"
                fullWidth
                startIcon={<PersonIcon />}
                sx={{ justifyContent: 'flex-start', py: 2 }}
              >
                Instructor Performance Report
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports;
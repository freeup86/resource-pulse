import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, Button, Card, CardContent,
  TextField, MenuItem, FormControl, InputLabel, Select, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, IconButton, Alert
} from '@mui/material';
import {
  DownloadOutlined as DownloadIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import DatePicker from '@mui/lab/DatePicker';
import reportService from '../../services/reportService';

const AttendanceReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [filters, setFilters] = useState({
    courseId: '',
    startDate: '',
    endDate: '',
    instructorId: '',
    status: ''
  });

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const data = await reportService.getAttendanceStats(filters);
      setAttendanceData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: date
    }));
  };

  const applyFilters = () => {
    fetchAttendanceData();
  };

  const resetFilters = () => {
    setFilters({
      courseId: '',
      startDate: '',
      endDate: '',
      instructorId: '',
      status: ''
    });
  };

  const exportReport = async (format) => {
    try {
      const blob = await reportService.exportReport('attendance', format, filters);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report.${format}`);
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
      totalSessions: 256,
      averageAttendance: 87.5,
      perfectAttendance: 45,
      lowAttendance: 12,
      attendanceTrend: '+3.2%',
      makeupSessions: 18
    },
    attendanceByStatus: [
      { name: 'Present', value: 1820 },
      { name: 'Absent', value: 156 },
      { name: 'Late', value: 95 },
      { name: 'Excused', value: 68 }
    ],
    attendanceByWeekday: [
      { name: 'Monday', attendance: 92 },
      { name: 'Tuesday', attendance: 88 },
      { name: 'Wednesday', attendance: 90 },
      { name: 'Thursday', attendance: 85 },
      { name: 'Friday', attendance: 82 },
      { name: 'Saturday', attendance: 94 },
      { name: 'Sunday', attendance: 91 }
    ],
    attendanceByMonth: [
      { name: 'Jan', attendance: 86 },
      { name: 'Feb', attendance: 85 },
      { name: 'Mar', attendance: 88 },
      { name: 'Apr', attendance: 87 },
      { name: 'May', attendance: 89 },
      { name: 'Jun', attendance: 91 },
      { name: 'Jul', attendance: 92 },
      { name: 'Aug', attendance: 90 },
      { name: 'Sep', attendance: 88 },
      { name: 'Oct', attendance: 87 },
      { name: 'Nov', attendance: 89 },
      { name: 'Dec', attendance: 86 }
    ],
    attendanceByCourse: [
      { name: 'Robotics Basics', attendance: 91 },
      { name: 'Advanced Programming', attendance: 88 },
      { name: 'AI for Robotics', attendance: 85 },
      { name: 'Mechanical Design', attendance: 86 },
      { name: 'Electronics Basics', attendance: 89 }
    ],
    lowAttendanceStudents: [
      { id: 1, name: 'Alex Johnson', course: 'Robotics Basics', attendance: 65, lastAttended: '2024-04-15' },
      { id: 2, name: 'Maria Garcia', course: 'AI for Robotics', attendance: 72, lastAttended: '2024-04-12' },
      { id: 3, name: 'James Wilson', course: 'Advanced Programming', attendance: 68, lastAttended: '2024-04-10' },
      { id: 4, name: 'Sophia Lee', course: 'Electronics Basics', attendance: 70, lastAttended: '2024-04-16' },
      { id: 5, name: 'Daniel Brown', course: 'Mechanical Design', attendance: 74, lastAttended: '2024-04-14' }
    ],
    perfectAttendanceStudents: [
      { id: 6, name: 'Emily Davis', course: 'Robotics Basics', attendance: 100, streak: 12 },
      { id: 7, name: 'Michael Miller', course: 'Advanced Programming', attendance: 100, streak: 10 },
      { id: 8, name: 'Sarah Wilson', course: 'AI for Robotics', attendance: 100, streak: 9 },
      { id: 9, name: 'David Martinez', course: 'Electronics Basics', attendance: 100, streak: 8 },
      { id: 10, name: 'Emma Thompson', course: 'Mechanical Design', attendance: 100, streak: 7 }
    ]
  };

  // Use mock data for development, in production would use attendanceData
  const data = mockData;

  // Color configurations
  const COLORS = ['#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0'];

  if (loading && !attendanceData) {
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
              Attendance Report
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={() => exportReport('pdf')} title="Export as PDF">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={() => exportReport('csv')} title="Export as CSV" sx={{ ml: 1 }}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={fetchAttendanceData} title="Refresh Data" sx={{ ml: 1 }}>
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
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                fullWidth
                label="Instructor"
                name="instructorId"
                value={filters.instructorId}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">All Instructors</MenuItem>
                <MenuItem value="1">Dr. Smith</MenuItem>
                <MenuItem value="2">Prof. Johnson</MenuItem>
                <MenuItem value="3">Dr. Williams</MenuItem>
                <MenuItem value="4">Prof. Davis</MenuItem>
                <MenuItem value="5">Dr. Miller</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                fullWidth
                label="Attendance Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">Late</MenuItem>
                <MenuItem value="excused">Excused</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={12} md={4} container justifyContent="flex-end">
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

        {/* Attendance Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Attendance
                </Typography>
                <Typography variant="h4">{data.summary.averageAttendance}%</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Trend: {data.summary.attendanceTrend}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Sessions
                </Typography>
                <Typography variant="h4">{data.summary.totalSessions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Perfect Attendance
                </Typography>
                <Typography variant="h4">{data.summary.perfectAttendance} Students</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Low Attendance
                </Typography>
                <Typography variant="h4">{data.summary.lowAttendance} Students</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={4}>
          {/* Attendance by Status */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Attendance by Status</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.attendanceByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.attendanceByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Occurrences`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Attendance by Weekday */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Attendance by Weekday</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.attendanceByWeekday}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                    <Bar dataKey="attendance" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Attendance by Month */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Attendance by Month</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.attendanceByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" stroke="#4caf50" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Attendance by Course */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Attendance by Course</Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.attendanceByCourse}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                    <Bar dataKey="attendance" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Student Lists */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {/* Low Attendance Students */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Students with Low Attendance</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Attendance Rate</TableCell>
                      <TableCell>Last Attended</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.lowAttendanceStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                            {student.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <SchoolIcon sx={{ mr: 1, color: 'action.active' }} />
                            {student.course}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${student.attendance}%`} 
                            color={student.attendance < 70 ? 'error' : 'warning'}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{new Date(student.lastAttended).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            component={Link} 
                            to={`/students/${student.id}`}
                          >
                            View Student
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Perfect Attendance Students */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Students with Perfect Attendance</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Attendance Rate</TableCell>
                      <TableCell>Perfect Streak (Sessions)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.perfectAttendanceStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                            {student.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <SchoolIcon sx={{ mr: 1, color: 'action.active' }} />
                            {student.course}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${student.attendance}%`} 
                            color="success"
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{student.streak} sessions</TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            component={Link} 
                            to={`/students/${student.id}`}
                          >
                            View Student
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AttendanceReport;
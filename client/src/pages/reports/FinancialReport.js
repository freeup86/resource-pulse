import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, Button, Card, CardContent,
  TextField, MenuItem, Divider, List, ListItem, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, IconButton, Alert, Tab, Tabs
} from '@mui/material';
import {
  DownloadOutlined as DownloadIcon,
  AttachMoney as MoneyIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import reportService from '../../services/reportService';

const FinancialReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    courseId: '',
    category: ''
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const data = await reportService.getFinancialReport(filters);
      setFinancialData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Failed to load financial data. Please try again.');
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
    fetchFinancialData();
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      courseId: '',
      category: ''
    });
  };

  const exportReport = async (format) => {
    try {
      const blob = await reportService.exportReport('financial', format, filters);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report.${format}`);
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
      totalRevenue: 254680,
      pendingPayments: 18450,
      refundedAmount: 4200,
      netRevenue: 232030,
      revenueTrend: '+8.5%',
      averageTransactionValue: 850,
      projectedRevenue: 320000
    },
    revenueByMonth: [
      { name: 'Jan', revenue: 18500 },
      { name: 'Feb', revenue: 19200 },
      { name: 'Mar', revenue: 21000 },
      { name: 'Apr', revenue: 20500 },
      { name: 'May', revenue: 22200 },
      { name: 'Jun', revenue: 25400 },
      { name: 'Jul', revenue: 28600 },
      { name: 'Aug', revenue: 24800 },
      { name: 'Sep', revenue: 22300 },
      { name: 'Oct', revenue: 23500 },
      { name: 'Nov', revenue: 25000 },
      { name: 'Dec', revenue: 21500 }
    ],
    revenueByPaymentMethod: [
      { name: 'Credit Card', value: 145000 },
      { name: 'Debit Card', value: 65000 },
      { name: 'Bank Transfer', value: 32000 },
      { name: 'Check', value: 8500 },
      { name: 'Cash', value: 4180 }
    ],
    revenueByCourse: [
      { name: 'Robotics Basics', revenue: 85000 },
      { name: 'Advanced Programming', revenue: 65000 },
      { name: 'AI for Robotics', revenue: 55000 },
      { name: 'Mechanical Design', revenue: 42000 },
      { name: 'Electronics Basics', revenue: 7680 }
    ],
    topTransactions: [
      { id: 1, date: '2024-04-15', student: 'John Smith', course: 'Robotics Basics', amount: 1500, method: 'Credit Card', status: 'completed' },
      { id: 2, date: '2024-04-12', student: 'Emma Johnson', course: 'Advanced Programming', amount: 1200, method: 'Bank Transfer', status: 'completed' },
      { id: 3, date: '2024-04-10', student: 'Michael Davis', course: 'AI for Robotics', amount: 1100, method: 'Credit Card', status: 'completed' },
      { id: 4, date: '2024-04-08', student: 'Sarah Wilson', course: 'Mechanical Design', amount: 950, method: 'Debit Card', status: 'completed' },
      { id: 5, date: '2024-04-05', student: 'David Martinez', course: 'Electronics Basics', amount: 850, method: 'Credit Card', status: 'completed' }
    ],
    pendingPayments: [
      { id: 6, date: '2024-04-18', student: 'Jessica Thompson', course: 'Robotics Basics', amount: 1500, dueDate: '2024-05-01' },
      { id: 7, date: '2024-04-16', student: 'Robert Garcia', course: 'Advanced Programming', amount: 1200, dueDate: '2024-04-30' },
      { id: 8, date: '2024-04-14', student: 'Jennifer Lewis', course: 'AI for Robotics', amount: 1100, dueDate: '2024-04-28' },
      { id: 9, date: '2024-04-12', student: 'Daniel Brown', course: 'Mechanical Design', amount: 950, dueDate: '2024-04-26' },
      { id: 10, date: '2024-04-10', student: 'Amanda Miller', course: 'Electronics Basics', amount: 850, dueDate: '2024-04-24' }
    ],
    projectionByQuarter: [
      { name: 'Q1', revenue: 58700, projected: 60000 },
      { name: 'Q2', revenue: 68100, projected: 75000 },
      { name: 'Q3', revenue: 75700, projected: 85000 },
      { name: 'Q4', revenue: 70000, projected: 100000 }
    ]
  };

  // Use mock data for development, in production would use financialData
  const data = mockData;

  // Color configurations
  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];

  if (loading && !financialData) {
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
              Financial Report
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={() => exportReport('pdf')} title="Export as PDF">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={() => exportReport('csv')} title="Export as CSV" sx={{ ml: 1 }}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={fetchFinancialData} title="Refresh Data" sx={{ ml: 1 }}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Transaction Category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="enrollment">Enrollment Fees</MenuItem>
                <MenuItem value="materials">Materials</MenuItem>
                <MenuItem value="events">Special Events</MenuItem>
                <MenuItem value="other">Other</MenuItem>
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

        {/* Financial Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">${data.summary.totalRevenue.toLocaleString()}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Trend: {data.summary.revenueTrend}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Net Revenue
                </Typography>
                <Typography variant="h4">${data.summary.netRevenue.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Payments
                </Typography>
                <Typography variant="h4">${data.summary.pendingPayments.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Projected Revenue (Year)
                </Typography>
                <Typography variant="h4">${data.summary.projectedRevenue.toLocaleString()}</Typography>
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
            <Tab label="Revenue Overview" />
            <Tab label="Transactions" />
            <Tab label="Projections" />
          </Tabs>
        </Paper>

        {/* Revenue Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={4}>
            {/* Monthly Revenue Trend */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Monthly Revenue Trend</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#4caf50" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Revenue by Course */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Revenue by Course</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueByCourse}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Revenue by Payment Method */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Revenue by Payment Method</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.revenueByPaymentMethod}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.revenueByPaymentMethod.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Quarterly Comparison */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Quarterly Revenue</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.projectionByQuarter}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Bar dataKey="revenue" name="Actual Revenue" fill="#4caf50" />
                      <Bar dataKey="projected" name="Projected Revenue" fill="#ff9800" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Transactions Tab */}
        {tabValue === 1 && (
          <Grid container spacing={4}>
            {/* Top Transactions */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{transaction.student}</TableCell>
                          <TableCell>{transaction.course}</TableCell>
                          <TableCell>${transaction.amount.toLocaleString()}</TableCell>
                          <TableCell>{transaction.method}</TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.status} 
                              color={transaction.status === 'completed' ? 'success' : 'warning'}
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

            {/* Pending Payments */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Pending Payments</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Registration Date</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Amount Due</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.pendingPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                          <TableCell>{payment.student}</TableCell>
                          <TableCell>{payment.course}</TableCell>
                          <TableCell>${payment.amount.toLocaleString()}</TableCell>
                          <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label="Pending" 
                              color="warning"
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
          </Grid>
        )}

        {/* Projections Tab */}
        {tabValue === 2 && (
          <Grid container spacing={4}>
            {/* Revenue Projections */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Revenue Projections</Typography>
                <Box height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.projectionByQuarter}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Bar dataKey="revenue" name="Actual Revenue" fill="#4caf50" />
                      <Bar dataKey="projected" name="Projected Revenue" fill="#ff9800" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Projected Annual Revenue: ${data.summary.projectedRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Based on current enrollment trends and historical data
                </Typography>
              </Paper>
            </Grid>

            {/* Growth Indicators */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Growth Indicators</Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Revenue Growth" 
                      secondary={data.summary.revenueTrend} 
                      primaryTypographyProps={{ gutterBottom: true }}
                    />
                    <ArrowUpIcon color="success" />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Average Transaction Value" 
                      secondary={`$${data.summary.averageTransactionValue}`} 
                      primaryTypographyProps={{ gutterBottom: true }}
                    />
                    <ArrowUpIcon color="success" />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Refund Rate" 
                      secondary={`${((data.summary.refundedAmount / data.summary.totalRevenue) * 100).toFixed(1)}%`} 
                      primaryTypographyProps={{ gutterBottom: true }}
                    />
                    <ArrowDownIcon color="success" />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Payments Pending" 
                      secondary={`$${data.summary.pendingPayments.toLocaleString()}`} 
                      primaryTypographyProps={{ gutterBottom: true }}
                    />
                    <ArrowUpIcon color="warning" />
                  </ListItem>
                </List>
              </Paper>
              <Card sx={{ mt: 2, bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Forecast Accuracy
                  </Typography>
                  <Typography variant="body1">
                    Last quarter forecasts were 94% accurate
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Forecasts are adjusted monthly based on enrollment trends
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default FinancialReport;
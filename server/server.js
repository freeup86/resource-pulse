// Main server entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001; // Changed to 5001 to avoid conflicts

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Simple logger
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, error) => console.error(`[ERROR] ${message}`, error || '')
};

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // Enable CORS with specific options
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Robotics Education CRM API' });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo login (replace with actual authentication)
  if (email === 'admin@roboticsedu.com' && password === 'AdminPassword123!') {
    res.json({
      success: true,
      token: 'demo-token',
      refreshToken: 'demo-refresh-token',
      user: {
        id: 1,
        email: 'admin@roboticsedu.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  // Demo refresh token endpoint
  if (refreshToken === 'demo-refresh-token') {
    res.json({
      success: true,
      token: 'new-demo-token'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Mock API endpoints
const createMockHandler = (entityName, mockData = []) => {
  const router = express.Router();
  
  // Get all entities
  router.get('/', (req, res) => {
    res.json({ success: true, data: mockData });
  });
  
  // Get single entity
  router.get('/:id', (req, res) => {
    const entity = mockData.find(item => item.id == req.params.id);
    if (entity) {
      res.json({ success: true, data: entity });
    } else {
      res.status(404).json({ success: false, message: `${entityName} not found` });
    }
  });
  
  // Create entity
  router.post('/', (req, res) => {
    res.status(201).json({ 
      success: true, 
      message: `${entityName} created successfully`, 
      data: { id: Math.floor(Math.random() * 1000) + 1, ...req.body } 
    });
  });
  
  // Update entity
  router.put('/:id', (req, res) => {
    res.json({ 
      success: true, 
      message: `${entityName} updated successfully`,
      data: { id: req.params.id, ...req.body }
    });
  });
  
  // Delete entity
  router.delete('/:id', (req, res) => {
    res.json({ success: true, message: `${entityName} deleted successfully` });
  });
  
  return router;
};

// Setup mock API routes
app.use('/api/students', createMockHandler('Student'));
app.use('/api/parents', createMockHandler('Parent'));
app.use('/api/schools', createMockHandler('School'));
app.use('/api/courses', createMockHandler('Course'));
app.use('/api/sessions', createMockHandler('Session'));
app.use('/api/enrollments', createMockHandler('Enrollment'));
app.use('/api/equipment', createMockHandler('Equipment'));
app.use('/api/instructors', createMockHandler('Instructor'));
app.use('/api/competitions', createMockHandler('Competition'));
app.use('/api/reports', createMockHandler('Report'));
app.use('/api/settings', createMockHandler('Setting'));

// Simple error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
});
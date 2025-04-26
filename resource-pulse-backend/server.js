const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Import routes
const resourceRoutes = require('./routes/resourceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const allocationRoutes = require('./routes/allocationRoutes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS middleware - simplest configuration that allows all origins
app.use(cors());

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // This helps with CORS issues
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// Add CORS headers directly to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ResourcePulse API' });
});

// Routes
app.use('/api/resources', resourceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/allocations', allocationRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Import routes
const resourceRoutes = require('./routes/resourceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const roleRoutes = require('./routes/roleRoutes');
const skillsRoutes = require('./routes/skillsRoutes');  // Added skills routes
const importRoutes = require('./routes/importRoutes');
const syncRoutes = require('./routes/syncRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const capacityRoutes = require('./routes/capacityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRecommendationRoutes = require('./routes/aiRecommendationRoutes');
const skillRecommendationRoutes = require('./routes/skillRecommendationRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const matchingRoutes = require('./routes/matchingRoutes');  // AI-powered matching routes
const utilizationForecastRoutes = require('./routes/utilizationForecastRoutes');  // AI-powered utilization forecasting routes
const forecastRoutes = require('./routes/forecastRoutes');  // Advanced AI forecast routes
const projectRiskRoutes = require('./routes/projectRiskRoutes');  // AI-powered project risk analysis routes
const searchRoutes = require('./routes/searchRoutes');  // Natural language search routes
const financialOptimizationRoutes = require('./routes/financialOptimizationRoutes');  // Financial optimization routes
const skillsGapRoutes = require('./routes/skillsGapRoutes');  // Skills gap analysis routes
const documentProcessingRoutes = require('./routes/documentProcessingRoutes');  // Document processing routes
const clientSatisfactionRoutes = require('./routes/clientSatisfactionRoutes');  // Client satisfaction prediction routes
const scheduledSyncService = require('./services/scheduledSyncService');
const settingsController = require('./controllers/settingsController');
const notificationService = require('./services/notificationService');
const notificationScheduler = require('./services/notificationScheduler');

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
app.use('/api/roles', roleRoutes);
app.use('/api/skills', skillsRoutes);  // Added skills routes
app.use('/api/import', importRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/capacity', capacityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRecommendationRoutes);  // AI recommendation routes
app.use('/api', skillRecommendationRoutes);  // Skill recommendation routes
app.use('/api/telemetry', telemetryRoutes);  // Telemetry and monitoring routes
app.use('/api/matching', matchingRoutes);  // AI-powered resource-project matching routes
app.use('/api/forecast', forecastRoutes);  // Advanced AI forecast routes (replaces older routes)
app.use('/api/forecast/legacy', utilizationForecastRoutes);  // Legacy utilization forecasting routes
app.use('/api/risk', projectRiskRoutes);  // AI-powered project risk analysis routes
app.use('/api/search', searchRoutes);  // Natural language search routes
app.use('/api/financial', financialOptimizationRoutes);  // Financial optimization routes
app.use('/api/skills-gap', skillsGapRoutes);  // Skills gap analysis routes
app.use('/api/documents', documentProcessingRoutes);  // Document processing routes
app.use('/api/satisfaction', clientSatisfactionRoutes);  // Client satisfaction prediction routes

// Initialize system settings before starting server
settingsController.initializeSettings();

// Initialize notification service
notificationService.initializeService().then(success => {
  if (success) {
    console.log('Notification service initialized successfully');
  } else {
    console.error('Failed to initialize notification service');
  }
});

// Start scheduled jobs in production mode
if (process.env.NODE_ENV === 'production') {
  scheduledSyncService.initializeJobs();
  notificationScheduler.initializeScheduledJobs();
} else {
  // In development, still initialize notification jobs but with console logs
  notificationScheduler.initializeScheduledJobs();
}

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
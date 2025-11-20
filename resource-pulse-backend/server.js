const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Apply patch to fix path-to-regexp errors
// This must be done before any routes are registered or required
require('./patch-path-to-regexp');

// Import routes
const resourceRoutes = require('./routes/resourceRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const financialRoutes = require('./routes/financialRoutes');
const raidRoutes = require('./routes/raidRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const projectRoutes = require('./routes/projectRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const roleRoutes = require('./routes/roleRoutes');
const skillsRoutes = require('./routes/skillsRoutes');  // Added skills routes
const importRoutes = require('./routes/importRoutes');
const syncRoutes = require('./routes/syncRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const capacityRoutes = require('./routes/capacityRoutes');
const whatIfScenarioRoutes = require('./routes/whatIfScenarioRoutes');  // What-If scenario planning routes
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
const authRoutes = require('./routes/authRoutes');  // Authentication routes
const versionRoutes = require('./routes/versionRoutes');  // Version information routes
const scheduledSyncService = require('./services/scheduledSyncService');
const settingsController = require('./controllers/settingsController');
const notificationService = require('./services/notificationService');
const notificationScheduler = require('./services/notificationScheduler');

// Load environment variables
if (process.env.NODE_ENV === 'development') {
  // Load development variables from .env.development if exists
  dotenv.config({ path: './.env.development' });
} else {
  // Load regular .env file for other environments
  dotenv.config();
}

// Set mock data flag if not already set
if (process.env.USE_MOCK_DATA === undefined) {
  // Default to true in development, false in production
  process.env.USE_MOCK_DATA = process.env.NODE_ENV === 'development' ? 'true' : 'false';
}

// Create Express app
const app = express();

/**
 * Sanitizes route paths to prevent path-to-regexp errors
 * @param {string|RegExp} path - Route path to sanitize
 * @returns {string|RegExp} - Sanitized path
 */
function sanitizeRoutePath(path) {
  if (typeof path === 'string') {
    // Replace any potential route pattern issues
    return path
      .replace(/\/:(\W|$)/g, '/:param$1')  // Fix empty parameter names
      .replace(/\/:\//g, '/:param/')       // Fix parameter followed by slash
      .replace(/\/::/g, '/:param:')        // Fix parameter followed by colon
      .replace(/\/: /g, '/:param ');       // Fix parameter followed by space
  }
  return path;
}

/**
 * Patches a route method to use sanitized paths
 * @param {Function} original - Original route method
 * @returns {Function} - Patched route method
 */
function patchRouteMethod(original) {
  return function (path, ...handlers) {
    return original.call(this, sanitizeRoutePath(path), ...handlers);
  };
}

// Patch app route methods
app.get = patchRouteMethod(app.get);
app.post = patchRouteMethod(app.post);
app.put = patchRouteMethod(app.put);
app.delete = patchRouteMethod(app.delete);
app.patch = patchRouteMethod(app.patch);
app.all = patchRouteMethod(app.all);

// Patch express.Router 
const originalRouter = express.Router;
express.Router = function () {
  const router = originalRouter.apply(this, arguments);

  // Patch router methods
  router.get = patchRouteMethod(router.get);
  router.post = patchRouteMethod(router.post);
  router.put = patchRouteMethod(router.put);
  router.delete = patchRouteMethod(router.delete);
  router.patch = patchRouteMethod(router.patch);
  router.all = patchRouteMethod(router.all);

  return router;
};

// Note: Router patching is already done above

// Set up CORS middleware with more specific configuration
const corsOptions = {
  origin: ['https://resource-pulse.onrender.com', 'http://localhost:3000', 'http://localhost:8001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Add custom CORS headers for any failed preflight checks
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  next();
});

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // This helps with CORS issues
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// Audit Logging Middleware
const auditLog = require('./middleware/auditMiddleware');
app.use(auditLog);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ResourcePulse API' });
});

// Routes
app.use('/api/auth', authRoutes);  // Authentication routes (public)
app.use('/api/resources', resourceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/skills', skillsRoutes);  // Added skills routes
app.use('/api/import', importRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/capacity', capacityRoutes);
app.use('/api/whatif', whatIfScenarioRoutes);  // What-If scenario planning routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRecommendationRoutes);  // AI recommendation routes
app.use('/api/skill-recommendations', skillRecommendationRoutes);  // Skill recommendation routes
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
app.use('/api/version', versionRoutes);  // Version information routes
app.use('/api/requests', require('./routes/requestRoutes')); // Resource Request routes

// Nested routes for milestones
app.use('/api/projects/:projectId/milestones', milestoneRoutes);

// Nested routes for financials
app.use('/api/projects/:projectId/financials', financialRoutes);

// Nested routes for RAID log
app.use('/api/projects/:projectId/raid', raidRoutes);

// Currency routes
app.use('/api/currency', currencyRoutes);

// WBS routes
app.use('/api/projects/:projectId/wbs', require('./routes/wbsRoutes'));

// Audit Log routes
app.use('/api/audit', require('./routes/auditRoutes'));

// Initialize system settings before starting server
try {
  settingsController.initializeSettings();
} catch (err) {
  console.error('Error initializing settings:', err.message);
}

// Initialize authentication tables
try {
  const { initAuthTables } = require('./db/init-auth-tables');

  // Retry logic for authentication tables initialization
  let retries = 0;
  const maxRetries = 3;

  const initAuth = async () => {
    try {
      const success = await initAuthTables();
      if (success) {
        console.log('Authentication tables initialized successfully');
      } else if (retries < maxRetries) {
        retries++;
        console.log(`Retrying authentication tables initialization (attempt ${retries}/${maxRetries})...`);
        // Wait for 3 seconds before retrying
        setTimeout(initAuth, 3000);
      } else {
        console.error('Failed to initialize authentication tables after multiple attempts');
        console.warn('Authentication features may not work correctly - please check database configuration');
      }
    } catch (initErr) {
      console.error('Error in authentication tables initialization:', initErr.message);
      if (retries < maxRetries) {
        retries++;
        console.log(`Retrying authentication tables initialization (attempt ${retries}/${maxRetries})...`);
        // Wait for 3 seconds before retrying
        setTimeout(initAuth, 3000);
      } else {
        console.error('Failed to initialize authentication tables after multiple attempts');
        console.warn('Authentication features may not work correctly - please check database configuration');
      }
    }
  };

  // Start the initialization process
  initAuth();
} catch (err) {
  console.error('Failed to load authentication tables initialization module:', err.message);
}

// Initialize notification service
try {
  notificationService.initializeService().then(success => {
    if (success) {
      console.log('Notification service initialized successfully');
    } else {
      console.error('Failed to initialize notification service');
    }
  }).catch(err => {
    console.error('Error in notification service:', err.message);
  });
} catch (err) {
  console.error('Failed to initialize notification service:', err.message);
}

// Start scheduled jobs in production mode
if (process.env.NODE_ENV === 'production') {
  try {
    scheduledSyncService.initializeJobs();
  } catch (err) {
    console.error('Error initializing sync jobs:', err.message);
  }

  try {
    notificationScheduler.initializeScheduledJobs();
  } catch (err) {
    console.error('Error initializing notification jobs:', err.message);
  }
} else {
  // In development, still initialize notification jobs but with console logs
  try {
    notificationScheduler.initializeScheduledJobs();
  } catch (err) {
    console.error('Error initializing notification jobs:', err.message);
  }
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
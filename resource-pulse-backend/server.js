const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Apply monkey patch to fix path-to-regexp errors
// This must be done before any routes are registered or required
const applyPathToRegexpPatch = require('./monkey-patch');
applyPathToRegexpPatch();

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

// Route validation to catch path-to-regexp errors
const validateRoutes = (router) => {
  try {
    // Safe wrapper to validate route patterns before they're used
    const originalGet = router.get;
    const originalPost = router.post;
    const originalPut = router.put;
    const originalDelete = router.delete;

    // Wrap route methods to validate patterns
    router.get = function(path, ...handlers) {
      if (typeof path === 'string' && path.includes('/:')) {
        if (path.includes('/:/') || path.includes('/::/') || path.includes('/: ')) {
          console.error(`Invalid route detected: ${path} - Contains empty parameter name`);
          path = path.replace('/:/', '/:param/').replace('/::', '/:param:').replace('/: ', '/:param ');
        }
      }
      return originalGet.call(this, path, ...handlers);
    };

    router.post = function(path, ...handlers) {
      if (typeof path === 'string' && path.includes('/:')) {
        if (path.includes('/:/') || path.includes('/::/') || path.includes('/: ')) {
          console.error(`Invalid route detected: ${path} - Contains empty parameter name`);
          path = path.replace('/:/', '/:param/').replace('/::', '/:param:').replace('/: ', '/:param ');
        }
      }
      return originalPost.call(this, path, ...handlers);
    };

    router.put = function(path, ...handlers) {
      if (typeof path === 'string' && path.includes('/:')) {
        if (path.includes('/:/') || path.includes('/::/') || path.includes('/: ')) {
          console.error(`Invalid route detected: ${path} - Contains empty parameter name`);
          path = path.replace('/:/', '/:param/').replace('/::', '/:param:').replace('/: ', '/:param ');
        }
      }
      return originalPut.call(this, path, ...handlers);
    };

    router.delete = function(path, ...handlers) {
      if (typeof path === 'string' && path.includes('/:')) {
        if (path.includes('/:/') || path.includes('/::/') || path.includes('/: ')) {
          console.error(`Invalid route detected: ${path} - Contains empty parameter name`);
          path = path.replace('/:/', '/:param/').replace('/::', '/:param:').replace('/: ', '/:param ');
        }
      }
      return originalDelete.call(this, path, ...handlers);
    };

    return router;
  } catch (error) {
    console.error('Error validating routes:', error);
    return router;
  }
};

// Create Express app
const app = express();

// Direct fix for path-to-regexp error - patches express route methods
function sanitizeRoutePath(path) {
  if (typeof path === 'string') {
    // Replace any potential route pattern issues
    return path
      .replace(/\/:(\W|$)/g, '/_fixed_param$1')  // Fix empty parameter names
      .replace(/\/:\//g, '/_fixed_param/');      // Fix parameter followed by slash
  }
  return path;
}

// Patch route methods to sanitize paths
const originalAppGet = app.get;
const originalAppPost = app.post;
const originalAppPut = app.put;
const originalAppDelete = app.delete;

app.get = function(path, ...handlers) {
  return originalAppGet.call(this, sanitizeRoutePath(path), ...handlers);
};

app.post = function(path, ...handlers) {
  return originalAppPost.call(this, sanitizeRoutePath(path), ...handlers);
};

app.put = function(path, ...handlers) {
  return originalAppPut.call(this, sanitizeRoutePath(path), ...handlers);
};

app.delete = function(path, ...handlers) {
  return originalAppDelete.call(this, sanitizeRoutePath(path), ...handlers);
};

// Patch express.Router as well
const originalRouter = express.Router;
express.Router = function() {
  const router = originalRouter.apply(this, arguments);
  
  const originalRouterGet = router.get;
  const originalRouterPost = router.post;
  const originalRouterPut = router.put;
  const originalRouterDelete = router.delete;
  
  router.get = function(path, ...handlers) {
    return originalRouterGet.call(this, sanitizeRoutePath(path), ...handlers);
  };
  
  router.post = function(path, ...handlers) {
    return originalRouterPost.call(this, sanitizeRoutePath(path), ...handlers);
  };
  
  router.put = function(path, ...handlers) {
    return originalRouterPut.call(this, sanitizeRoutePath(path), ...handlers);
  };
  
  router.delete = function(path, ...handlers) {
    return originalRouterDelete.call(this, sanitizeRoutePath(path), ...handlers);
  };
  
  return router;
};

// Note: Router patching is already done above

// Set up CORS middleware with more specific configuration
const corsOptions = {
  origin: ['https://resource-pulse.onrender.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // This helps with CORS issues
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// For preflight requests
app.options('*', cors(corsOptions));

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

// Initialize system settings before starting server
try {
  settingsController.initializeSettings();
} catch (err) {
  console.error('Error initializing settings:', err.message);
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
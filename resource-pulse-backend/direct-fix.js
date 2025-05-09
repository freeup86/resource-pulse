/**
 * Direct Fix for path-to-regexp error
 * 
 * This script:
 * 1. Modifies the app.js to catch the error at the point it's registered
 * 2. Creates a wrapper around the standard route methods to sanitize paths
 */

const fs = require('fs');
const path = require('path');

function applyFix() {
  const serverPath = path.join(__dirname, 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Add our route sanitizer before any routes are registered
  const sanitizerCode = `
// Direct fix for path-to-regexp error - patches express route methods
function sanitizeRoutePath(path) {
  if (typeof path === 'string') {
    // Replace any potential route pattern issues
    return path
      .replace(/\\/:(\\W|$)/g, '/_fixed_param$1')  // Fix empty parameter names
      .replace(/\\/:\\//g, '/_fixed_param/');      // Fix parameter followed by slash
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
`;

  // Find where to insert our sanitizer code - after app is created but before routes are registered
  const appCreationPos = serverContent.indexOf('const app = express();');
  if (appCreationPos === -1) {
    console.error('Could not find app creation in server.js');
    return false;
  }
  
  // Find the newline after app creation
  const insertPosition = serverContent.indexOf('\n', appCreationPos) + 1;
  
  // Create the updated content with our sanitizer inserted
  const updatedContent = 
    serverContent.substring(0, insertPosition) + 
    sanitizerCode + 
    serverContent.substring(insertPosition);
  
  // Write the updated file
  fs.writeFileSync(serverPath, updatedContent);
  console.log('Direct fix applied to server.js');
  
  return true;
}

// Apply the fix
try {
  if (applyFix()) {
    console.log('Fix successfully applied!');
    process.exit(0);
  } else {
    console.error('Failed to apply fix');
    process.exit(1);
  }
} catch (err) {
  console.error('Error applying fix:', err);
  process.exit(1);
}
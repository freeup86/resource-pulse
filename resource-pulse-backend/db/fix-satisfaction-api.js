/**
 * Fix Client Satisfaction API
 * This script modifies the client satisfaction controller to ensure it 
 * properly returns real data instead of mock data
 */
const fs = require('fs');
const path = require('path');

// Path to controller
const controllerPath = path.join(__dirname, '..', 'controllers', 'clientSatisfactionController.js');

async function applyFix() {
  try {
    console.log('Fixing client satisfaction API...');
    
    // Read current controller file
    let controllerContent = fs.readFileSync(controllerPath, 'utf8');
    console.log(`Read controller file: ${controllerPath}`);
    
    // Print diagnostics
    const mockDataCount = (controllerContent.match(/useMockProjectsData/g) || []).length;
    console.log(`Found ${mockDataCount} occurrences of useMockProjectsData`);
    
    // Find the start of the getAllSatisfactionPredictions function
    const functionStartRegex = /const getAllSatisfactionPredictions = async \(req, res\) => \{/;
    const functionStartMatch = controllerContent.match(functionStartRegex);
    
    if (!functionStartMatch) {
      console.error('Could not find the getAllSatisfactionPredictions function in the controller.');
      return false;
    }
    
    // Check for error handling code
    const errorHandlingRegex = /\/\/ Always fall back to mock data on error\s+return useMockProjectsData\(req, res\);/;
    const errorHandlingMatch = controllerContent.match(errorHandlingRegex);
    
    if (!errorHandlingMatch) {
      console.log('Could not find the error handling pattern to replace.');
      return false;
    }
    
    // Replace the error handling code to log errors but still try to use real data
    const newErrorHandling = `// Log the error but try to proceed with whatever projects we found
      console.error('Error occurred but continuing with any projects found:', error);
      console.error('Stack trace:', error.stack);
      
      // Only fall back to mock data if we haven't found any projects
      if (predictions.length === 0) {
        console.log('No projects were successfully processed, falling back to mock data');
        return useMockProjectsData(req, res);
      }
      
      // Otherwise return whatever real data we have
      console.log(\`Returning \${predictions.length} projects despite error\`);
      res.json({
        predictions,
        count: predictions.length,
        retrievedAt: new Date().toISOString(),
        usingRealData: true,
        hasError: true,
        errorMessage: error.message
      });`;
    
    // Apply the update
    const updatedContent = controllerContent.replace(errorHandlingRegex, newErrorHandling);
    
    if (updatedContent === controllerContent) {
      console.log('No changes were made to the controller file.');
      return false;
    }
    
    // Back up the original file
    const backupPath = `${controllerPath}.bak`;
    fs.writeFileSync(backupPath, controllerContent);
    console.log(`Created backup at: ${backupPath}`);
    
    // Write updated controller
    fs.writeFileSync(controllerPath, updatedContent);
    console.log('Updated controller file with new error handling');
    
    // Add a console.log to the beginning of the function to track calls
    const tracingCode = `
    // Trace API calls
    console.log('=== Satisfaction API called ===');
    console.log('URL:', req.originalUrl);
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);
    
    `;
    
    const tracedContent = updatedContent.replace(
      functionStartRegex,
      match => `${match}\n${tracingCode}`
    );
    
    fs.writeFileSync(controllerPath, tracedContent);
    console.log('Added tracing to API calls');
    
    return true;
  } catch (error) {
    console.error('Error applying fix:', error);
    return false;
  }
}

// Run the fix
applyFix()
  .then(success => {
    console.log(`Fix ${success ? 'applied successfully' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
/**
 * Route Pattern Validator
 * 
 * This script scans all route files and identifies any problematic route patterns
 * that could cause path-to-regexp errors.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the patterns that cause problems
const problematicPatterns = [
  { pattern: /\/:/g, name: 'Empty parameter name' },
  { pattern: /\/:[^a-zA-Z0-9_\/]/g, name: 'Invalid parameter name' },
  { pattern: /\/:[^\/]*\//g, name: 'Parameter name with possible issues' }
];

// Function to scan file content for problematic patterns
function scanFileForProblems(filePath, fileContent) {
  let problems = [];
  
  // Get all route definition lines in the file
  const routeDefRegex = /router\.(get|post|put|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = routeDefRegex.exec(fileContent)) !== null) {
    const method = match[1];
    const routePath = match[2];
    
    // Check each problematic pattern
    problematicPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(routePath)) {
        problems.push({
          filePath,
          method: method.toUpperCase(),
          routePath,
          problem: name,
          lineNumber: getLineNumber(fileContent, match[0])
        });
      }
    });
  }
  
  return problems;
}

// Function to get the line number for a string in file content
function getLineNumber(content, searchString) {
  const lines = content.split('\n');
  const lineIndex = lines.findIndex(line => line.includes(searchString));
  return lineIndex + 1;
}

// Function to scan all route files
async function scanRouteFiles() {
  try {
    const routesDir = path.join(__dirname, 'routes');
    const files = fs.readdirSync(routesDir)
      .filter(file => file.endsWith('Routes.js'));
    
    let allProblems = [];
    
    // Scan each file
    files.forEach(file => {
      const filePath = path.join(routesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fileProblems = scanFileForProblems(filePath, fileContent);
      
      if (fileProblems.length > 0) {
        allProblems = [...allProblems, ...fileProblems];
      }
    });
    
    // Output the results
    if (allProblems.length > 0) {
      console.log('\n🚨 Found problematic route patterns:\n');
      allProblems.forEach(problem => {
        console.log(`File: ${problem.filePath}`);
        console.log(`Line: ${problem.lineNumber}`);
        console.log(`Route: ${problem.method} ${problem.routePath}`);
        console.log(`Problem: ${problem.problem}`);
        console.log('---');
      });
    } else {
      console.log('\n✅ No problematic route patterns detected in route files.');
    }
    
    // Additional check: try to instantiate express Router with each route pattern
    console.log('\n🔍 Testing route patterns with path-to-regexp:\n');
    const pathToRegexp = require('path-to-regexp');
    
    // Collect all unique route patterns
    const uniqueRoutes = Array.from(new Set(
      allProblems.map(p => p.routePath)
    ));
    
    // Test each route pattern with path-to-regexp
    uniqueRoutes.forEach(route => {
      try {
        pathToRegexp(route);
        console.log(`✅ Route pattern compiles: ${route}`);
      } catch (err) {
        console.log(`❌ Invalid route pattern: ${route}`);
        console.log(`   Error: ${err.message}`);
      }
    });
    
    return allProblems;
  } catch (error) {
    console.error('Error scanning route files:', error);
    return [];
  }
}

// Run the scan
scanRouteFiles();
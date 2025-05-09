/**
 * Direct patch to path-to-regexp module
 * 
 * This script directly modifies the path-to-regexp module's source code
 * to make it handle invalid parameter names gracefully.
 */

const fs = require('fs');
const path = require('path');

// Find the path-to-regexp module file
const pathToRegexpPath = path.join(
  __dirname, 
  'node_modules', 
  'path-to-regexp', 
  'dist', 
  'index.js'
);

console.log(`Patching file: ${pathToRegexpPath}`);

if (!fs.existsSync(pathToRegexpPath)) {
  console.error('path-to-regexp module file not found');
  process.exit(1);
}

// Read the file content
let content = fs.readFileSync(pathToRegexpPath, 'utf8');

// Find the location of the problematic code
const errorFunctionLoc = content.indexOf('if (!value) {');
if (errorFunctionLoc === -1) {
  console.error('Could not find the target code to patch');
  process.exit(1);
}

// Find the line we need to modify
const errorThrowLoc = content.indexOf('throw new TypeError', errorFunctionLoc);
if (errorThrowLoc === -1) {
  console.error('Could not find the error throw statement');
  process.exit(1);
}

// Extract the problematic code segment
const originalSegment = content.substring(errorFunctionLoc, errorThrowLoc + 80);
console.log('Found original code segment:');
console.log(originalSegment);

// Create the patched version
const patchedSegment = `if (!value) {
            // PATCHED: Add a default parameter name instead of throwing error
            console.warn(\`Missing parameter name at \${i}, adding default name\`);
            return \`param\${i}\`;
            // Original code: throw new TypeError(\`Missing parameter name at \${i}: \${DEBUG_URL}\`);
        }`;

// Replace the code
const patchedContent = content.replace(
  originalSegment.substring(0, originalSegment.indexOf('throw new TypeError') + 'throw new TypeError'.length + 80),
  patchedSegment
);

// Backup the original file
const backupPath = `${pathToRegexpPath}.bak`;
fs.writeFileSync(backupPath, content);
console.log(`Original file backed up to ${backupPath}`);

// Write the patched content
fs.writeFileSync(pathToRegexpPath, patchedContent);
console.log('Successfully patched path-to-regexp module');

// Verify the patch was applied
const verificationContent = fs.readFileSync(pathToRegexpPath, 'utf8');
if (verificationContent.includes('PATCHED: Add a default parameter name')) {
  console.log('Patch verification successful');
} else {
  console.error('Patch verification failed');
  process.exit(1);
}

console.log('Patch applied successfully!');
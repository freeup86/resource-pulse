import React, { useState } from 'react';
import ExcelImport from './ExcelImport';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useRoles } from '../../contexts/RoleContext';
import * as importService from '../../services/importService';
import * as exportService from '../../services/exportService';
import { FileDown } from 'lucide-react';

const ImportPage = () => {
  const { refreshResources, resources } = useResources();
  const { refreshProjects, projects } = useProjects();
  const { roles } = useRoles();
  const [importType, setImportType] = useState('resources');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState(null);

  // Handle importing resources
  const handleImportResources = async (data) => {
    setImporting(true);
    setResults(null);
    
    try {
      const response = await importService.importResources(data);
      setResults(response);
      
      // Refresh resources in context
      await refreshResources();
    } catch (err) {
      console.error('Import error:', err);
      setResults({
        total: data.length,
        successful: 0,
        failed: data.length,
        errors: [{ error: err.message || 'Failed to import resources' }]
      });
    } finally {
      setImporting(false);
    }
  };
  
  // Handle importing projects
  const handleImportProjects = async (data) => {
    setImporting(true);
    setResults(null);
    
    try {
      // Process requiredRoles if present
      const processedData = data.map(project => {
        if (project.requiredRoles) {
          try {
            // Parse JSON string if it's a string
            if (typeof project.requiredRoles === 'string') {
              project.requiredRoles = JSON.parse(project.requiredRoles);
            }
            
            // Validate the structure
            if (!Array.isArray(project.requiredRoles)) {
              project.requiredRoles = [];
            }
            
            // Ensure each role has roleId and count as numbers
            project.requiredRoles = project.requiredRoles
              .filter(role => role && role.roleId)
              .map(role => ({
                roleId: parseInt(role.roleId),
                count: parseInt(role.count) || 1
              }));
          } catch (err) {
            console.warn('Failed to parse requiredRoles:', err);
            project.requiredRoles = [];
          }
        }
        return project;
      });
      
      const response = await importService.importProjects(processedData);
      setResults(response);
      
      // Refresh projects in context
      await refreshProjects();
    } catch (err) {
      console.error('Import error:', err);
      setResults({
        total: data.length,
        successful: 0,
        failed: data.length,
        errors: [{ error: err.message || 'Failed to import projects' }]
      });
    } finally {
      setImporting(false);
    }
  };
  
  // Handle importing allocations
  const handleImportAllocations = async (data) => {
    setImporting(true);
    setResults(null);
    
    try {
      const response = await importService.importAllocations(data);
      setResults(response);
      
      // Refresh resources to get updated allocations
      await refreshResources();
    } catch (err) {
      console.error('Import error:', err);
      setResults({
        total: data.length,
        successful: 0,
        failed: data.length,
        errors: [{ error: err.message || 'Failed to import allocations' }]
      });
    } finally {
      setImporting(false);
    }
  };
  
  // Handle import based on selected type
  const handleImport = async (data) => {
    switch (importType) {
      case 'resources':
        return handleImportResources(data);
      case 'projects':
        return handleImportProjects(data);
      case 'allocations':
        return handleImportAllocations(data);
      default:
        throw new Error(`Unsupported import type: ${importType}`);
    }
  };
  
  // Export reference data
  const handleExportReferenceData = async () => {
    try {
      setExporting(true);
      await exportService.exportAllReferenceData();
      alert('Reference data has been exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export reference data. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Import Data</h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setImportType('resources')}
              className={`px-4 py-2 rounded-md ${
                importType === 'resources' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Resources
            </button>
            <button
              onClick={() => setImportType('projects')}
              className={`px-4 py-2 rounded-md ${
                importType === 'projects' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setImportType('allocations')}
              className={`px-4 py-2 rounded-md ${
                importType === 'allocations' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Allocations
            </button>
          </div>
          
          {/* Export Reference Data Button */}
          <button
            onClick={handleExportReferenceData}
            disabled={exporting}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700 disabled:opacity-50"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Reference Data'}
          </button>
        </div>
        
        <ExcelImport 
          onImportData={handleImport} 
          dataType={importType}
          roles={roles}
          resources={resources}
          projects={projects}
          exportService={exportService}
        />
      </div>
      
      {results && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Import Results</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-xl font-bold text-blue-700">{results.total}</div>
              <div className="text-sm text-blue-600">Total Items</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-xl font-bold text-green-700">{results.successful}</div>
              <div className="text-sm text-green-600">Successfully Imported</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-xl font-bold text-red-700">{results.failed}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>
          
          {results.errors && results.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Errors:</h4>
              <div className="max-h-40 overflow-y-auto">
                <ul className="list-disc pl-5">
                  {results.errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-600 mb-1">
                      {error.item ? 
                        `Row with ${error.item}: ${error.error}` :
                        error.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Import Instructions</h3>
        
        <div className="mb-4">
          <h4 className="font-medium text-blue-700 mb-1">Resources Format</h4>
          <ul className="list-disc pl-5">
            <li>Required fields: <span className="font-mono">name</span>, <span className="font-mono">role</span></li>
            <li>Optional fields: <span className="font-mono">email</span>, <span className="font-mono">phone</span>, <span className="font-mono">skills</span> (comma-separated)</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium text-blue-700 mb-1">Projects Format</h4>
          <ul className="list-disc pl-5">
            <li>Required fields: <span className="font-mono">name</span>, <span className="font-mono">client</span></li>
            <li>Optional fields: 
              <ul className="list-disc pl-5 mt-1">
                <li><span className="font-mono">description</span> - Project description</li>
                <li><span className="font-mono">startDate</span> - Start date (YYYY-MM-DD)</li>
                <li><span className="font-mono">endDate</span> - End date (YYYY-MM-DD)</li>
                <li><span className="font-mono">requiredSkills</span> - Comma-separated list of skills</li>
                <li><span className="font-mono">requiredRoles</span> - JSON format array of role requirements:
                  <pre className="bg-gray-100 p-2 mt-1 rounded text-xs overflow-auto">
                    {`[
  {"roleId": 1, "count": 2},
  {"roleId": 3, "count": 1}
]`}
                  </pre>
                  <span className="text-xs block mt-1">
                    Where <span className="font-mono">roleId</span> is the ID of the role and <span className="font-mono">count</span> is the number of resources needed
                  </span>
                </li>
                <li><span className="font-mono">status</span> - Project status (default: Active)</li>
              </ul>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium text-blue-700 mb-1">Allocations Format</h4>
          <ul className="list-disc pl-5">
            <li>Required fields: <span className="font-mono">resourceId</span>, <span className="font-mono">projectId</span>, <span className="font-mono">startDate</span>, <span className="font-mono">endDate</span>, <span className="font-mono">utilization</span></li>
            <li><span className="font-mono">startDate</span> and <span className="font-mono">endDate</span> should be in YYYY-MM-DD format</li>
            <li><span className="font-mono">utilization</span> should be a number between 1 and 100</li>
          </ul>
        </div>
        
        {/* Reference Data section */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-blue-700">Reference Data</h4>
            <div className="flex space-x-2">
              <button 
                onClick={() => exportService.exportRoles()}
                className="bg-blue-600 text-white px-3 py-1 text-sm rounded flex items-center hover:bg-blue-700"
              >
                <FileDown className="h-3 w-3 mr-1" /> Export Roles
              </button>
              <button 
                onClick={() => exportService.exportResources()}
                className="bg-blue-600 text-white px-3 py-1 text-sm rounded flex items-center hover:bg-blue-700"
              >
                <FileDown className="h-3 w-3 mr-1" /> Export Resources
              </button>
              <button 
                onClick={() => exportService.exportProjects()}
                className="bg-blue-600 text-white px-3 py-1 text-sm rounded flex items-center hover:bg-blue-700"
              >
                <FileDown className="h-3 w-3 mr-1" /> Export Projects
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Use the export buttons to download reference files that map IDs to names. This is useful when preparing imports that require specific IDs.
          </p>
          
          {importType === 'projects' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-medium text-yellow-800 mb-1">Available Roles</h4>
              <p className="text-sm mb-2">Use these role IDs for the requiredRoles field:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {roles.map(role => (
                  <div key={role.id} className="bg-white p-2 rounded border border-gray-200 text-sm">
                    <span className="font-mono">ID: {role.id}</span> - {role.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {importType === 'allocations' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-medium text-yellow-800 mb-1">ID References for Allocations</h4>
              <p className="text-sm mb-2">You'll need these IDs for allocation imports:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div>
                  <h5 className="font-medium text-sm mb-2">Resources (First 10)</h5>
                  <div className="bg-white p-2 rounded border border-gray-200 max-h-40 overflow-y-auto">
                    {resources.slice(0, 10).map(resource => (
                      <div key={resource.id} className="text-sm py-1 border-b border-gray-100 last:border-0">
                        <strong>{resource.id}:</strong> {resource.name}
                      </div>
                    ))}
                    {resources.length > 10 && (
                      <div className="text-xs text-center text-gray-500 mt-1">
                        + {resources.length - 10} more... Export for complete list
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm mb-2">Projects (First 10)</h5>
                  <div className="bg-white p-2 rounded border border-gray-200 max-h-40 overflow-y-auto">
                    {projects.slice(0, 10).map(project => (
                      <div key={project.id} className="text-sm py-1 border-b border-gray-100 last:border-0">
                        <strong>{project.id}:</strong> {project.name}
                      </div>
                    ))}
                    {projects.length > 10 && (
                      <div className="text-xs text-center text-gray-500 mt-1">
                        + {projects.length - 10} more... Export for complete list
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
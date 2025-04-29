import React, { useState } from 'react';
import ExcelImport from './ExcelImport';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import * as resourceService from '../../services/resourceService';
import * as projectService from '../../services/projectService';
import * as allocationService from '../../services/allocationService';

const ImportPage = () => {
  const { refreshResources } = useResources();
  const { refreshProjects } = useProjects();
  const [importType, setImportType] = useState('resources');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  // Handle importing resources
  const handleImportResources = async (data) => {
    setImporting(true);
    setResults(null);
    
    try {
      const results = {
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      // Process each resource
      for (const item of data) {
        try {
          // Map the data to the API format
          const resourceData = {
            name: item.name,
            roleId: item.roleId || getRoleIdByName(item.role),
            email: item.email || null,
            phone: item.phone || null,
            skills: Array.isArray(item.skills) ? item.skills : 
              (item.skills ? item.skills.split(',').map(s => s.trim()) : [])
          };
          
          // Create the resource
          await resourceService.createResource(resourceData);
          results.successful++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            item,
            error: err.message || 'Unknown error'
          });
        }
      }
      
      // Refresh resources in context
      await refreshResources();
      
      setResults(results);
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
      const results = {
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      // Process each project
      for (const item of data) {
        try {
          // Map the data to the API format
          const projectData = {
            name: item.name,
            client: item.client,
            description: item.description || null,
            startDate: item.startDate || null,
            endDate: item.endDate || null,
            status: item.status || 'Active',
            requiredSkills: Array.isArray(item.requiredSkills) ? item.requiredSkills : 
              (item.requiredSkills ? item.requiredSkills.split(',').map(s => s.trim()) : [])
          };
          
          // Create the project
          await projectService.createProject(projectData);
          results.successful++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            item,
            error: err.message || 'Unknown error'
          });
        }
      }
      
      // Refresh projects in context
      await refreshProjects();
      
      setResults(results);
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
      const results = {
        total: data.length,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      // Process each allocation
      for (const item of data) {
        try {
          // Map the data to the API format
          const allocationData = {
            resourceId: parseInt(item.resourceId),
            projectId: parseInt(item.projectId),
            startDate: item.startDate,
            endDate: item.endDate,
            utilization: parseInt(item.utilization)
          };
          
          // Create the allocation
          await allocationService.updateAllocation(
            allocationData.resourceId, 
            allocationData
          );
          results.successful++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            item,
            error: err.message || 'Unknown error'
          });
        }
      }
      
      // Refresh resources to get updated allocations
      await refreshResources();
      
      setResults(results);
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
  
  // Helper to get role ID by name (mock implementation)
  const getRoleIdByName = (roleName) => {
    // This should be implemented to look up role ID by name
    // For now, return a fallback ID
    return 1;
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
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Import Data</h2>
      
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
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
        
        <ExcelImport 
          onImportData={handleImport} 
          dataType={importType} 
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
          
          {results.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Errors:</h4>
              <div className="max-h-40 overflow-y-auto">
                <ul className="list-disc pl-5">
                  {results.errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-600 mb-1">
                      {error.item ? 
                        `Row with ${error.item.name || 'Unknown'}: ${error.error}` :
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
            <li>Optional fields: <span className="font-mono">description</span>, <span className="font-mono">startDate</span>, <span className="font-mono">endDate</span>, <span className="font-mono">requiredSkills</span> (comma-separated)</li>
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
      </div>
    </div>
  );
};

export default ImportPage;
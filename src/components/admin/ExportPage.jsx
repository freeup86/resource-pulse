// src/components/admin/ExportPage.jsx
import React, { useState } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useRoles } from '../../contexts/RoleContext';
import * as exportService from '../../services/exportService';
import { FileDown, Check } from 'lucide-react';

const ExportPage = () => {
  const { resources } = useResources();
  const { projects } = useProjects();
  const { roles } = useRoles();
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);
  
  const handleExport = async (exportType) => {
    try {
      setExporting(true);
      setExportSuccess(null);
      
      let result;
      switch (exportType) {
        case 'roles':
          result = await exportService.exportRoles();
          break;
        case 'resources':
          result = await exportService.exportResources();
          break;
        case 'projects':
          result = await exportService.exportProjects();
          break;
        case 'all':
          result = await exportService.exportAllReferenceData();
          break;
        default:
          throw new Error(`Unknown export type: ${exportType}`);
      }
      
      setExportSuccess({
        type: exportType,
        result
      });
      
      setTimeout(() => {
        setExportSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Export Data</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Reference Data</h3>
          <p className="text-gray-600 mb-4">
            Export reference data to map IDs to names for import templates.
          </p>
          
          <button
            onClick={() => handleExport('all')}
            disabled={exporting}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center w-full hover:bg-green-700 disabled:opacity-50"
          >
            {exporting ? (
              'Exporting...'
            ) : exportSuccess?.type === 'all' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Exported Successfully!
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Export All Reference Data
              </>
            )}
          </button>
          
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => handleExport('roles')}
              disabled={exporting}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {exportSuccess?.type === 'roles' ? (
                <Check className="h-4 w-4 mx-auto" />
              ) : (
                'Roles'
              )}
            </button>
            
            <button
              onClick={() => handleExport('resources')}
              disabled={exporting}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {exportSuccess?.type === 'resources' ? (
                <Check className="h-4 w-4 mx-auto" />
              ) : (
                'Resources'
              )}
            </button>
            
            <button
              onClick={() => handleExport('projects')}
              disabled={exporting}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {exportSuccess?.type === 'projects' ? (
                <Check className="h-4 w-4 mx-auto" />
              ) : (
                'Projects'
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Reference Preview</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Roles ({roles.length})</h4>
              <div className="max-h-40 overflow-y-auto text-xs">
                {roles.slice(0, 10).map(role => (
                  <div key={role.id} className="border-b border-gray-100 py-1">
                    <strong className="inline-block w-6">{role.id}:</strong> {role.name}
                  </div>
                ))}
                {roles.length > 10 && (
                  <div className="text-gray-500 italic">
                    + {roles.length - 10} more...
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Resources ({resources.length})</h4>
              <div className="max-h-40 overflow-y-auto text-xs">
                {resources.slice(0, 10).map(resource => (
                  <div key={resource.id} className="border-b border-gray-100 py-1">
                    <strong className="inline-block w-6">{resource.id}:</strong> {resource.name}
                  </div>
                ))}
                {resources.length > 10 && (
                  <div className="text-gray-500 italic">
                    + {resources.length - 10} more...
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Projects ({projects.length})</h4>
              <div className="max-h-40 overflow-y-auto text-xs">
                {projects.slice(0, 10).map(project => (
                  <div key={project.id} className="border-b border-gray-100 py-1">
                    <strong className="inline-block w-6">{project.id}:</strong> {project.name}
                  </div>
                ))}
                {projects.length > 10 && (
                  <div className="text-gray-500 italic">
                    + {projects.length - 10} more...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Using Reference Data</h3>
        <p className="text-gray-700 mb-4">
          Export these reference files to see the mapping between IDs and names/descriptions for all entities in the system. This is useful when preparing import files that require specific IDs.
        </p>
        
        <h4 className="font-medium text-blue-700 mb-1">Examples</h4>
        <ul className="list-disc pl-5 text-gray-700">
          <li>Use the "Roles" export to find role IDs for the <code className="bg-gray-100 px-1 py-0.5 rounded">requiredRoles</code> field in project imports</li>
          <li>Use the "Resources" export to find resource IDs for the <code className="bg-gray-100 px-1 py-0.5 rounded">resourceId</code> field in allocation imports</li>
          <li>Use the "Projects" export to find project IDs for the <code className="bg-gray-100 px-1 py-0.5 rounded">projectId</code> field in allocation imports</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportPage;
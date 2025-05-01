// src/components/admin/SyncPage.jsx
import React, { useState } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useProjects } from '../../contexts/ProjectContext';
import * as syncService from '../../services/syncService';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

const SyncPage = () => {
  const { refreshResources } = useResources();
  const { refreshProjects } = useProjects();
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState(null);
  const [syncType, setSyncType] = useState('all');
  
  const handleSync = async () => {
    setSyncing(true);
    setResults(null);
    
    try {
      let response;
      
      switch (syncType) {
        case 'resources':
          response = await syncService.syncResources();
          await refreshResources();
          break;
        case 'projects':
          response = await syncService.syncProjects();
          await refreshProjects();
          break;
        case 'allocations':
          response = await syncService.syncAllocations();
          await refreshResources(); // Refresh to get updated allocations
          break;
        case 'all':
          response = await syncService.syncAll();
          await refreshResources();
          await refreshProjects();
          break;
        default:
          throw new Error(`Unknown sync type: ${syncType}`);
      }
      
      setResults(response);
    } catch (err) {
      console.error('Sync error:', err);
      setResults({
        error: true,
        message: err.message || 'Failed to sync data'
      });
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">External System Sync</h2>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-4">Sync Data</h3>
        
        <p className="text-gray-600 mb-4">
          Synchronize data from the external system to ResourcePulse. Select what you want to sync below.
        </p>
        
        <div className="mb-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setSyncType('all')}
              className={`px-4 py-2 rounded-md ${
                syncType === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Data
            </button>
            <button
              onClick={() => setSyncType('resources')}
              className={`px-4 py-2 rounded-md ${
                syncType === 'resources' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Resources
            </button>
            <button
              onClick={() => setSyncType('projects')}
              className={`px-4 py-2 rounded-md ${
                syncType === 'projects' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setSyncType('allocations')}
              className={`px-4 py-2 rounded-md ${
                syncType === 'allocations' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Allocations
            </button>
          </div>
        </div>
        
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center hover:bg-green-700 disabled:opacity-50"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Sync
            </>
          )}
        </button>
      </div>
      
      {results && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            {results.error ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span>Sync Failed</span>
              </>
            ) : (
              <>
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Sync Completed</span>
              </>
            )}
          </h3>
          
          {results.error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-red-600">{results.message}</p>
            </div>
          ) : (
            <div>
              {results.resources && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Resources</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-lg font-bold text-blue-700">{results.resources.total}</div>
                      <div className="text-sm text-blue-600">Total</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-lg font-bold text-green-700">{results.resources.created}</div>
                      <div className="text-sm text-green-600">Created</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-lg font-bold text-yellow-700">{results.resources.updated}</div>
                      <div className="text-sm text-yellow-600">Updated</div>
                    </div>
                  </div>
                </div>
              )}
              
              {results.projects && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Projects</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-lg font-bold text-blue-700">{results.projects.total}</div>
                      <div className="text-sm text-blue-600">Total</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-lg font-bold text-green-700">{results.projects.created}</div>
                      <div className="text-sm text-green-600">Created</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-lg font-bold text-yellow-700">{results.projects.updated}</div>
                      <div className="text-sm text-yellow-600">Updated</div>
                    </div>
                  </div>
                </div>
              )}
              
              {results.allocations && (
                <div>
                  <h4 className="font-medium mb-2">Allocations</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-lg font-bold text-blue-700">{results.allocations.total}</div>
                      <div className="text-sm text-blue-600">Total</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-lg font-bold text-green-700">{results.allocations.created}</div>
                      <div className="text-sm text-green-600">Created</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-lg font-bold text-yellow-700">{results.allocations.updated}</div>
                      <div className="text-sm text-yellow-600">Updated</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SyncPage;
// src/components/admin/SettingsPage.jsx
import React from 'react';
import SystemSettings from './SystemSettings';

const SettingsPage = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">System Settings</h2>
      
      <div className="space-y-6">
        <SystemSettings />
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-lg font-medium text-blue-800 mb-2">About Resource Allocation Settings</h3>
          
          <p className="text-gray-700 mb-4">
            These settings control how resources can be allocated to projects in ResourcePulse.
          </p>
          
          <h4 className="font-medium text-blue-700 mb-1">Maximum Resource Utilization</h4>
          <ul className="list-disc pl-5 text-gray-700 mb-4">
            <li>Default: 100%</li>
            <li>Controls the maximum allowed utilization percentage for any resource</li>
            <li>Values above 100% allow resources to be overallocated</li>
            <li>Example: Setting this to 120% allows resources to be allocated to 120% capacity</li>
          </ul>
          
          <h4 className="font-medium text-blue-700 mb-1">Default Allocation Percentage</h4>
          <ul className="list-disc pl-5 text-gray-700">
            <li>Default: 100%</li>
            <li>Controls the default utilization percentage when creating new allocations</li>
            <li>Example: Setting this to 50% will pre-fill new allocation forms with 50%</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import versionService from '../../services/versionService';

const VersionInfo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState(null);

  useEffect(() => {
    // Load version info when component mounts
    const loadVersionInfo = async () => {
      await versionService.loadVersionInfo();
      setVersionInfo(versionService.getFullVersionInfo());
    };

    loadVersionInfo();
  }, []);

  if (!versionInfo) {
    return null;
  }

  return (
    <div className="relative">
      {/* Version trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-xs text-gray-400 hover:text-gray-200 transition-colors duration-200"
        title="Version Information"
      >
        <Info className="h-3 w-3 mr-1" />
        <span>{versionService.getVersionString()}</span>
      </button>

      {/* Version details modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full text-gray-800">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Version Information</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Version:</span>
                <span className="font-mono text-sm">{versionInfo.version}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Build Number:</span>
                <span className="font-mono text-sm">{versionInfo.buildNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Commit:</span>
                <span className="font-mono text-sm">{versionInfo.commitHashShort}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Commit Date:</span>
                <span className="font-mono text-sm">
                  {new Date(versionInfo.commitDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Build Date:</span>
                <span className="font-mono text-sm">
                  {new Date(versionInfo.buildDate).toLocaleDateString()}
                </span>
              </div>
              
              {versionInfo.commitMessage && versionInfo.commitMessage !== 'Development build' && (
                <div className="border-t pt-3">
                  <span className="font-medium text-gray-600 block mb-1">Last Commit:</span>
                  <span className="text-sm text-gray-700 italic">
                    "{versionInfo.commitMessage}"
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-500 text-center">
                ResourcePulse - Resource Management System
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionInfo;
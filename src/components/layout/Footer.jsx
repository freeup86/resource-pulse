import React from 'react';
import VersionInfo from '../common/VersionInfo';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 px-4 mt-auto">
      <div className="container mx-auto flex justify-between items-center text-sm">
        <div className="text-gray-300">
          © 2025 ResourcePulse - Resource Management System
        </div>
        
        <div className="flex items-center space-x-4">
          <VersionInfo />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
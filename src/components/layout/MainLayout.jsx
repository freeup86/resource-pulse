import React from 'react';
import Header from './Header';

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-100 p-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} ResourcePulse. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
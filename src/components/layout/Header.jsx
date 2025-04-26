import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ResourcePulse</Link>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:underline">Dashboard</Link></li>
            <li><Link to="/resources" className="hover:underline">Resources</Link></li>
            <li><Link to="/projects" className="hover:underline">Projects</Link></li>
            <li><Link to="/allocations" className="hover:underline">Allocations</Link></li>
            <li><Link to="/timeline" className="hover:underline">Timeline</Link></li>
          </ul>
        </nav>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute top-16 right-0 left-0 bg-blue-600 z-10 md:hidden">
            <nav className="container mx-auto p-4">
              <ul className="flex flex-col space-y-2">
                <li>
                  <Link 
                    to="/" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/resources" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Resources
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/projects" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Projects
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/allocations" 
                    className="block p-2 hover:bg-blue-700 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Allocations
                  </Link>
                </li>
                <li>
                <Link 
                  to="/timeline" 
                  className="block p-2 hover:bg-blue-700 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Timeline
                </Link>
              </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
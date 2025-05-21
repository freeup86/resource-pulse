import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';

const MainLayout = ({ children }) => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  // Listen for scroll to determine when to show scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Listen for online/offline status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);
  
  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('Before install prompt triggered');
      // Don't prevent default here to avoid the error
      // e.preventDefault();
      
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install UI
      setIsInstallable(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Handle PWA installation
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Clear the deferred prompt (it can only be used once)
    setDeferredPrompt(null);
    setIsInstallable(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      {/* Offline alert */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-sm py-2 px-4 text-center">
          You are currently offline. Some features may be limited.
        </div>
      )}
      
      {/* Install PWA prompt */}
      {isInstallable && (
        <div className="bg-blue-700 text-white py-2 px-4 text-center flex justify-center items-center space-x-4">
          <span>Install ResourcePulse for offline access</span>
          <button 
            onClick={handleInstallClick}
            className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-medium"
          >
            Install
          </button>
        </div>
      )}
      
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {children}
      </main>
      
      <Footer />
      
      {/* Mobile bottom navigation */}
      <MobileNav />
      
      {/* Scroll to top button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 md:bottom-8 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default MainLayout;
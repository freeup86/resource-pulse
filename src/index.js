import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Create a function to register service worker for PWA functionality
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Wait until the page is fully loaded
    window.addEventListener('load', () => {
      // Use a timeout to avoid message channel closing error
      setTimeout(() => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered: ', registration);
          })
          .catch(error => {
            console.log('Service Worker registration failed: ', error);
          });
      }, 1000);
    });
  }
};

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
registerServiceWorker();
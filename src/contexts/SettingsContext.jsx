// src/contexts/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as settingsService from '../services/settingsService';

// Create context
const SettingsContext = createContext();

// Provider component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Default values until loaded from API
    appName: 'ResourcePulse',
    maxUtilizationPercentage: 100,
    defaultEndingSoonDays: 14,
    allowOverallocation: false,
    emailNotifications: false,
    resourceDefaultView: 'list',
    matchingThreshold: 60,
    externalSystemIntegration: false,
    defaultTimelineMonths: 3,
    customFields: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getSettings();
        setSettings(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Update settings
  const updateSettings = async (updatedSettings) => {
    try {
      setLoading(true);
      const data = await settingsService.updateSettings(updatedSettings);
      setSettings(data);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to update settings');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Utility functions to access common settings
  const getMaxUtilization = () => {
    return settings.maxUtilizationPercentage || 100;
  };

  const getDefaultAllocation = () => {
    return 100; // Default allocation percentage
  };

  const getAllowOverallocation = () => {
    return settings.allowOverallocation || false;
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      loading,
      error,
      updateSettings,
      // Add utility functions to the context
      getMaxUtilization,
      getDefaultAllocation,
      getAllowOverallocation
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for using the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
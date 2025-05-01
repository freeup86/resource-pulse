// src/services/settingsService.js
import api from './api';

/**
 * Fetch system settings
 * @returns {Promise<Object>} Settings object with key-value pairs
 */
export const getSettings = async () => {
  try {
    const response = await api.get('/settings');
    
    // Convert from {key: {value, description}} to {key: value} format for easier use
    const formattedSettings = {};
    Object.entries(response.data).forEach(([key, data]) => {
      formattedSettings[key] = data.value;
    });
    
    return formattedSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

/**
 * Update system settings
 * @param {Object} settings - Object containing settings to update
 * @returns {Promise<Object>} Updated settings
 */
export const updateSettings = async (settings) => {
  try {
    // Clean up settings object to remove any potentially problematic values
    const cleanSettings = {};
    Object.entries(settings).forEach(([key, value]) => {
      // Skip undefined values
      if (value === undefined) return;
      
      // Handle special case for objects - stringify them
      if (typeof value === 'object' && value !== null) {
        try {
          // Don't modify existing arrays or objects, just make sure they're valid
          cleanSettings[key] = value;
        } catch (err) {
          console.error(`Error processing object setting ${key}:`, err);
          // Default to empty array if conversion fails
          cleanSettings[key] = Array.isArray(value) ? [] : {};
        }
      } else {
        cleanSettings[key] = value;
      }
    });
    
    const response = await api.put('/settings', cleanSettings);
    
    // Convert from {key: {value, description}} to {key: value} format for easier use
    const formattedSettings = {};
    Object.entries(response.data).forEach(([key, data]) => {
      formattedSettings[key] = data.value;
    });
    
    return formattedSettings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};
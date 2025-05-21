/**
 * Storage Service for managing local data persistence
 * Uses localStorage with a structured approach to save and retrieve data
 */

// Storage keys
const STORAGE_KEYS = {
  SAVED_SEARCHES: 'resourcePulse_savedSearches',
  RECENT_SEARCHES: 'resourcePulse_recentSearches',
  USER_PREFERENCES: 'resourcePulse_userPreferences',
  VIEW_PREFERENCES: 'resourcePulse_viewPreferences',
};

/**
 * Get data from localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key not found
 * @returns {any} Parsed data or default value
 */
const getFromStorage = (key, defaultValue = null) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) return defaultValue;
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Error retrieving data from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 * @returns {boolean} Success indicator
 */
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving data to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success indicator
 */
const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing data from localStorage (${key}):`, error);
    return false;
  }
};

// Saved Searches
const savedSearchesService = {
  /**
   * Get all saved searches
   * @returns {Array} Saved searches
   */
  getSavedSearches: () => {
    return getFromStorage(STORAGE_KEYS.SAVED_SEARCHES, []);
  },
  
  /**
   * Save a new search
   * @param {Object} search - Search to save
   * @returns {boolean} Success indicator
   */
  saveSearch: (search) => {
    const searches = savedSearchesService.getSavedSearches();
    // Add id and timestamp to the search
    const newSearch = {
      ...search,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    return saveToStorage(STORAGE_KEYS.SAVED_SEARCHES, [...searches, newSearch]);
  },
  
  /**
   * Delete a saved search
   * @param {string} searchId - ID of the search to delete
   * @returns {boolean} Success indicator
   */
  deleteSearch: (searchId) => {
    const searches = savedSearchesService.getSavedSearches();
    const updatedSearches = searches.filter((search) => search.id !== searchId);
    return saveToStorage(STORAGE_KEYS.SAVED_SEARCHES, updatedSearches);
  },
  
  /**
   * Clear all saved searches
   * @returns {boolean} Success indicator
   */
  clearSavedSearches: () => {
    return removeFromStorage(STORAGE_KEYS.SAVED_SEARCHES);
  }
};

// Recent Searches
const recentSearchesService = {
  /**
   * Get recent searches
   * @param {number} limit - Maximum number of searches to return
   * @returns {Array} Recent searches
   */
  getRecentSearches: (limit = 5) => {
    const searches = getFromStorage(STORAGE_KEYS.RECENT_SEARCHES, []);
    return searches.slice(0, limit);
  },
  
  /**
   * Add a search to recent searches
   * @param {string} searchTerm - Search term to add
   * @param {number} limit - Maximum number of searches to keep
   * @returns {boolean} Success indicator
   */
  addRecentSearch: (searchTerm, limit = 5) => {
    if (!searchTerm.trim()) return false;
    
    const searches = recentSearchesService.getRecentSearches();
    // Remove duplicates and add new search to beginning
    const updatedSearches = [
      searchTerm,
      ...searches.filter((s) => s !== searchTerm)
    ].slice(0, limit);
    
    return saveToStorage(STORAGE_KEYS.RECENT_SEARCHES, updatedSearches);
  },
  
  /**
   * Clear recent searches
   * @returns {boolean} Success indicator
   */
  clearRecentSearches: () => {
    return removeFromStorage(STORAGE_KEYS.RECENT_SEARCHES);
  }
};

// User Preferences
const userPreferencesService = {
  /**
   * Get all user preferences
   * @returns {Object} User preferences
   */
  getUserPreferences: () => {
    return getFromStorage(STORAGE_KEYS.USER_PREFERENCES, {});
  },
  
  /**
   * Get a specific user preference
   * @param {string} key - Preference key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Preference value
   */
  getPreference: (key, defaultValue = null) => {
    const preferences = userPreferencesService.getUserPreferences();
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  },
  
  /**
   * Save a user preference
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   * @returns {boolean} Success indicator
   */
  savePreference: (key, value) => {
    const preferences = userPreferencesService.getUserPreferences();
    const updatedPreferences = { ...preferences, [key]: value };
    return saveToStorage(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
  },
  
  /**
   * Save multiple preferences at once
   * @param {Object} preferences - Object with key-value pairs
   * @returns {boolean} Success indicator
   */
  savePreferences: (preferences) => {
    const currentPreferences = userPreferencesService.getUserPreferences();
    const updatedPreferences = { ...currentPreferences, ...preferences };
    return saveToStorage(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
  }
};

// View Preferences (column visibility, sorting, etc.)
const viewPreferencesService = {
  /**
   * Get view preferences for a specific view
   * @param {string} viewId - Identifier for the view
   * @returns {Object} View preferences
   */
  getViewPreferences: (viewId) => {
    const allPreferences = getFromStorage(STORAGE_KEYS.VIEW_PREFERENCES, {});
    return allPreferences[viewId] || {};
  },
  
  /**
   * Save view preferences for a specific view
   * @param {string} viewId - Identifier for the view
   * @param {Object} preferences - View preferences
   * @returns {boolean} Success indicator
   */
  saveViewPreferences: (viewId, preferences) => {
    const allPreferences = getFromStorage(STORAGE_KEYS.VIEW_PREFERENCES, {});
    const updatedPreferences = {
      ...allPreferences,
      [viewId]: { ...allPreferences[viewId], ...preferences }
    };
    return saveToStorage(STORAGE_KEYS.VIEW_PREFERENCES, updatedPreferences);
  }
};

// Export all services and utilities
export default {
  savedSearches: savedSearchesService,
  recentSearches: recentSearchesService,
  userPreferences: userPreferencesService,
  viewPreferences: viewPreferencesService,
  keys: STORAGE_KEYS
};
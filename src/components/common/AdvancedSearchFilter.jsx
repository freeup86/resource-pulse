import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Save, Clock } from 'lucide-react';

const AdvancedSearchFilter = ({ 
  searchTerm, 
  onSearchChange, 
  filters = [],
  onFilterChange,
  advancedFilters = [],
  onAdvancedFilterChange,
  savedSearches = [],
  onSaveSearch,
  onApplySavedSearch,
  onClearFilters
}) => {
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  
  const searchInputRef = useRef(null);
  const savedSearchesRef = useRef(null);
  const recentSearchesRef = useRef(null);
  
  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (savedSearchesRef.current && !savedSearchesRef.current.contains(event.target)) {
        setShowSavedSearches(false);
      }
      if (recentSearchesRef.current && !recentSearchesRef.current.contains(event.target)) {
        setShowRecentSearches(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Store recent searches in localStorage
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      setRecentSearches(JSON.parse(storedSearches));
    }
  }, []);
  
  // Save search to recent searches
  const addToRecentSearches = useCallback((term) => {
    if (!term) return;
    
    const updatedSearches = [
      term,
      ...recentSearches.filter(s => s !== term).slice(0, 4) // Keep only 5 most recent
    ];
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  }, [recentSearches]);
  
  // Handle search submit
  const handleSubmitSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      addToRecentSearches(searchTerm);
    }
  };
  
  // Handle applying a saved or recent search
  const handleApplySearch = (search) => {
    if (typeof search === 'string') {
      // Simple search term
      onSearchChange(search);
      addToRecentSearches(search);
    } else {
      // Saved search with filters
      onApplySavedSearch(search);
      addToRecentSearches(search.query);
    }
    
    setShowSavedSearches(false);
    setShowRecentSearches(false);
  };
  
  // Handle saving current search
  const handleSaveSearch = () => {
    if (newSearchName.trim()) {
      onSaveSearch({
        name: newSearchName,
        query: searchTerm,
        filters: advancedFilters.filter(f => f.value !== undefined)
      });
      setNewSearchName('');
    }
  };
  
  // Count applied filters
  useEffect(() => {
    let count = 0;
    if (advancedFilters) {
      count += advancedFilters.filter(f => f.value !== undefined && f.value !== '').length;
    }
    
    // Count active basic filters
    if (filters) {
      count += filters.filter(f => f.active && f.value !== 'all').length;
    }
    
    setAppliedFiltersCount(count);
  }, [advancedFilters, filters]);
  
  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Search bar and buttons */}
      <div className="p-3 border-b border-gray-200">
        <form onSubmit={handleSubmitSearch} className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-grow">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setTimeout(() => setInputFocused(false), 200)}
              className="w-full p-2 pl-10 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            {/* Recent searches dropdown */}
            {inputFocused && recentSearches.length > 0 && (
              <div 
                ref={recentSearchesRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10"
              >
                <div className="p-2 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Recent Searches</span>
                  <button 
                    onClick={() => setRecentSearches([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <ul>
                  {recentSearches.map((search, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => handleApplySearch(search)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                      >
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{typeof search === 'string' ? search : search.query}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setAdvancedFilterOpen(!advancedFilterOpen)}
              className={`px-3 py-2 rounded border flex items-center ${
                appliedFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <Filter className="h-4 w-4 mr-1" />
              <span>{appliedFiltersCount > 0 ? `Filters (${appliedFiltersCount})` : 'Filters'}</span>
              {advancedFilterOpen ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
            
            {/* Saved searches button */}
            <div className="relative" ref={savedSearchesRef}>
              <button
                type="button"
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Saved</span>
                {showSavedSearches ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </button>
              
              {/* Saved searches dropdown */}
              {showSavedSearches && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="p-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Saved Searches</span>
                  </div>
                  
                  {savedSearches.length > 0 ? (
                    <ul className="max-h-40 overflow-y-auto">
                      {savedSearches.map((search, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleApplySearch(search)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                          >
                            {search.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No saved searches
                    </div>
                  )}
                  
                  <div className="p-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Save current search as..."
                        value={newSearchName}
                        onChange={(e) => setNewSearchName(e.target.value)}
                        className="flex-grow text-sm p-1 border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={handleSaveSearch}
                        disabled={!newSearchName.trim()}
                        className={`p-1 rounded ${
                          newSearchName.trim() 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Clear filters button - only show if filters applied */}
            {(searchTerm || appliedFiltersCount > 0) && (
              <button
                type="button"
                onClick={onClearFilters}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Basic filter buttons */}
      {filters.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-2">
          {filters.map(filter => (
            <button
              key={filter.value}
              className={`px-3 py-1 text-sm rounded ${
                filter.active 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Advanced filters */}
      {advancedFilterOpen && advancedFilters.length > 0 && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {advancedFilters.map((filter, index) => (
              <div key={index} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                
                {filter.type === 'select' && (
                  <select
                    value={filter.value || ''}
                    onChange={(e) => onAdvancedFilterChange(filter.id, e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Any {filter.label}</option>
                    {filter.options.map((option, idx) => (
                      <option key={idx} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={filter.value || ''}
                    onChange={(e) => onAdvancedFilterChange(filter.id, e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                )}
                
                {filter.type === 'text' && (
                  <input
                    type="text"
                    value={filter.value || ''}
                    onChange={(e) => onAdvancedFilterChange(filter.id, e.target.value)}
                    placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}`}
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                )}
                
                {filter.type === 'checkbox' && (
                  <div className="flex space-x-3">
                    {filter.options.map((option, idx) => (
                      <label key={idx} className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={filter.value?.includes(option.value) || false}
                          onChange={(e) => {
                            const currentValues = filter.value || [];
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(v => v !== option.value);
                            onAdvancedFilterChange(filter.id, newValues);
                          }}
                          className="mr-1.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}
                
                {filter.type === 'range' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={filter.value?.min || ''}
                      onChange={(e) => {
                        const min = e.target.value;
                        const max = filter.value?.max || '';
                        onAdvancedFilterChange(filter.id, { min, max });
                      }}
                      placeholder="Min"
                      className="p-2 border border-gray-300 rounded text-sm w-1/2"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      value={filter.value?.max || ''}
                      onChange={(e) => {
                        const min = filter.value?.min || '';
                        const max = e.target.value;
                        onAdvancedFilterChange(filter.id, { min, max });
                      }}
                      placeholder="Max"
                      className="p-2 border border-gray-300 rounded text-sm w-1/2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilter;
import React, { useState, useEffect, useRef } from 'react';
import { search, getSuggestions, getRecentSearches } from '../../../services/naturalLanguageSearchService';
import SearchInput from './SearchInput';
import SearchResults from './SearchResults';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';

const NaturalLanguageSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [entityFilters, setEntityFilters] = useState({
    resources: true,
    projects: true,
    skills: true,
    allocations: true
  });
  const searchInputRef = useRef(null);

  // Fetch recent searches on initial load
  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const recent = await getRecentSearches();
        
        // Check if the returned data is the expected format
        if (recent && recent.recent && Array.isArray(recent.recent)) {
          // Extract the query string from each item if it's an object
          const recentQueries = recent.recent.map(item => 
            typeof item === 'object' && item.query ? item.query : item
          );
          setRecentSearches(recentQueries);
        } else if (Array.isArray(recent)) {
          // If it's already an array, use it directly
          setRecentSearches(recent);
        } else {
          // Fallback to empty array if format is unexpected
          console.warn('Unexpected format from getRecentSearches:', recent);
          setRecentSearches([]);
        }
      } catch (err) {
        console.error('Error fetching recent searches:', err);
        setRecentSearches([]); // Set to empty array on error
      }
    };
    
    fetchRecentSearches();
  }, []);

  // Fetch suggestions when the search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const suggestedQueries = await getSuggestions(searchQuery);
          setSuggestions(suggestedQueries);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchSuggestions, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    
    try {
      // Create array of enabled entity types
      const entityTypes = Object.entries(entityFilters)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([type]) => type);
      
      // Log the request for debugging
      console.log(`Sending search request with query: "${query}" and entity types:`, entityTypes);
      
      const results = await search(query, { entityTypes });
      
      // Validate that results is an object
      if (!results || typeof results !== 'object') {
        throw new Error('Invalid response from search API');
      }
      
      console.log('Search API returned:', results);
      
      // Ensure results has expected format
      setSearchResults({
        query: results.query || query,
        results: results.results || {},
        timestamp: results.timestamp || new Date().toISOString(),
        aiAnalysis: results.results?.interpretation?.originalQuery ? 
          `I understood your query "${results.results.interpretation.originalQuery}" as "${results.results.interpretation.interpretedQuery}"` : 
          undefined,
        notice: results.notice,
        errors: results.errors
      });
      
      // Update recent searches (normally this would be handled by the backend)
      // Ensure recentSearches is an array before using includes
      const isQueryInRecentSearches = Array.isArray(recentSearches) && 
        recentSearches.some(search => search === query);
      
      if (!isQueryInRecentSearches) {
        // Make sure we're updating with an array, providing a default if needed
        setRecentSearches(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return [query, ...prevArray].slice(0, 5);
        });
      }
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Failed to perform search. Please try again later.');
      
      // Provide empty results instead of null to avoid rendering errors
      setSearchResults({
        query: query,
        results: {},
        timestamp: new Date().toISOString(),
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (value) => {
    setSearchQuery(value);
  };

  const handleSuggestionClick = (suggestion) => {
    // Handle both string suggestions and object suggestions
    const searchText = typeof suggestion === 'object' && suggestion.text 
      ? suggestion.text 
      : suggestion;
    
    setSearchQuery(searchText);
    handleSearch(searchText);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (recent) => {
    // Make sure we handle both string and object formats
    const searchText = typeof recent === 'string' ? recent : 
      (typeof recent === 'object' && recent.query ? recent.query : '');
    
    if (searchText) {
      setSearchQuery(searchText);
      handleSearch(searchText);
    }
  };

  const handleFilterChange = (filterType) => {
    setEntityFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">AI-Powered Natural Language Search</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6" ref={searchInputRef}>
            <SearchInput 
              value={searchQuery}
              onChange={handleQueryChange}
              onSearch={() => handleSearch()}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              onSuggestionClick={handleSuggestionClick}
              placeholder="Search using natural language..."
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Filter by:</span>
            {Object.entries(entityFilters).map(([type, isEnabled]) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-full text-sm ${
                  isEnabled 
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          
          {Array.isArray(recentSearches) && recentSearches.length > 0 && !searchResults && !loading && (
            <div className="mt-8">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Recent Searches</h2>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                    onClick={() => handleRecentSearchClick(recent)}
                  >
                    {typeof recent === 'string' ? recent : (
                      typeof recent === 'object' && recent.query ? recent.query : 'Search'
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="my-8">
          <ErrorMessage message={error} />
        </div>
      ) : searchResults ? (
        <SearchResults results={searchResults} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center my-8">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Start Searching</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Try asking questions like "Show me available resources with React skills" or 
            "Find projects ending next month with budget issues"
          </p>
        </div>
      )}
    </div>
  );
};

export default NaturalLanguageSearchPage;
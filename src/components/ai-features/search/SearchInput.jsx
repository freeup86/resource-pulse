import React from 'react';

const SearchInput = ({ 
  value, 
  onChange, 
  onSearch, 
  suggestions = [], 
  showSuggestions = false,
  onSuggestionClick,
  placeholder = "Search..." 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          type="text"
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="absolute right-3 p-1 text-gray-500 hover:text-gray-700"
          onClick={onSearch}
          type="button"
          aria-label="Search"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Search suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <p className="text-sm text-gray-700">
                  {typeof suggestion === 'object' && suggestion.text 
                    ? suggestion.text 
                    : suggestion}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <svg className="w-5 h-5 mr-2 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium mb-1">Try using natural language queries like:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li><span className="italic text-blue-600">Show me resources with Python skills who will be free next month</span></li>
              <li><span className="italic text-blue-600">Find projects that are at risk of going over budget</span></li>
              <li><span className="italic text-blue-600">Which developers are available in New York next week?</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
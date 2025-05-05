/**
 * Search Controller
 * Handles API endpoints for natural language search functionality
 */
const naturalLanguageSearchService = require('../services/naturalLanguageSearchService');

/**
 * Perform a natural language search across entities
 */
const search = async (req, res) => {
  try {
    console.log(`Search request received with params:`, JSON.stringify(req.query));
    const query = req.query.q;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        error: 'Search query is required',
        code: 'MISSING_QUERY',
        status: 400
      });
    }
    
    // Type checking for query parameters - debug log all query parameters
    console.log('All query parameters:', req.query);
    
    // Handle multiple variations of entity types parameter
    const entityTypes = req.query.entityTypes || req.query.types;
    let validatedTypes;
    
    if (entityTypes) {
      try {
        console.log('Raw entityTypes received:', entityTypes);
        
        // Handle all possible formats of the entityTypes parameter
        if (Array.isArray(entityTypes)) {
          // Handle array format
          validatedTypes = entityTypes.map(type => String(type).toUpperCase());
        } else if (typeof entityTypes === 'string' && entityTypes.includes(',')) {
          // Handle comma-separated string
          validatedTypes = entityTypes.split(',').map(type => type.trim().toUpperCase());
        } else if (typeof entityTypes === 'string') {
          // Handle single value
          validatedTypes = [entityTypes.toUpperCase()];
        } else {
          // Unknown format
          console.warn('Unknown entityTypes format:', entityTypes);
          validatedTypes = undefined;
        }
        
        console.log('Parsed entityTypes:', validatedTypes);
        
        // Filter out invalid types
        const validTypes = ['RESOURCES', 'PROJECTS', 'ALLOCATIONS', 'SKILLS'];
        if (validatedTypes) {
          validatedTypes = validatedTypes.filter(type => validTypes.includes(type));
        }
        
        if (!validatedTypes || validatedTypes.length === 0) {
          console.log('No valid entity types found, using defaults');
          validatedTypes = undefined; // Use default if none are valid
        }
      } catch (parseError) {
        console.warn('Error parsing entity types:', parseError);
        validatedTypes = undefined; // Use default on error
      }
    }
    
    console.log('Final validated types:', validatedTypes);
    
    // Parse limit with validation
    let limit = 10;
    if (req.query.limit) {
      try {
        limit = parseInt(req.query.limit, 10);
        if (isNaN(limit) || limit < 1) {
          limit = 10;
        } else if (limit > 100) { 
          limit = 100; // Cap at reasonable maximum
        }
      } catch (parseError) {
        console.warn('Error parsing limit:', parseError);
      }
    }
    
    const options = {
      useAI: req.query.useAI !== 'false',
      searchTypes: validatedTypes, // This will be passed to the search service
      limit: limit,
      forceFallback: process.env.FORCE_FALLBACK === 'true' || req.query.fallback === 'true'
    };
    
    // Check if we're forcing fallback mode for debugging/resilience
    if (options.forceFallback) {
      console.log('Force fallback mode enabled - using mock data instead of database');
    }
    
    console.log('Search options:', options);

    console.log(`Processing search for: "${query}" with options:`, JSON.stringify(options));
    const results = await naturalLanguageSearchService.search(query, options);
    res.json(results);
  } catch (error) {
    console.error('Error performing search:', error);
    
    // Determine error type for better client handling
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message && error.message.includes('Database connection')) {
      errorCode = 'DB_CONNECTION_ERROR';
    } else if (error.message && error.message.includes('credit balance')) {
      errorCode = 'AI_CREDIT_ERROR';
      statusCode = 402; // Payment required
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorCode = 'TIMEOUT_ERROR';
      statusCode = 504; // Gateway timeout
    } else if (error.message && error.message.includes('parameter')) {
      errorCode = 'PARAMETER_ERROR';
      statusCode = 400; // Bad request
    }
    
    // If it's a SQL parameter validation error, return partial results instead of a complete failure
    if (error.code === 'EPARAM' || error.message.includes('parameter')) {
      console.log('Returning partial results due to parameter validation error');
      
      // Return a 200 response with empty results and an error field
      res.status(200).json({
        query: query,
        results: {},
        errors: [{
          message: 'Some search results were not available due to database issues',
          details: error.message
        }],
        timestamp: new Date().toISOString(),
        partial: true
      });
    } else {
      // Create a clean error response with helpful details for other errors
      res.status(statusCode).json({ 
        error: 'Search failed', 
        code: errorCode,
        message: error.message || 'Unknown error occurred',
        status: statusCode,
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Get search suggestions based on partial query
 */
const getSuggestions = async (req, res) => {
  try {
    console.log(`Suggestions request received with params:`, JSON.stringify(req.query));
    const partialQuery = req.query.q;
    
    if (!partialQuery || partialQuery.trim() === '') {
      return res.json([]);
    }
    
    // Parse limit with validation
    let limit = 5; // Default for suggestions
    if (req.query.limit) {
      try {
        limit = parseInt(req.query.limit, 10);
        if (isNaN(limit) || limit < 1) {
          limit = 5;
        } else if (limit > 20) { 
          limit = 20; // Cap at reasonable maximum
        }
      } catch (parseError) {
        console.warn('Error parsing suggestions limit:', parseError);
      }
    }
    
    const options = {
      limit: limit,
    };

    console.log(`Getting suggestions for: "${partialQuery}" with limit: ${limit}`);
    const suggestions = await naturalLanguageSearchService.getSuggestions(partialQuery, options);
    
    // Validate suggestions to avoid client-side errors
    const validatedSuggestions = Array.isArray(suggestions) ? 
      suggestions.filter(item => item && (typeof item === 'string' || (typeof item === 'object' && item.text))) 
      : [];
    
    res.json(validatedSuggestions);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    
    // Determine error type for better client handling
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message && error.message.includes('Database connection')) {
      errorCode = 'DB_CONNECTION_ERROR';
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorCode = 'TIMEOUT_ERROR';
      statusCode = 504; // Gateway timeout
    }
    
    res.status(statusCode).json({ 
      error: 'Failed to get search suggestions', 
      code: errorCode,
      message: error.message || 'Unknown error occurred',
      status: statusCode,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Interpret a search query using AI
 */
const interpretQuery = async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const interpretation = await naturalLanguageSearchService.interpretSearchQuery(query);
    res.json({
      query,
      interpretation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error interpreting search query:', error);
    res.status(500).json({ error: 'Failed to interpret search query', details: error.message });
  }
};

/**
 * Get recent searches for the user
 */
const getRecentSearches = async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 5,
    };

    const recentSearches = await naturalLanguageSearchService.getRecentSearches(userId, options);
    res.json(recentSearches);
  } catch (error) {
    console.error('Error getting recent searches:', error);
    res.status(500).json({ error: 'Failed to get recent searches', details: error.message });
  }
};

module.exports = {
  search,
  getSuggestions,
  interpretQuery,
  getRecentSearches
};
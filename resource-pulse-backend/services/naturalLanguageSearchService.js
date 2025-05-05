/**
 * Natural Language Search Service
 * Provides AI-powered natural language search capabilities across resources, projects, and other data
 */
const { poolPromise, sql } = require('../db/config');
const { Anthropic } = require('@anthropic-ai/sdk');
const telemetry = require('./aiTelemetry');

// Define SQL types in case sql is not available
const SQL_TYPES = {
  Int: 'INT',
  NVarChar: 'NVARCHAR',
  Date: 'DATE',
  Bit: 'BIT',
  Float: 'FLOAT',
  BigInt: 'BIGINT',
  VarChar: 'VARCHAR'
};

// Initialize Claude client if API key is available
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const claude = CLAUDE_API_KEY ? new Anthropic({
  apiKey: CLAUDE_API_KEY,
}) : null;

// Search types and their corresponding database queries
const SEARCH_TYPES = {
  RESOURCES: {
    table: 'resources',
    fields: ['name', 'email', 'title', 'bio', 'location'],
    joins: [
      { 
        table: 'roles', 
        alias: 'ro', 
        on: 'resources.role_id = ro.id', 
        fields: ['ro.name AS role_name'] 
      },
      { 
        type: 'LEFT JOIN',
        table: 'resource_skills', 
        alias: 'rs', 
        on: 'resources.id = rs.resource_id', 
        subQuery: false 
      },
      { 
        type: 'LEFT JOIN',
        table: 'skills', 
        alias: 's', 
        on: 'rs.skill_id = s.id', 
        fields: ['STRING_AGG(DISTINCT s.name, \',\') AS skills'] 
      }
    ],
    groupBy: 'resources.id'
  },
  PROJECTS: {
    table: 'projects',
    fields: ['name', 'description', 'status', 'start_date', 'end_date'],
    joins: [
      { 
        table: 'clients', 
        alias: 'cl', 
        on: 'projects.client_id = cl.id', 
        fields: ['cl.name AS client_name'] 
      },
      { 
        type: 'LEFT JOIN',
        table: 'project_skills', 
        alias: 'ps', 
        on: 'projects.id = ps.project_id', 
        subQuery: false 
      },
      { 
        type: 'LEFT JOIN',
        table: 'skills', 
        alias: 's', 
        on: 'ps.skill_id = s.id', 
        fields: ['STRING_AGG(DISTINCT s.name, \',\') AS required_skills'] 
      }
    ],
    groupBy: 'projects.id'
  },
  ALLOCATIONS: {
    table: 'allocations',
    fields: ['start_date', 'end_date', 'percentage', 'notes'],
    joins: [
      { 
        table: 'resources', 
        alias: 'r', 
        on: 'allocations.resource_id = r.id', 
        fields: ['r.name AS resource_name'] 
      },
      { 
        table: 'projects', 
        alias: 'p', 
        on: 'allocations.project_id = p.id', 
        fields: ['p.name AS project_name'] 
      }
    ]
  },
  SKILLS: {
    table: 'skills',
    fields: ['name', 'description', 'category'],
    joins: []
  }
};

/**
 * Perform natural language search across all entities
 * @param {string} query - The natural language search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
const search = async (query, options = {}) => {
  try {
    console.log('Starting search with query:', query);
    console.log('Search options received:', options);
    
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }
    
    // Quick check to determine if we should bypass SQL Server entirely
    let bypassSql = process.env.BYPASS_SQL === 'true' || !sql;
    
    // Log SQL module status for debugging
    console.log('SQL module available:', !!sql);
    console.log('Bypassing SQL:', bypassSql);

    // Try to use AI to interpret the search intent if available
    let searchIntent = null;
    let interpretedQuery = null;
    
    if (claude && (options.useAI !== false)) {
      try {
        // Only attempt to use AI if we have a valid API key and setup
        if (process.env.CLAUDE_API_KEY) {
          try {
            const interpretation = await interpretSearchQuery(query);
            searchIntent = interpretation.intent;
            interpretedQuery = interpretation.interpretedQuery;
          } catch (aiError) {
            // Check if it's a credit balance issue
            if (aiError.message && aiError.message.includes('credit balance is too low')) {
              console.log('AI interpretation skipped - credit balance too low');
            } else {
              console.warn('Error interpreting search query with AI:', aiError);
            }
            // Continue with keyword search as fallback
          }
        } else {
          console.log('AI interpretation skipped - no API key configured');
        }
      } catch (error) {
        console.warn('Error in AI interpretation setup:', error);
        // Continue with keyword search as fallback
      }
    }
    
    // If AI interpretation failed or is disabled, use direct search
    const results = {};
    
    // Handle different parameter formats for searchTypes - support both searchTypes and types
    let searchTypes;
    
    // Log the received search types for debugging
    console.log('options.searchTypes:', options.searchTypes);
    console.log('options.types:', options.types);
    
    if (options.searchTypes) {
      searchTypes = options.searchTypes;
    } else if (options.types) {
      // Handle the 'types' parameter passed from the controller
      if (typeof options.types === 'string') {
        searchTypes = options.types.split(',').map(t => t.trim().toUpperCase());
      } else if (Array.isArray(options.types)) {
        searchTypes = options.types.map(t => String(t).toUpperCase());
      }
    }
    
    // If no valid search types, use all available types
    if (!searchTypes || !Array.isArray(searchTypes) || searchTypes.length === 0) {
      searchTypes = Object.keys(SEARCH_TYPES);
    }
    
    console.log('Searching in entity types:', searchTypes);
    
    // Ensure valid limit
    const limit = options.limit || 10;
    
    // Update bypass SQL flag with additional conditions
    bypassSql = bypassSql || options.forceFallback === true;
    
    if (bypassSql) {
      console.log('Bypassing SQL and using fallback directly');
      
      // Add a notice about using fallback data
      results.notice = "Using fallback data - database connection unavailable";
      
      // Use fallback search for all entity types
      for (const entityType of searchTypes) {
        if (SEARCH_TYPES[entityType]) {
          results[entityType.toLowerCase()] = searchEntityByKeywordsFallback(entityType, query);
        }
      }
    } else if (searchIntent && interpretedQuery) {
      // AI interpreted search
      for (const entityType of searchIntent.entityTypes) {
        if (searchTypes.includes(entityType)) {
          try {
            const entityResults = await searchEntity(entityType, interpretedQuery, searchIntent.filters, limit);
            results[entityType.toLowerCase()] = entityResults;
          } catch (searchError) {
            console.error(`Error searching ${entityType} with AI interpretation, using fallback:`, searchError);
            results[entityType.toLowerCase()] = searchEntityByKeywordsFallback(entityType, query);
          }
        }
      }
      
      // Add interpretation metadata to results
      results.interpretation = {
        originalQuery: query,
        interpretedQuery: interpretedQuery,
        intent: searchIntent
      };
    } else {
      // Fallback to standard keyword search across all requested types
      for (const entityType of searchTypes) {
        if (SEARCH_TYPES[entityType]) {
          try {
            const entityResults = await searchEntityByKeywords(entityType, query, limit);
            results[entityType.toLowerCase()] = entityResults;
          } catch (searchError) {
            console.error(`Error searching ${entityType}, using fallback:`, searchError);
            
            // Use a fallback search method for this entity type
            results[entityType.toLowerCase()] = searchEntityByKeywordsFallback(entityType, query);
            
            // Add an error flag to the results
            if (!results.errors) {
              results.errors = [];
            }
            results.errors.push({
              entityType: entityType,
              message: `Search for ${entityType} failed: ${searchError.message}`
            });
          }
        }
      }
    }
    
    return {
      query,
      results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error performing natural language search:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
};

/**
 * Interpret search query using AI to extract intent and structured filters
 * @param {string} query - The natural language search query
 * @returns {Promise<Object>} - Interpreted search intent
 */
const interpretSearchQuery = async (query) => {
  if (!claude) {
    throw new Error('Claude API client not initialized');
  }
  
  try {
    // Record API call in telemetry
    telemetry.recordRequest('claude_search_interpretation');
    
    const prompt = `<instructions>
You are an AI assistant specializing in interpreting natural language search queries for a resource management system. Your task is to analyze the user's search query and extract structured information about their search intent.
</instructions>

<query>${query}</query>

I need you to analyze this search query for our resource management system and break it down into a structured format that our application can use.

Please provide your response in JSON format with the following structure:
1. "entityTypes": An array of entity types to search in, which can include: RESOURCES, PROJECTS, ALLOCATIONS, SKILLS
2. "interpretedQuery": A cleaner, more structured version of the original query
3. "filters": An object with specific filters extracted from the query (dates, skills, locations, status, etc.)
4. "sortBy": How results should be sorted (relevance, date, name)
5. "priority": Which entity type should be prioritized in the results

Respond ONLY with valid JSON - no explanation or other text. The JSON should be structured like this example:

{
  "intent": {
    "entityTypes": ["RESOURCES", "PROJECTS"],
    "filters": {
      "skills": ["React", "Node.js"],
      "status": "available",
      "timeframe": {
        "start": "2023-06-01",
        "end": "2023-08-31"
      }
    },
    "sortBy": "relevance",
    "priority": "RESOURCES"
  },
  "interpretedQuery": "available resources with React and Node.js skills between June and August 2023"
}`;

    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: "You are a search query interpreter for a resource management system that converts natural language queries into structured search parameters."
    });
    
    // Record successful API response
    telemetry.recordSuccess(response);
    
    const responseText = response.content[0].text;
    
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        const interpretation = JSON.parse(jsonMatch[1]);
        return interpretation;
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse the AI interpretation');
    }
  } catch (error) {
    console.error('Error interpreting search query with AI:', error);
    telemetry.recordError(error);
    throw error;
  }
};

/**
 * Search an entity type based on interpreted query and filters
 * @param {string} entityType - The type of entity to search
 * @param {string} query - The interpreted search query
 * @param {Object} filters - Structured filters from AI interpretation
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} - Search results
 */
const searchEntity = async (entityType, query, filters, limit = 10) => {
  try {
    const entityConfig = SEARCH_TYPES[entityType];
    if (!entityConfig) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    // Start building the query
    let selectFields = [...entityConfig.fields.map(f => `${entityConfig.table}.${f}`)];
    let joins = [];
    let whereConditions = [];
    let params = [];
    
    // Add any join fields to the select
    entityConfig.joins.forEach(join => {
      if (join.fields) {
        selectFields = [...selectFields, ...join.fields];
      }
    });
    
    // Build the base query with joins
    let sql = `SELECT ${entityConfig.table}.id, ${selectFields.join(', ')} FROM ${entityConfig.table}`;
    
    // Add joins
    entityConfig.joins.forEach(join => {
      const joinType = join.type || 'JOIN';
      sql += ` ${joinType} ${join.table} ${join.alias} ON ${join.on}`;
    });
    
    // Add basic search condition using keywords from the query
    const keywords = query.split(' ').filter(word => word.length > 2);
    
    if (keywords.length > 0) {
      const searchConditions = [];
      let keywordIndex = 0;
      
      // Search in all searchable fields
      for (const field of entityConfig.fields) {
        keywords.forEach(keyword => {
          // Use named parameters for SQL Server
          const paramName = `keyword${keywordIndex}`;
          searchConditions.push(`${entityConfig.table}.${field} LIKE @${paramName}`);
          // Ensure we have the sql type for parameters
          params.push({ 
            name: paramName, 
            value: `%${keyword}%`, 
            type: sql?.NVarChar || SQL_TYPES.NVarChar
          });
          keywordIndex++;
        });
      }
      
      if (searchConditions.length > 0) {
        whereConditions.push(`(${searchConditions.join(' OR ')})`);
      }
    }
    
    // Apply filters from AI interpretation
    if (filters) {
      // Date range filters
      if (filters.timeframe) {
        if (entityType === 'RESOURCES') {
          // For resources, check their availability using allocations
          sql += ` LEFT JOIN allocations a ON ${entityConfig.table}.id = a.resource_id`;
          if (filters.timeframe.start) {
            whereConditions.push(`(a.end_date IS NULL OR a.end_date >= @timeframeStart)`);
            params.push({ 
              name: 'timeframeStart', 
              value: filters.timeframe.start, 
              type: sql?.Date || SQL_TYPES.Date 
            });
          }
          if (filters.timeframe.end) {
            whereConditions.push(`(a.start_date IS NULL OR a.start_date <= @timeframeEnd)`);
            params.push({ 
              name: 'timeframeEnd', 
              value: filters.timeframe.end, 
              type: sql?.Date || SQL_TYPES.Date 
            });
          }
        } else if (entityType === 'PROJECTS' || entityType === 'ALLOCATIONS') {
          // Direct date filters for projects and allocations
          if (filters.timeframe.start) {
            whereConditions.push(`${entityConfig.table}.start_date >= @projectStartDate`);
            params.push({ 
              name: 'projectStartDate', 
              value: filters.timeframe.start, 
              type: sql?.Date || SQL_TYPES.Date 
            });
          }
          if (filters.timeframe.end) {
            whereConditions.push(`${entityConfig.table}.end_date <= @projectEndDate`);
            params.push({ 
              name: 'projectEndDate', 
              value: filters.timeframe.end, 
              type: sql?.Date || SQL_TYPES.Date 
            });
          }
        }
      }
      
      // Status filters
      if (filters.status) {
        if (entityType === 'RESOURCES') {
          if (filters.status.toLowerCase() === 'available') {
            // For available resources, find those without full allocation
            sql += ` LEFT JOIN (
              SELECT resource_id, SUM(percentage) as total_allocation 
              FROM allocations 
              WHERE end_date >= GETDATE() OR end_date IS NULL 
              GROUP BY resource_id
            ) current_alloc ON ${entityConfig.table}.id = current_alloc.resource_id`;
            whereConditions.push(`(current_alloc.total_allocation IS NULL OR current_alloc.total_allocation < 100)`);
          } else if (filters.status.toLowerCase() === 'unavailable') {
            // For unavailable resources, find those with full allocation
            sql += ` JOIN (
              SELECT resource_id, SUM(percentage) as total_allocation 
              FROM allocations 
              WHERE end_date >= GETDATE() OR end_date IS NULL 
              GROUP BY resource_id
            ) current_alloc ON ${entityConfig.table}.id = current_alloc.resource_id`;
            whereConditions.push(`current_alloc.total_allocation >= 100`);
          } else {
            // Other resource status filters
            whereConditions.push(`${entityConfig.table}.status = @resourceStatus`);
            params.push({ 
              name: 'resourceStatus', 
              value: filters.status, 
              type: sql?.NVarChar || SQL_TYPES.NVarChar 
            });
          }
        } else if (entityType === 'PROJECTS') {
          // Project status filter
          whereConditions.push(`${entityConfig.table}.status = @projectStatus`);
          params.push({ 
            name: 'projectStatus', 
            value: filters.status, 
            type: sql?.NVarChar || SQL_TYPES.NVarChar 
          });
        }
      }
      
      // Skills filters
      if (filters.skills && filters.skills.length > 0) {
        if (entityType === 'RESOURCES') {
          // For resources with specific skills
          // Create a dynamic SQL IN clause with named parameters for SQL Server
          const skillParams = filters.skills.map((_, index) => `@skill${index}`).join(', ');
          whereConditions.push(`${entityConfig.table}.id IN (
            SELECT DISTINCT rs.resource_id FROM resource_skills rs
            JOIN skills s ON rs.skill_id = s.id
            WHERE s.name IN (${skillParams})
          )`);
          // Add each skill as a named parameter with SQL_TYPES fallback
          filters.skills.forEach((skill, index) => {
            params.push({ name: `skill${index}`, value: skill, type: sql?.NVarChar || SQL_TYPES.NVarChar });
          });
        } else if (entityType === 'PROJECTS') {
          // For projects requiring specific skills
          const projectSkillParams = filters.skills.map((_, index) => `@projectSkill${index}`).join(', ');
          whereConditions.push(`${entityConfig.table}.id IN (
            SELECT DISTINCT ps.project_id FROM project_skills ps
            JOIN skills s ON ps.skill_id = s.id
            WHERE s.name IN (${projectSkillParams})
          )`);
          // Add each skill as a named parameter with SQL_TYPES fallback
          filters.skills.forEach((skill, index) => {
            params.push({ name: `projectSkill${index}`, value: skill, type: sql?.NVarChar || SQL_TYPES.NVarChar });
          });
        }
      }
      
      // Location filter for resources
      if (filters.location && entityType === 'RESOURCES') {
        whereConditions.push(`${entityConfig.table}.location LIKE @location`);
        params.push({ 
          name: 'location', 
          value: `%${filters.location}%`, 
          type: sql?.NVarChar || SQL_TYPES.NVarChar 
        });
      }
      
      // Client filter for projects
      if (filters.client && entityType === 'PROJECTS') {
        whereConditions.push(`cl.name LIKE @client`);
        params.push({ 
          name: 'client', 
          value: `%${filters.client}%`, 
          type: sql?.NVarChar || SQL_TYPES.NVarChar 
        });
      }
    }
    
    // Combine all conditions
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add group by if needed
    if (entityConfig.groupBy) {
      sql += ` GROUP BY ${entityConfig.groupBy}`;
    }
    
    // Add a simpler TOP clause for SQL Server instead of more complex pagination
    // Replace the initial SELECT with a TOP clause
    sql = sql.replace(/^SELECT/, `SELECT TOP (@limit)`);
    
    // Add limit parameter to our parameters list
    params.push({ 
      name: 'limit', 
      value: limit, 
      type: sql?.Int || SQL_TYPES.Int 
    });
    
    try {
      // Check if poolPromise is valid
      if (!poolPromise) {
        console.error('Database poolPromise is not available');
        throw new Error('Database connection is not configured');
      }
      
      // Get SQL Server connection pool
      let pool = null;
      try {
        pool = await poolPromise;
      } catch (poolError) {
        console.error('Error getting database connection pool:', poolError);
        throw new Error('Failed to connect to database: ' + poolError.message);
      }
      
      if (!pool) {
        throw new Error('Database connection pool not available');
      }
      
      const request = pool.request();
      
      // Add parameters to the request with additional defensive coding
      params.forEach((param) => {
        try {
          // Check if param is an object with name, value properties
          if (param && typeof param === 'object' && param.name && param.value !== undefined) {
            // Ensure parameter name is valid (no spaces, special chars)
            const safeParamName = param.name.replace(/[^a-zA-Z0-9_]/g, '_');
            if (safeParamName !== param.name) {
              console.warn(`Parameter name '${param.name}' contains invalid characters, using '${safeParamName}' instead`);
            }
            
            // Get the actual SQL type object reference, not just the string name
            let paramTypeObj;
            
            // Create a direct mapping to the actual SQL type objects for use with SQL Server
            const sqlTypeMapping = {
              'INT': sql?.Int,
              'BIGINT': sql?.BigInt, 
              'FLOAT': sql?.Float,
              'DECIMAL': sql?.Decimal,
              'MONEY': sql?.Money,
              'BIT': sql?.Bit,
              'NVARCHAR': sql?.NVarChar,
              'VARCHAR': sql?.VarChar,
              'NCHAR': sql?.NChar,
              'CHAR': sql?.Char,
              'TEXT': sql?.Text,
              'NTEXT': sql?.NText,
              'DATE': sql?.Date,
              'TIME': sql?.Time,
              'DATETIME': sql?.DateTime,
              'DATETIME2': sql?.DateTime2
            };
            
            // If param.type is a string (from our SQL_TYPES fallback), map it to the actual SQL type object
            if (typeof param.type === 'string') {
              paramTypeObj = sqlTypeMapping[param.type] || sql?.NVarChar;
              console.log(`Mapped string type ${param.type} to SQL type object`);
            } else {
              // If it's already an object, use it directly
              paramTypeObj = param.type || sql?.NVarChar;
            }
            
            // If we still don't have a valid SQL type object, determine one based on the value
            if (!paramTypeObj) {
              if (typeof param.value === 'number') {
                if (Number.isInteger(param.value)) {
                  paramTypeObj = sql?.Int;
                } else {
                  paramTypeObj = sql?.Float;
                }
              } else if (param.value instanceof Date) {
                paramTypeObj = sql?.DateTime; 
              } else {
                // Default to NVarChar for all other types
                paramTypeObj = sql?.NVarChar;
              }
              console.log(`Determined SQL type object based on value type for ${safeParamName}`);
            }
            
            // Special handling for null/undefined values
            if (param.value === null || param.value === undefined) {
              param.value = ''; // Use empty string instead for safer handling
            }
            
            // Ensure strings don't exceed maximum length
            if (typeof param.value === 'string' && param.value.length > 4000) {
              console.warn(`Truncating parameter value for '${safeParamName}' from ${param.value.length} to 4000 chars`);
              param.value = param.value.substring(0, 4000);
            }
            
            // CRITICAL FIX: If we don't have a valid SQL module, construct a basic parameter object
            // This happens when SQL Server is not properly initialized
            if (!sql) {
              console.warn('SQL module not available. Using basic parameter approach');
              // Add the parameter to the SQL query string directly (not ideal but a fallback)
              sql = sql.replace(new RegExp(`@${safeParamName}\\b`, 'g'), 
                typeof param.value === 'string' ? `N'${param.value.replace(/'/g, "''")}'` : param.value);
              return; // Return from the forEach callback to skip rest of processing for this parameter
            }
            
            // Add input parameter with defensive error handling
            try {
              console.log(`Adding parameter ${safeParamName} with type:`, paramTypeObj ? paramTypeObj.name || 'unknown' : 'fallback NVarChar');
              request.input(safeParamName, paramTypeObj || sql.NVarChar, param.value);
            } catch (inputError) {
              console.error(`Error adding parameter ${safeParamName}:`, inputError);
              
              // Last resort fallback - try with the most basic parameter approach
              try {
                console.log(`Trying fallback for parameter ${safeParamName}`);
                request.input(safeParamName, sql.NVarChar, String(param.value || ''));
              } catch (fallbackError) {
                console.error(`Fallback failed for parameter ${safeParamName}:`, fallbackError);
                // Skip this parameter but continue processing others
              }
            }
          } else {
            // Handle old-style parameters by converting them to named parameters
            const paramName = `param${Math.random().toString(36).substring(2, 10)}`;
            
            // Handle null/undefined values safely
            const paramValue = param !== null && param !== undefined ? param : '';
            
            // CRITICAL FIX: If we don't have a valid SQL module, construct a basic parameter
            if (!sql) {
              console.warn('SQL module not available. Using basic parameter approach for simple param');
              // Add the parameter to the SQL query string directly
              sql = sql.replace('?', typeof paramValue === 'string' ? 
                `N'${paramValue.replace(/'/g, "''")}'` : paramValue);
            } else {
              try {
                request.input(paramName, sql.NVarChar, paramValue);
                // Replace ? with @paramName in SQL
                sql = sql.replace('?', `@${paramName}`);
              } catch (simpleParamError) {
                console.error(`Error adding simple parameter:`, simpleParamError);
                // Add the parameter to the SQL query string directly as a fallback
                sql = sql.replace('?', typeof paramValue === 'string' ? 
                  `N'${paramValue.replace(/'/g, "''")}'` : paramValue);
              }
            }
          }
        } catch (paramError) {
          console.error(`Error handling parameter:`, param, paramError);
          // Instead of throwing, log the error and continue
          console.error(`Skipping parameter due to error: ${paramError.message}`);
        }
      });
      
      console.log('Executing SQL query:', sql);
      const result = await request.query(sql);
      return result.recordset;
    } catch (dbError) {
      console.error(`Database error in searchEntity for ${entityType}:`, dbError);
      console.error('SQL Query:', sql);
      console.error('Parameters:', JSON.stringify(params));
      throw dbError;
    }
  } catch (error) {
    console.error(`Error searching ${entityType}:`, error);
    throw error;
  }
};

/**
 * Fallback search method using simple keyword matching
 * @param {string} entityType - The type of entity to search
 * @param {string} query - The raw search query
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} - Search results
 */
// Simple hardcoded data fallback search when SQL Server is having issues
const searchEntityByKeywordsFallback = (entityType, query) => {
  console.log(`Using hardcoded fallback search for ${entityType} with query ${query}`);
  
  // Normalize query for simple matching
  const normalizedQuery = query.toLowerCase().trim();
  
  // Mock data for fallback search
  const fallbackData = {
    RESOURCES: [
      { id: 1, name: "Barney Rubble", email: "barney@example.com", title: "Senior Developer", bio: "Experienced developer", location: "Bedrock", role_name: "Developer" },
      { id: 2, name: "Fred Flintstone", email: "fred@example.com", title: "Project Manager", bio: "Yabba dabba doo!", location: "Bedrock", role_name: "Manager" },
      { id: 3, name: "Wilma Flintstone", email: "wilma@example.com", title: "UX Designer", bio: "Creative designer", location: "Bedrock", role_name: "Designer" }
    ],
    PROJECTS: [
      { id: 1, name: "Bedrock Website", description: "Building a new website for Bedrock", status: "Active", client_name: "Slate Rock & Gravel Co." },
      { id: 2, name: "Mobile App", description: "Building a mobile app for Barney's Bowling Alley", status: "Planning", client_name: "Barney's Bowling" },
      { id: 3, name: "Database Migration", description: "Migrating data to a new system", status: "Completed", client_name: "Slate Rock & Gravel Co." }
    ],
    SKILLS: [
      { id: 1, name: "JavaScript", description: "JavaScript programming language", category: "Programming" },
      { id: 2, name: "Java", description: "Java programming language", category: "Programming" },
      { id: 3, name: "React", description: "React frontend framework", category: "Programming" }
    ],
    ALLOCATIONS: [
      { id: 1, resource_name: "Barney Rubble", project_name: "Bedrock Website", start_date: "2023-01-01", end_date: "2023-06-30", percentage: 75 },
      { id: 2, resource_name: "Fred Flintstone", project_name: "Mobile App", start_date: "2023-02-15", end_date: "2023-12-31", percentage: 50 },
      { id: 3, resource_name: "Wilma Flintstone", project_name: "Database Migration", start_date: "2023-03-01", end_date: "2023-09-30", percentage: 100 }
    ]
  };
  
  // Return all items from the fallback data for the given entity type
  // In a real implementation, we'd filter by the query
  if (fallbackData[entityType]) {
    console.log(`Fallback data for ${entityType} has ${fallbackData[entityType].length} items`);
    console.log(`Search query is '${normalizedQuery}'`);
    
    // Do simple text search within mock data
    const results = fallbackData[entityType].filter(item => {
      // Log each item for debugging
      console.log(`Checking item:`, JSON.stringify(item));
      
      // Check if any property contains the search query
      const match = Object.entries(item).some(([key, value]) => {
        if (value === null || value === undefined) return false;
        const stringValue = String(value).toLowerCase();
        const isMatch = stringValue.includes(normalizedQuery);
        // Log matching attempts for debugging
        if (isMatch) {
          console.log(`MATCH FOUND: ${key}=${stringValue} contains '${normalizedQuery}'`);
        }
        return isMatch;
      });
      
      return match;
    });
    
    console.log(`Found ${results.length} matches for ${entityType}`);
    return results;
  }
  
  // Return empty array if entity type not found in fallback data
  return [];
};

const searchEntityByKeywords = async (entityType, query, limit = 10) => {
  try {
    const entityConfig = SEARCH_TYPES[entityType];
    if (!entityConfig) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    // Start building the query
    let selectFields = [...entityConfig.fields.map(f => `${entityConfig.table}.${f}`)];
    let joins = [];
    let whereConditions = [];
    let params = [];
    
    // Add any join fields to the select
    entityConfig.joins.forEach(join => {
      if (join.fields) {
        selectFields = [...selectFields, ...join.fields];
      }
    });
    
    // Build the base query with joins
    let sql = `SELECT ${entityConfig.table}.id, ${selectFields.join(', ')} FROM ${entityConfig.table}`;
    
    // Add joins
    entityConfig.joins.forEach(join => {
      const joinType = join.type || 'JOIN';
      sql += ` ${joinType} ${join.table} ${join.alias} ON ${join.on}`;
    });
    
    // Add search conditions
    const keywords = query.split(' ').filter(word => word.length > 2);
    
    if (keywords.length > 0) {
      const searchConditions = [];
      let keywordIndex = 0;
      
      // Search in all searchable fields
      for (const field of entityConfig.fields) {
        keywords.forEach(keyword => {
          // Use named parameters for SQL Server
          const paramName = `keyword${keywordIndex}`;
          searchConditions.push(`${entityConfig.table}.${field} LIKE @${paramName}`);
          // Ensure we have the sql type for parameters
          params.push({ 
            name: paramName, 
            value: `%${keyword}%`, 
            type: sql?.NVarChar || SQL_TYPES.NVarChar
          });
          keywordIndex++;
        });
      }
      
      // Search in join fields if applicable
      entityConfig.joins.forEach(join => {
        if (join.fields) {
          join.fields.forEach(field => {
            // Extract just the field name without alias
            const fieldName = field.includes(' AS ') ? field.split(' AS ')[0] : field;
            
            keywords.forEach(keyword => {
              const paramName = `keyword${keywordIndex}`;
              searchConditions.push(`${fieldName} LIKE @${paramName}`);
              // Ensure we have the sql type for parameters
              params.push({ 
                name: paramName, 
                value: `%${keyword}%`, 
                type: sql?.NVarChar || SQL_TYPES.NVarChar 
              });
              keywordIndex++;
            });
          });
        }
      });
      
      if (searchConditions.length > 0) {
        whereConditions.push(`(${searchConditions.join(' OR ')})`);
      }
    }
    
    // Combine all conditions
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add group by if needed
    if (entityConfig.groupBy) {
      sql += ` GROUP BY ${entityConfig.groupBy}`;
    }
    
    // Add a simpler TOP clause for SQL Server instead of more complex pagination
    // Replace the initial SELECT with a TOP clause
    sql = sql.replace(/^SELECT/, `SELECT TOP (@limit)`);
    
    // Add limit parameter to our parameters list
    params.push({ 
      name: 'limit', 
      value: limit, 
      type: sql?.Int || SQL_TYPES.Int 
    });
    
    try {
      // Check if poolPromise is valid
      if (!poolPromise) {
        console.error('Database poolPromise is not available');
        throw new Error('Database connection is not configured');
      }
      
      // Get SQL Server connection pool
      let pool = null;
      try {
        pool = await poolPromise;
      } catch (poolError) {
        console.error('Error getting database connection pool:', poolError);
        throw new Error('Failed to connect to database: ' + poolError.message);
      }
      
      if (!pool) {
        throw new Error('Database connection pool not available');
      }
      
      const request = pool.request();
      
      // Add parameters to the request with additional defensive coding
      params.forEach((param) => {
        try {
          // Check if param is an object with name, value properties
          if (param && typeof param === 'object' && param.name && param.value !== undefined) {
            // Ensure parameter name is valid (no spaces, special chars)
            const safeParamName = param.name.replace(/[^a-zA-Z0-9_]/g, '_');
            if (safeParamName !== param.name) {
              console.warn(`Parameter name '${param.name}' contains invalid characters, using '${safeParamName}' instead`);
            }
            
            // Get the actual SQL type object reference, not just the string name
            let paramTypeObj;
            
            // Create a direct mapping to the actual SQL type objects for use with SQL Server
            const sqlTypeMapping = {
              'INT': sql?.Int,
              'BIGINT': sql?.BigInt, 
              'FLOAT': sql?.Float,
              'DECIMAL': sql?.Decimal,
              'MONEY': sql?.Money,
              'BIT': sql?.Bit,
              'NVARCHAR': sql?.NVarChar,
              'VARCHAR': sql?.VarChar,
              'NCHAR': sql?.NChar,
              'CHAR': sql?.Char,
              'TEXT': sql?.Text,
              'NTEXT': sql?.NText,
              'DATE': sql?.Date,
              'TIME': sql?.Time,
              'DATETIME': sql?.DateTime,
              'DATETIME2': sql?.DateTime2
            };
            
            // If param.type is a string (from our SQL_TYPES fallback), map it to the actual SQL type object
            if (typeof param.type === 'string') {
              paramTypeObj = sqlTypeMapping[param.type] || sql?.NVarChar;
              console.log(`Mapped string type ${param.type} to SQL type object`);
            } else {
              // If it's already an object, use it directly
              paramTypeObj = param.type || sql?.NVarChar;
            }
            
            // If we still don't have a valid SQL type object, determine one based on the value
            if (!paramTypeObj) {
              if (typeof param.value === 'number') {
                if (Number.isInteger(param.value)) {
                  paramTypeObj = sql?.Int;
                } else {
                  paramTypeObj = sql?.Float;
                }
              } else if (param.value instanceof Date) {
                paramTypeObj = sql?.DateTime; 
              } else {
                // Default to NVarChar for all other types
                paramTypeObj = sql?.NVarChar;
              }
              console.log(`Determined SQL type object based on value type for ${safeParamName}`);
            }
            
            // Special handling for null/undefined values
            if (param.value === null || param.value === undefined) {
              param.value = ''; // Use empty string instead for safer handling
            }
            
            // Ensure strings don't exceed maximum length
            if (typeof param.value === 'string' && param.value.length > 4000) {
              console.warn(`Truncating parameter value for '${safeParamName}' from ${param.value.length} to 4000 chars`);
              param.value = param.value.substring(0, 4000);
            }
            
            // CRITICAL FIX: If we don't have a valid SQL module, construct a basic parameter object
            // This happens when SQL Server is not properly initialized
            if (!sql) {
              console.warn('SQL module not available. Using basic parameter approach');
              // Add the parameter to the SQL query string directly (not ideal but a fallback)
              sql = sql.replace(new RegExp(`@${safeParamName}\\b`, 'g'), 
                typeof param.value === 'string' ? `N'${param.value.replace(/'/g, "''")}'` : param.value);
              return; // Return from the forEach callback to skip rest of processing for this parameter
            }
            
            // Add input parameter with defensive error handling
            try {
              console.log(`Adding parameter ${safeParamName} with type:`, paramTypeObj ? paramTypeObj.name || 'unknown' : 'fallback NVarChar');
              request.input(safeParamName, paramTypeObj || sql.NVarChar, param.value);
            } catch (inputError) {
              console.error(`Error adding parameter ${safeParamName}:`, inputError);
              
              // Last resort fallback - try with the most basic parameter approach
              try {
                console.log(`Trying fallback for parameter ${safeParamName}`);
                request.input(safeParamName, sql.NVarChar, String(param.value || ''));
              } catch (fallbackError) {
                console.error(`Fallback failed for parameter ${safeParamName}:`, fallbackError);
                // Skip this parameter but continue processing others
              }
            }
          } else {
            // Handle old-style parameters by converting them to named parameters
            const paramName = `param${Math.random().toString(36).substring(2, 10)}`;
            
            // Handle null/undefined values safely
            const paramValue = param !== null && param !== undefined ? param : '';
            
            // CRITICAL FIX: If we don't have a valid SQL module, construct a basic parameter
            if (!sql) {
              console.warn('SQL module not available. Using basic parameter approach for simple param');
              // Add the parameter to the SQL query string directly
              sql = sql.replace('?', typeof paramValue === 'string' ? 
                `N'${paramValue.replace(/'/g, "''")}'` : paramValue);
            } else {
              try {
                request.input(paramName, sql.NVarChar, paramValue);
                // Replace ? with @paramName in SQL
                sql = sql.replace('?', `@${paramName}`);
              } catch (simpleParamError) {
                console.error(`Error adding simple parameter:`, simpleParamError);
                // Add the parameter to the SQL query string directly as a fallback
                sql = sql.replace('?', typeof paramValue === 'string' ? 
                  `N'${paramValue.replace(/'/g, "''")}'` : paramValue);
              }
            }
          }
        } catch (paramError) {
          console.error(`Error handling parameter:`, param, paramError);
          // Instead of throwing, log the error and continue
          console.error(`Skipping parameter due to error: ${paramError.message}`);
        }
      });
      
      console.log('Executing SQL query:', sql);
      const result = await request.query(sql);
      return result.recordset;
    } catch (dbError) {
      console.error(`Database error in searchEntity for ${entityType}:`, dbError);
      console.error('SQL Query:', sql);
      console.error('Parameters:', JSON.stringify(params));
      throw dbError;
    }
  } catch (error) {
    console.error(`Error searching ${entityType} by keywords:`, error);
    throw error;
  }
};

/**
 * Get search suggestions based on partial query
 * @param {string} partialQuery - The partial search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Search suggestions
 */
const getSuggestions = async (partialQuery, options = {}) => {
  try {
    if (!partialQuery || partialQuery.trim() === '') {
      return [];
    }
    
    // Get suggestions from database - simple version
    const limit = options.limit || 5;
    const suggestions = [];
    
    // Get resource name suggestions
    const pool = await poolPromise;
    
    // Get resource name suggestions
    const resourceQuery = `
      SELECT TOP (@limit) name, 'resource' AS type FROM resources
      WHERE name LIKE @searchTerm
    `;
    const resourceRequest = pool.request();
    resourceRequest.input('searchTerm', sql.NVarChar, `%${partialQuery}%`);
    resourceRequest.input('limit', sql.Int, limit);
    const resourceResult = await resourceRequest.query(resourceQuery);
    suggestions.push(...resourceResult.recordset.map(r => ({ 
      text: r.name, 
      type: r.type,
      action: `Search for resource: ${r.name}`
    })));
    
    // Get project name suggestions
    const projectQuery = `
      SELECT TOP (@limit) name, 'project' AS type FROM projects
      WHERE name LIKE @searchTerm
    `;
    const projectRequest = pool.request();
    projectRequest.input('searchTerm', sql.NVarChar, `%${partialQuery}%`);
    projectRequest.input('limit', sql.Int, limit);
    const projectResult = await projectRequest.query(projectQuery);
    suggestions.push(...projectResult.recordset.map(p => ({ 
      text: p.name, 
      type: p.type,
      action: `Search for project: ${p.name}`
    })));
    
    // Get skill name suggestions
    const skillQuery = `
      SELECT TOP (@limit) name, 'skill' AS type FROM skills
      WHERE name LIKE @searchTerm
    `;
    const skillRequest = pool.request();
    skillRequest.input('searchTerm', sql.NVarChar, `%${partialQuery}%`);
    skillRequest.input('limit', sql.Int, limit);
    const skillResult = await skillRequest.query(skillQuery);
    suggestions.push(...skillResult.recordset.map(s => ({ 
      text: s.name, 
      type: s.type,
      action: `Search for resources with ${s.name} skill`
    })));
    
    // Add common search patterns as suggestions
    const commonSearches = [
      { 
        pattern: 'available', 
        suggestion: 'available resources', 
        type: 'common_search',
        action: 'Find available resources'
      },
      { 
        pattern: 'bench', 
        suggestion: 'resources on bench', 
        type: 'common_search',
        action: 'Find resources on bench'
      },
      { 
        pattern: 'ending', 
        suggestion: 'projects ending soon', 
        type: 'common_search',
        action: 'Find projects ending soon'
      },
      { 
        pattern: 'skill', 
        suggestion: 'resources with [skill] skills', 
        type: 'common_search',
        action: 'Find resources by skill'
      }
    ];
    
    for (const search of commonSearches) {
      if (partialQuery.toLowerCase().includes(search.pattern)) {
        suggestions.push({
          text: search.suggestion,
          type: search.type,
          action: search.action
        });
      }
    }
    
    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
};

/**
 * Get recent and popular searches for the user
 * @param {string} userId - The user ID
 * @param {Object} options - Options for getting recent searches
 * @returns {Promise<Object>} - Recent and popular searches
 */
const getRecentSearches = async (userId, options = {}) => {
  try {
    const limit = options.limit || 5;
    
    // This would typically come from a search_history table
    // For now, return a simple mock response
    return {
      recent: [
        { query: 'available JavaScript developers', timestamp: '2023-05-15T10:30:00Z' },
        { query: 'projects ending in June', timestamp: '2023-05-10T14:22:00Z' },
        { query: 'resources with Python skills', timestamp: '2023-05-05T09:15:00Z' }
      ],
      popular: [
        { query: 'available resources', count: 42 },
        { query: 'projects at risk', count: 28 },
        { query: 'bench resources', count: 23 }
      ]
    };
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return { recent: [], popular: [] };
  }
};

module.exports = {
  search,
  interpretSearchQuery,
  getSuggestions,
  getRecentSearches
};
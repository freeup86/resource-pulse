// aiRecommendationService.js
const { poolPromise } = require('../db/config');
const Anthropic = require('@anthropic-ai/sdk');
const aiTelemetry = require('./aiTelemetry');
require('dotenv').config();

// Get API key from environment variables
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Check if API key is configured
if (!CLAUDE_API_KEY) {
  console.warn('Claude API key not configured. AI recommendations will use fallback data.');
} else {
  console.log('Claude API key configured. Will attempt to use AI recommendations with rate limiting.');
}

// Initialize Claude client
const claude = CLAUDE_API_KEY ? new Anthropic({
  apiKey: CLAUDE_API_KEY,
}) : null;

/**
 * Rate limiting configuration for Claude API requests
 * These values should be adjusted based on your Anthropic subscription tier and rate limits
 * 
 * Claude has different rate limits than OpenAI, but we'll use conservative defaults
 * Reference: https://docs.anthropic.com/claude/reference/rate-limits
 */
const RATE_LIMIT = {
  requestsPerMinute: 10,  // Conservative default
  tokensPerMinute: 40000, // Approximate token limit with safety margin
  maxConcurrent: 2,       // Maximum concurrent requests
  retryDelay: 3000,       // Base delay for retries in ms
  maxRetries: 4,          // Maximum number of retries
  retryMultiplier: 1.5,   // Use 1.5x multiplier for gradual backoff
  initialDelay: 500       // Initial delay between requests
};

/**
 * API request queue implementation for rate limiting
 * This queue ensures:
 * 1. No more than maxConcurrent requests run at once
 * 2. Requests are spaced out to stay under requestsPerMinute
 * 3. Token usage is tracked to avoid token rate limits
 * 4. Failed requests (429 errors) are retried with exponential backoff
 * 5. Requests use priority and jittering to improve throughput
 */
class RequestQueue {
  constructor() {
    this.queue = [];
    this.running = 0;
    this.lastRequestTime = 0;
    
    // Token bucket implementation
    this.tokenBucket = {
      tokens: RATE_LIMIT.tokensPerMinute,       // Start with a full bucket
      lastRefill: Date.now(),                   // Last time we refilled tokens
      maxTokens: RATE_LIMIT.tokensPerMinute,    // Maximum token capacity
      refillRate: RATE_LIMIT.tokensPerMinute    // Tokens refilled per minute
    };
    
    // Track consecutive failures for circuit breaking
    this.consecutiveFailures = 0;
    this.circuitOpen = false;
    this.circuitResetTime = null;
    
    // Start periodic queue processing
    setInterval(() => this.processQueue(), RATE_LIMIT.initialDelay);
    
    // Log queue status periodically
    setInterval(() => {
      if (this.queue.length > 0 || this.running > 0) {
        console.log(`Queue status: ${this.queue.length} waiting, ${this.running} running, ${Math.round(this.tokenBucket.tokens)} tokens available`);
      }
    }, 10000); // Every 10 seconds
  }

  // Refill token bucket based on elapsed time
  refillTokenBucket() {
    const now = Date.now();
    const elapsedMs = now - this.tokenBucket.lastRefill;
    
    if (elapsedMs > 0) {
      // Calculate tokens to add based on elapsed time
      const tokensToAdd = (elapsedMs / 60000) * this.tokenBucket.refillRate;
      
      // Add tokens up to max capacity
      this.tokenBucket.tokens = Math.min(
        this.tokenBucket.maxTokens, 
        this.tokenBucket.tokens + tokensToAdd
      );
      
      // Update last refill time
      this.tokenBucket.lastRefill = now;
    }
  }
  
  // Estimate token usage for a request (very approximate)
  estimateTokenUsage(requestData) {
    // Define a simple token estimation function
    // For Claude, roughly 1 token = 4 characters for English text
    let totalChars = 0;
    
    // Count characters in the request
    if (requestData) {
      if (requestData.messages) {
        // OpenAI-style messages
        for (const message of requestData.messages) {
          totalChars += (message.content || '').length;
        }
      } else if (requestData.prompt) {
        // Claude-style prompt
        totalChars += requestData.prompt.length;
      } else if (requestData.system && requestData.messages) {
        // Claude 2 style with system and messages
        totalChars += requestData.system.length;
        for (const message of requestData.messages) {
          totalChars += (message.content || '').length;
        }
      }
    }
    
    // Estimate tokens as chars/4, with a buffer and minimum
    return Math.max(500, Math.ceil(totalChars / 4));
  }

  // Add a request to the queue with priority and token estimation
  async add(requestFn, options = {}) {
    // Check if circuit breaker is open
    if (this.circuitOpen) {
      const now = Date.now();
      if (now < this.circuitResetTime) {
        return Promise.reject(new Error('Circuit breaker open - too many consecutive failures'));
      } else {
        // Reset circuit breaker
        this.circuitOpen = false;
        this.consecutiveFailures = 0;
      }
    }
    
    return new Promise((resolve, reject) => {
      // Extract request data for token estimation if available
      const requestData = options.requestData || {};
      const estimatedTokens = this.estimateTokenUsage(requestData);
      
      // Add to queue with priority (lower is higher priority)
      this.queue.push({
        requestFn,
        resolve,
        reject,
        retries: 0,
        priority: options.priority || 10, // Default priority
        estimatedTokens,
        addedAt: Date.now()
      });
      
      // Sort queue by priority
      this.queue.sort((a, b) => a.priority - b.priority);
      
      // Try processing queue immediately
      this.processQueue();
    });
  }

  async processQueue() {
    // Skip processing if no requests or at concurrency limit
    if (this.queue.length === 0 || this.running >= RATE_LIMIT.maxConcurrent) {
      return;
    }
    
    // Check circuit breaker
    if (this.circuitOpen) {
      return;
    }
    
    // Refill token bucket based on elapsed time
    this.refillTokenBucket();
    
    // Enforce minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = (60 * 1000) / RATE_LIMIT.requestsPerMinute;
    
    if (timeSinceLastRequest < minDelay) {
      // Apply jitter to reduce thundering herd problem
      const jitter = Math.random() * 200; // 0-200ms jitter
      setTimeout(() => this.processQueue(), minDelay - timeSinceLastRequest + jitter);
      return;
    }
    
    // Find a request that can be processed with available tokens
    let requestIndex = -1;
    let requestToProcess = null;
    
    for (let i = 0; i < this.queue.length; i++) {
      const request = this.queue[i];
      if (request.estimatedTokens <= this.tokenBucket.tokens) {
        requestToProcess = request;
        requestIndex = i;
        break;
      }
    }
    
    // If no requests can be processed with available tokens, wait for refill
    if (requestIndex === -1) {
      // Calculate time until enough tokens are available for the smallest request
      const smallestRequest = this.queue.reduce(
        (min, req) => req.estimatedTokens < min.estimatedTokens ? req : min, 
        { estimatedTokens: Infinity }
      );
      
      const tokensNeeded = smallestRequest.estimatedTokens;
      const tokensPerMs = this.tokenBucket.refillRate / 60000;
      const msToWait = (tokensNeeded - this.tokenBucket.tokens) / tokensPerMs;
      
      // Wait with a small buffer, then try again
      setTimeout(() => this.processQueue(), Math.max(1000, Math.ceil(msToWait) + 100));
      return;
    }
    
    // Remove the request from the queue
    this.queue.splice(requestIndex, 1);
    this.running++;

    // Track this request
    const requestId = Math.random().toString(36).substring(2, 10);
    const waitTime = now - requestToProcess.addedAt;
    console.log(`Processing request ${requestId} (waited ${waitTime}ms, tokens: ${requestToProcess.estimatedTokens}, queue: ${this.queue.length})`);

    try {
      // Record request time and deduct tokens
      this.lastRequestTime = Date.now();
      this.tokenBucket.tokens -= requestToProcess.estimatedTokens;
      
      // Execute the request
      const result = await requestToProcess.requestFn();
      
      // Reset consecutive failures on success
      this.consecutiveFailures = 0;
      
      // Record successful request in telemetry
      aiTelemetry.recordSuccess(result);
      
      // Resolve with result
      requestToProcess.resolve(result);
      console.log(`Request ${requestId} completed successfully`);
    } catch (error) {
      console.error(`Request ${requestId} failed:`, error.message);
      
      // Record error in telemetry
      aiTelemetry.recordError(error);
      
      // Handle rate limit errors with exponential backoff
      if ((error.status === 429 || (error.response && error.response.status === 429)) && 
          requestToProcess.retries < RATE_LIMIT.maxRetries) {
        // Get retry delay from header if available, otherwise use exponential backoff
        let retryDelay = RATE_LIMIT.retryDelay;
        
        // Use retry-after header if available
        if (error.response && error.response.headers && error.response.headers['retry-after']) {
          const retryAfterSec = parseInt(error.response.headers['retry-after'], 10);
          if (!isNaN(retryAfterSec)) {
            retryDelay = retryAfterSec * 1000; // Convert to milliseconds
          }
        } else {
          // Use exponential backoff with multiplier
          retryDelay = RATE_LIMIT.retryDelay * Math.pow(RATE_LIMIT.retryMultiplier, requestToProcess.retries);
          // Add jitter to avoid thundering herd problem (±20%)
          const jitter = 0.8 + (Math.random() * 0.4);
          retryDelay = Math.floor(retryDelay * jitter);
        }
        
        console.log(`Rate limited. Retrying in ${retryDelay}ms (retry ${requestToProcess.retries + 1}/${RATE_LIMIT.maxRetries})`);
        
        requestToProcess.retries++;
        // Put back in queue with higher priority for retries
        requestToProcess.priority -= 2; // Increase priority for retries
        
        // Re-add with delay
        setTimeout(() => {
          this.queue.push(requestToProcess);
          this.queue.sort((a, b) => a.priority - b.priority);
          this.processQueue();
        }, retryDelay);
      } else {
        // Handle other errors or max retries exceeded
        this.consecutiveFailures++;
        
        // Implement circuit breaker pattern
        if (this.consecutiveFailures >= 5) {
          console.error(`Circuit breaker opened after ${this.consecutiveFailures} consecutive failures`);
          this.circuitOpen = true;
          this.circuitResetTime = Date.now() + (30 * 1000); // 30 seconds circuit breaker
          
          // Clear queue to prevent processing during circuit open
          this.queue = [];
        }
        
        requestToProcess.reject(error);
      }
    } finally {
      this.running--;
      
      // Add some delay between finishing one request and starting another
      setTimeout(() => this.processQueue(), RATE_LIMIT.initialDelay);
    }
  }
}

// Create a global queue instance
const apiRequestQueue = new RequestQueue();

/**
 * Generate skill development recommendations using AI
 * @param {number} projectId - The ID of the project to generate recommendations for
 * @param {Object} options - Optional parameters for customizing recommendations
 * @param {boolean} options.forceRefresh - Force new AI generation even if recommendations exist
 * @param {Object} options.userContext - User context for personalized recommendations
 * @returns {Promise<Array>} - Array of recommendation objects
 */
async function generateSkillRecommendations(projectId, options = {}) {
  try {
    const pool = await poolPromise;
    
    // Get project details, including required skills
    const projectResult = await pool.request()
      .input('projectId', projectId)
      .query(`
        SELECT p.Name, p.Description
        FROM Projects p
        WHERE p.ProjectID = @projectId
      `);
    
    if (projectResult.recordset.length === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const project = projectResult.recordset[0];
    
    // Get required skills for the project
    const skillsResult = await pool.request()
      .input('projectId', projectId)
      .query(`
        SELECT s.SkillID, s.Name, s.Category, s.Description
        FROM Skills s
        INNER JOIN ProjectSkills ps ON s.SkillID = ps.SkillID
        WHERE ps.ProjectID = @projectId
      `);
    
    const skills = skillsResult.recordset;
    
    if (skills.length === 0) {
      return []; // No skills to generate recommendations for
    }
    
    // Check if there are existing recommendations for these skills
    const existingRecommendationsResult = await pool.request()
      .input('projectId', projectId)
      .query(`
        SELECT sr.SkillID, sr.Title, sr.Description, sr.ResourceURL, sr.EstimatedTimeHours, sr.Cost
        FROM SkillRecommendations sr
        WHERE sr.ProjectID = @projectId
      `);
    
    const existingRecommendations = existingRecommendationsResult.recordset;
    
    // Map existing recommendations by skill ID for quick lookup
    const existingRecommendationsBySkillId = existingRecommendations.reduce((acc, rec) => {
      acc[rec.SkillID] = rec;
      return acc;
    }, {});
    
    // Get options for controlling generation
    const { forceRefresh = false, userContext = {} } = options;
    
    console.log(`Generating recommendations with options:`, {
      forceRefresh,
      hasUserContext: Object.keys(userContext).length > 0,
      skillCount: skills.length,
      existingRecommendationCount: existingRecommendations.length
    });
    
    // Break down into two groups - existing recommendations to reuse and new ones to generate
    const existingRecsToReuse = [];
    const skillsNeedingNewRecs = [];
    
    // Classify skills into those needing new recommendations and those with existing ones
    for (const skill of skills) {
      if (!forceRefresh && existingRecommendationsBySkillId[skill.SkillID]) {
        // Can reuse existing recommendation
        const existingRec = existingRecommendationsBySkillId[skill.SkillID];
        existingRecsToReuse.push({
          title: existingRec.Title,
          description: existingRec.Description,
          resourceUrl: existingRec.ResourceURL,
          estimatedTimeHours: existingRec.EstimatedTimeHours,
          cost: existingRec.Cost,
          skillId: skill.SkillID,
          skillName: skill.Name,
          category: skill.Category,
          aiGenerated: true
        });
      } else {
        // Need to generate a new recommendation
        skillsNeedingNewRecs.push(skill);
      }
    }
    
    console.log(`Recommendation generation status:`, {
      reusing: existingRecsToReuse.length,
      generating: skillsNeedingNewRecs.length
    });
    
    // Process new recommendations in controlled batches
    const newRecommendationsPromises = [];
    
    for (const skill of skillsNeedingNewRecs) {
      // Create promise for each skill's recommendation
      const recommendationPromise = generateAIRecommendation(skill, project, userContext)
        .then(recommendation => ({
          ...recommendation,
          skillId: skill.SkillID,
          skillName: skill.Name,
          category: skill.Category,
          aiGenerated: true
        }))
        .catch(error => {
          console.error(`Failed to generate recommendation for skill ${skill.Name}:`, error.message);
          // Return fallback on error
          const fallback = generateFallbackRecommendation(skill, project, userContext);
          return {
            ...fallback,
            skillId: skill.SkillID,
            skillName: skill.Name,
            category: skill.Category,
            aiGenerated: false
          };
        });
        
      newRecommendationsPromises.push(recommendationPromise);
    }
    
    // Wait for all recommendations to be generated
    const newRecommendations = await Promise.all(newRecommendationsPromises);
    
    // Combine existing and new recommendations
    const recommendations = [...existingRecsToReuse, ...newRecommendations];
    
    return recommendations;
  } catch (error) {
    console.error('Error generating skill recommendations:', error);
    throw error;
  }
}

/**
 * Generate a single skill recommendation using Claude AI
 * @param {Object} skill - The skill object
 * @param {Object} project - The project object
 * @param {Object} userContext - Optional user context for personalization
 * @returns {Promise<Object>} - A recommendation object
 */
async function generateAIRecommendation(skill, project, userContext = {}) {
  try {
    // Only call the API if we have a key configured
    if (CLAUDE_API_KEY && claude) {
      try {
        console.log(`Generating Claude AI recommendation for skill: ${skill.Name} in project: ${project.Name}`);
        
        // Format the content with human/assistant format for Claude
        const prompt = `
<instructions>
You are a professional learning & development specialist with expertise in technical skills development.
Your task is to create personalized learning recommendations for professionals based on their required skills, project context, and personal preferences.

For each skill, provide:
1. A compelling title for the learning path
2. A detailed description of what will be learned and how it applies to the project
3. A relevant resource URL (can be a course, tutorial, book, or other learning resource)
4. An estimate of time required to develop this skill (in hours)
5. An approximate cost in USD (free resources should be marked as 0)

Format the response as a valid JSON object with these fields:
{
  "title": "string",
  "description": "string",
  "resourceUrl": "string",
  "estimatedTimeHours": number,
  "cost": number,
  "category": "string"
}

Return ONLY the JSON with no additional text, markdown, or explanation.
</instructions>

<skill_info>
Skill Name: ${skill.Name}
Skill Category: ${skill.Category || "Technical"}
Skill Description: ${skill.Description || `${skill.Name} skills for professional development`}
</skill_info>

<project_context>
Project Name: ${project.Name}
Project Description: ${project.Description || `A project requiring ${skill.Name} expertise`}
</project_context>
`;

        // Add personalization based on user context
        let personalizationContext = '';
        
        if (Object.keys(userContext).length > 0) {
          personalizationContext = `
<personalization>
${userContext.experienceLevel ? `Experience level: ${userContext.experienceLevel}` : ''}
${userContext.preferredLearningStyle ? `Learning style preference: ${userContext.preferredLearningStyle}` : ''}
${userContext.budget !== undefined ? `Budget constraint: $${userContext.budget}` : ''}
${userContext.timeAvailable !== undefined ? `Available time: ${userContext.timeAvailable} hours` : ''}

The recommendation must respect these constraints. If a budget constraint is provided, the cost should not exceed it.
If time available is provided, the estimated time should not exceed it unless absolutely necessary for basic proficiency.
</personalization>
`;
        }

        // Additional guidance
        const additionalGuidance = `
<additional_guidance>
Consider real-world learning resources like Coursera, Udemy, LinkedIn Learning, Pluralsight, edX, books, or free tutorials. 
Make the recommendation realistic and practical for a working professional.

If a specific learning style is requested, tailor the recommendation to that style.
If the person is a beginner, focus on foundational resources.
If the person is advanced, focus on specialized or cutting-edge content.
</additional_guidance>
`;

        // Combine all parts
        const fullPrompt = prompt + personalizationContext + additionalGuidance;
        
        // Prepare request data for token estimation
        const requestData = {
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: fullPrompt
            }
          ],
          temperature: 0.7
        };
        
        // Make the API request using the queue with token estimation and priority
        const response = await apiRequestQueue.add(
          async () => {
            console.log(`Executing Claude API request for skill: ${skill.Name} (queue size: ${apiRequestQueue.queue.length}, running: ${apiRequestQueue.running})`);
            
            return claude.messages.create({
              model: "claude-3-haiku-20240307",
              max_tokens: 1000,
              messages: [
                {
                  role: "user",
                  content: fullPrompt
                }
              ],
              temperature: 0.7
            });
          },
          {
            // Add info for token estimation and priority
            requestData,
            priority: 10 // Default priority (lower is higher priority)
          }
        );
        
        const recommendationText = response.content[0].text.trim();
        
        try {
          // Parse the JSON response
          const parsedRecommendation = JSON.parse(recommendationText);
          
          // Validate the response has required fields
          if (!parsedRecommendation.title || !parsedRecommendation.description) {
            throw new Error('Missing required fields in response');
          }
          
          // Add default values for missing fields and handle personalization
          const result = {
            title: parsedRecommendation.title,
            description: parsedRecommendation.description,
            resourceUrl: parsedRecommendation.resourceUrl || '',
            estimatedTimeHours: parsedRecommendation.estimatedTimeHours || 20,
            cost: parsedRecommendation.cost || 0,
            category: parsedRecommendation.category || skill.Category || 'General'
          };
          
          // Apply constraints from user context if needed
          if (userContext.budget !== undefined && result.cost > userContext.budget) {
            console.log(`Warning: Recommended resource cost (${result.cost}) exceeds user budget (${userContext.budget})`);
          }
          
          if (userContext.timeAvailable !== undefined && result.estimatedTimeHours > userContext.timeAvailable) {
            console.log(`Warning: Recommended learning time (${result.estimatedTimeHours}) exceeds user available time (${userContext.timeAvailable})`);
          }
          
          return result;
        } catch (parseError) {
          console.error('Error parsing Claude AI recommendation:', parseError);
          throw new Error('Invalid format in AI response');
        }
      } catch (apiError) {
        console.error('Error calling Claude API:', apiError.message);
        // If this was a rate limit error, log more details
        if (apiError.status === 429 || (apiError.response && apiError.response.status === 429)) {
          console.error('Claude rate limit exceeded. Using fallback recommendation.', {
            status: apiError.status || (apiError.response ? apiError.response.status : 'unknown'),
            headers: apiError.response ? apiError.response.headers : {}
          });
        }
        throw apiError;
      }
    }
    
    // Fallback to template recommendations if no API key or API call failed
    return generateFallbackRecommendation(skill, project);
  } catch (error) {
    console.error('Error generating AI recommendation:', error.message);
    // Return a fallback recommendation
    return generateFallbackRecommendation(skill, project);
  }
}

/**
 * Generate a fallback recommendation based on templates
 * @param {Object} skill - The skill object
 * @param {Object} project - The project object
 * @param {Object} userContext - Optional user context for personalization
 * @returns {Object} - A recommendation object
 */
function generateFallbackRecommendation(skill, project, userContext = {}) {
  // Templates based on skill category
  const recommendations = {
    "Programming": {
      title: `${skill.Name} Professional Development Track`,
      description: `A comprehensive course covering ${skill.Name} fundamentals to advanced techniques, with hands-on projects specifically designed for roles in ${project.Name}.`,
      resourceUrl: `https://www.udemy.com/course/${skill.Name.toLowerCase().replace(/\s+/g, '-')}/`,
      estimatedTimeHours: 25,
      cost: 49.99
    },
    "Design": {
      title: `${skill.Name} Design Workshop`,
      description: `Learn professional ${skill.Name} techniques through practical exercises and real-world examples relevant to ${project.Name}.`,
      resourceUrl: `https://www.coursera.org/specializations/${skill.Name.toLowerCase().replace(/\s+/g, '-')}`,
      estimatedTimeHours: 18,
      cost: 39.99
    },
    "Data": {
      title: `${skill.Name} Data Science Bootcamp`,
      description: `Master ${skill.Name} for data analysis and visualization, with projects and case studies related to ${project.Name}.`,
      resourceUrl: `https://www.datacamp.com/courses/${skill.Name.toLowerCase().replace(/\s+/g, '-')}`,
      estimatedTimeHours: 30,
      cost: 79.99
    },
    "Management": {
      title: `${skill.Name} Leadership Certificate`,
      description: `Develop essential ${skill.Name} skills for effective project management and team leadership in contexts like ${project.Name}.`,
      resourceUrl: `https://www.linkedin.com/learning/${skill.Name.toLowerCase().replace(/\s+/g, '-')}`,
      estimatedTimeHours: 12,
      cost: 29.99
    },
    "General": {
      title: `${skill.Name} Foundations Course`,
      description: `Build a solid foundation in ${skill.Name} with practical examples and exercises relevant to ${project.Name}.`,
      resourceUrl: `https://www.pluralsight.com/courses/${skill.Name.toLowerCase().replace(/\s+/g, '-')}`,
      estimatedTimeHours: 15,
      cost: 29.99
    }
  };
  
  // Use category if available, or default to general recommendation
  const category = skill.Category || "General";
  const templateRec = recommendations[category] || recommendations["General"];
  
  // Apply personalization based on user context
  let hours = templateRec.estimatedTimeHours;
  let cost = templateRec.cost;
  let title = templateRec.title;
  let description = templateRec.description;
  let resourceUrl = templateRec.resourceUrl;
  
  // Experience level adjustment
  if (userContext.experienceLevel) {
    if (userContext.experienceLevel.toLowerCase().includes('beginner')) {
      // More time for beginners, likely lower-cost intro resources
      hours = Math.ceil(hours * 1.2);
      title = `${title} for Beginners`;
      description = `A beginner-friendly introduction to ${skill.Name}, covering essentials and fundamentals needed for ${project.Name}.`;
    } else if (userContext.experienceLevel.toLowerCase().includes('advanced')) {
      // Less time for advanced learners, but potentially higher-cost specialized resources
      hours = Math.floor(hours * 0.8);
      cost = cost * 1.2;
      title = `Advanced ${title}`;
      description = `An intensive advanced course on ${skill.Name}, focusing on specialized techniques and best practices relevant to ${project.Name}.`;
    }
  }
  
  // Budget constraints
  if (userContext.budget !== undefined) {
    if (cost > userContext.budget) {
      // Adjust for lower budget
      if (userContext.budget === 0) {
        // Free resources only
        cost = 0;
        resourceUrl = `https://www.google.com/search?q=free+${skill.Name.toLowerCase().replace(/\s+/g, '+')}+tutorials`;
        description = `${description} This free resource provides essential knowledge for working within ${project.Name}.`;
      } else {
        // Reduce cost to match budget
        cost = Math.min(cost, userContext.budget);
      }
    }
  }
  
  // Time constraints
  if (userContext.timeAvailable !== undefined && hours > userContext.timeAvailable) {
    hours = Math.min(hours, userContext.timeAvailable);
    description = `${description} This focused path is optimized for busy professionals with limited time availability.`;
  }
  
  // Add some randomness to make recommendations look more varied, but respect constraints
  hours = Math.floor(hours * (0.9 + Math.random() * 0.2));
  
  // Only randomize cost if no budget constraint
  if (userContext.budget === undefined) {
    cost = parseFloat((cost * (0.9 + Math.random() * 0.2)).toFixed(2));
  }
  
  return {
    title,
    description,
    resourceUrl,
    estimatedTimeHours: hours,
    cost,
    category
  };
}

// Export the service functions
module.exports = {
  generateSkillRecommendations
};
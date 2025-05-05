/**
 * AI API Telemetry Service
 * 
 * This module tracks AI API usage and error rates to help monitor and optimize API calls.
 * Updated to work with Claude AI API.
 */

class AITelemetry {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitErrors: 0,
      otherErrors: 0,
      tokenUsage: 0,
      lastReset: Date.now()
    };
    
    this.errors = []; // Store recent errors
    this.maxErrorsStored = 50;
    
    // Reset hourly metrics every hour
    setInterval(() => this.resetHourlyMetrics(), 60 * 60 * 1000);
    
    // Log statistics every 10 minutes
    setInterval(() => this.logStatistics(), 10 * 60 * 1000);
  }
  
  /**
   * Record a request being made to the AI API
   * @param {string} type - Type of request being made
   */
  recordRequest(type) {
    try {
      // Simply increment the total request counter
      // We'll update success/failure status later
      this.stats.totalRequests++;
      
      // Log the request type if provided
      if (type) {
        console.debug(`AI API Request: ${type}`);
      }
    } catch (error) {
      // Ensure any errors here don't propagate up and break the main functionality
      console.error('Error recording AI API request in telemetry:', error);
    }
  }

  /**
   * Record a successful API request
   * @param {Object} data - Response data including token usage
   */
  recordSuccess(data) {
    try {
      // Don't increment total here since we already did in recordRequest
      this.stats.successfulRequests++;
      
      // Record token usage if available - handle both OpenAI and Claude formats
      if (data) {
        if (data.usage) {
          // OpenAI format
          this.stats.tokenUsage += (data.usage.total_tokens || 0);
        } else if (data.usage_metadata) {
          // Claude format
          this.stats.tokenUsage += (
            (data.usage_metadata.input_tokens || 0) + 
            (data.usage_metadata.output_tokens || 0)
          );
        }
      }
    } catch (error) {
      // Ensure any errors here don't propagate up and break the main functionality
      console.error('Error recording successful AI API request in telemetry:', error);
    }
  }
  
  /**
   * Record a failed API request
   * @param {Error} error - Error object from API call
   */
  recordError(error) {
    try {
      // Don't increment total here since we already did in recordRequest
      this.stats.failedRequests++;
      
      // Handle case where error is null or undefined
      if (!error) {
        this.stats.otherErrors++;
        console.error('Error tracking called with undefined/null error object');
        return;
      }
      
      // Categorize error - handle both OpenAI and Claude error formats
      if (
        (error.response && error.response.status === 429) || // Axios error format
        (error.status && error.status === 429) ||           // Claude API error format
        (error.message && error.message.includes('rate_limit'))
      ) {
        this.stats.rateLimitErrors++;
      } else {
        this.stats.otherErrors++;
      }
      
      // Store error details with safe access to properties
      const errorDetails = {
        timestamp: new Date().toISOString(),
        status: error.response ? error.response.status : (error.status || 'unknown'),
        message: error.message || 'No error message provided',
        headers: error.response && error.response.headers ? JSON.stringify(error.response.headers) : 'none'
      };
      
      this.errors.unshift(errorDetails); // Add to beginning
      
      // Trim errors list if needed
      if (this.errors.length > this.maxErrorsStored) {
        this.errors = this.errors.slice(0, this.maxErrorsStored);
      }
      
      // Log critical errors immediately
      if ((error.response && error.response.status >= 500) || 
          (error.status && error.status >= 500)) {
        console.error('Critical AI API error:', errorDetails);
      }
    } catch (telemetryError) {
      // Ensure any errors here don't propagate up and break the main functionality
      console.error('Error recording failed AI API request in telemetry:', telemetryError);
    }
  }
  
  /**
   * Reset hourly metrics
   */
  resetHourlyMetrics() {
    const oldStats = { ...this.stats };
    
    // Keep a running total of certain metrics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitErrors: 0,
      otherErrors: 0,
      tokenUsage: 0,
      lastReset: Date.now()
    };
    
    // Log the reset
    console.log('AI API metrics reset. Previous hour stats:', oldStats);
  }
  
  /**
   * Log current statistics
   */
  logStatistics() {
    if (this.stats.totalRequests === 0) {
      return; // Don't log if no activity
    }
    
    const successRate = this.stats.totalRequests ? 
      (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0;
    
    const rateLimitRate = this.stats.totalRequests ?
      (this.stats.rateLimitErrors / this.stats.totalRequests * 100).toFixed(2) : 0;
    
    console.log('AI API Usage Statistics:');
    console.log(`  Total Requests: ${this.stats.totalRequests}`);
    console.log(`  Success Rate: ${successRate}%`);
    console.log(`  Rate Limit Errors: ${this.stats.rateLimitErrors} (${rateLimitRate}%)`);
    console.log(`  Token Usage: ${this.stats.tokenUsage}`);
    console.log(`  Active since: ${new Date(this.stats.lastReset).toISOString()}`);
  }
  
  /**
   * Get current statistics
   * @returns {Object} Current statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests ? 
        (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0,
      recentErrors: this.errors.slice(0, 10)
    };
  }
}

// Create singleton instance
const aiTelemetry = new AITelemetry();

module.exports = aiTelemetry;
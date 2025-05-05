# Resource Pulse Backend Services

This directory contains service modules that handle business logic for the Resource Pulse application.

## Services Overview

- **aiRecommendationService.js** - Handles AI-powered skill recommendations using OpenAI API
- **externalSystemService.js** - Integration with external data sources
- **notificationScheduler.js** - Schedules recurring notification tasks
- **notificationService.js** - Manages system notifications
- **openAITelemetry.js** - Tracks OpenAI API usage and rate limit errors
- **scheduledSyncService.js** - Handles scheduled synchronization with external systems

## OpenAI API Rate Limiting & Reliability

The `aiRecommendationService.js` includes advanced rate limiting and reliability features for OpenAI API requests to prevent 429 (Too Many Requests) errors and other API issues.

### Enhanced Features

1. **Token Bucket Algorithm**: Tracks both request frequency and token usage
2. **Smart Queue System**: Prioritizes requests and handles concurrent limits
3. **Dynamic Backoff**: Uses OpenAI's retry-after header when available
4. **Circuit Breaker Pattern**: Temporarily disables API calls after multiple failures
5. **Request Prioritization**: Higher priority for retry attempts and critical requests
6. **Jitter Implementation**: Adds randomization to prevent synchronized retries
7. **Telemetry & Monitoring**: Tracks API usage metrics and failure rates
8. **Admin Dashboard Access**: Exposes telemetry data via API endpoint

### How Rate Limiting Works

1. **Request Queue**: All OpenAI API requests go through a queue system
2. **Token Tracking**: Estimates and tracks token usage for each request
3. **Concurrent Request Limit**: Only allows a configurable number of requests to run simultaneously
4. **Request Spacing**: Enforces minimum delay between requests to stay under rate limits
5. **Automatic Retries**: When rate limit errors (429) occur, automatically retries with exponential backoff
6. **Fallback Mechanism**: Falls back to template-based recommendations if API calls fail

### Configuration

Rate limiting settings can be adjusted in `aiRecommendationService.js`:

```javascript
const RATE_LIMIT = {
  requestsPerMinute: 10,  // More conservative than the 20 RPM limit
  tokensPerMinute: 30000, // Approximate token limit (free tier with safety margin)
  maxConcurrent: 2,       // Maximum concurrent requests
  retryDelay: 3000,       // Base delay for retries in ms
  maxRetries: 4,          // Maximum number of retries
  retryMultiplier: 1.5,   // Use 1.5x multiplier for gradual backoff
  initialDelay: 500       // Delay between requests to avoid bursts
};
```

#### Recommended Settings by OpenAI Tier

| Subscription Tier | requestsPerMinute | tokensPerMinute | maxConcurrent |
|-------------------|-------------------|-----------------|---------------|
| Free              | 10                | 30000           | 2             |
| Lowest Paid       | 40                | 50000           | 3             |
| Standard          | 2500              | 80000           | 5             |

### Error Handling

The service implements multiple layers of error handling:

1. **API Key Check**: Verifies the presence of an API key before attempting requests
2. **Rate Limit Detection**: Identifies 429 errors and implements appropriate backoff
3. **Token Usage Estimation**: Prevents token limit errors by tracking usage
4. **Circuit Breaker**: Temporarily disables API calls after multiple consecutive failures
5. **Request Priority**: Increases priority for retry attempts
6. **Fallback System**: Uses predefined templates when API calls fail
7. **Telemetry**: Tracks and logs error rates and patterns

### Implementation Details

- **Token Bucket Algorithm**: Continuously refills token allowance based on elapsed time
- **Priority Queue**: Requests are sorted by priority with retries getting higher priority
- **Exponential Backoff**: Uses configurable multiplier with jitter for natural spacing
- **Request Tracking**: Each request gets a unique ID for logging and monitoring
- **Adaptive Rate Control**: Adapts based on API response headers when available

### Telemetry & Monitoring

The service automatically collects usage metrics:

- Total requests and success/failure rates
- Token usage tracking
- Rate limit error frequency
- Response times and queue wait times
- Recent error details for debugging

Access metrics via the `/api/telemetry/openai` endpoint.

### Environment Setup

Ensure the OpenAI API key is set in your environment variables:

```
OPENAI_API_KEY=your_api_key_here
```

If no API key is provided, the system will use fallback recommendation templates.
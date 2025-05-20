# ResourcePulse Backend

Backend API server for the ResourcePulse resource allocation application.

## Setup

### Normal Setup with Database

1. Create a `.env` file based on `.env.example`
2. Configure your database connection in the `.env` file
3. Set up your OpenAI API Key for AI-powered features

```bash
# Install dependencies
npm install

# Initialize the database
node db/setup-db-from-scratch.js

# Set up skills gap analysis tables
npm run fix-skills-gap-tables

# Start the development server
npm run dev
```

### Skills Gap Analysis

The Skills Gap Analysis feature provides insights into:

- Organization-wide skills gaps
- Department-specific skills gaps
- Resource-specific skills gaps
- Training recommendations
- Hiring recommendations

#### Required Data

For the Skills Gap Analysis to work with real data:

1. **Skills Data**: Make sure the Skills table is populated
2. **Resources with Skills**: Assign skills to resources in the ResourceSkills table
3. **Projects with Skill Requirements**: Define skill requirements for projects in the ProjectSkills table
4. **Future Projects**: Ensure some projects have end dates in the future (that's what demand is based on)

#### Diagnostic Tool

A diagnostic endpoint is available to check the status of your skills data:

```
GET /api/skills-gap/data-status
```

This will show:
- Which tables exist and have data
- Whether resources have skills assigned
- Whether projects have skill requirements
- Specific recommendations on what data to add

#### Fallback Behavior

If real data calculation fails or lacks sufficient data, the system will automatically fall back to sample data. You'll know you're seeing fallback data when:

1. The response header includes `X-Using-Fallback-Data: true`
2. The diagnostic endpoint shows `usingRealData: false`

### Development Setup with Mock Data

If you don't have access to the SQL Server database, you can use the built-in mock data service:

```bash
# Install dependencies
npm install

# Set up mock data service
node setup-mock-data.js

# Start the development server
npm run dev
```

The mock data service provides an in-memory database that simulates all backend functionality including:
- Projects, resources, and allocations management
- Skills tracking
- Financial calculations
- All core API endpoints

This allows for development and testing without requiring a SQL Server instance.

### Production Schema Fix

If you encounter SQL errors about the `Variance` column in production, run the schema fix script:

```bash
# Run the database schema fix
node fix-production-schema.js
```

## API Features

### Resource Management
- Create, read, update, and delete resources
- Skill tracking for resources
- Capacity management and utilization tracking

### Project Management
- Create, read, update, and delete projects
- Project skill requirements
- Budget and timeline tracking

### Allocation Management
- Allocate resources to projects
- Manage utilization percentages
- Track allocation periods

### AI-Powered Features
- Skill recommendation generation
- Learning resource suggestions
- Personalized development paths

## Testing

Run the backend tests:

```bash
node tests/test-notification.js  # Test notification service
node tests/test-digest.js        # Test weekly digest
node tests/test-ai-recommendations.js # Test AI recommendations
```

## Environment Variables

The application uses the following environment variables:

```
# Database Configuration
DB_SERVER=your-db-server
DB_NAME=ResourcePulseDB
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_PORT=1433

# Server Configuration
PORT=8000
NODE_ENV=development

# Mock Data Service (for development without a database)
USE_MOCK_DATA=true  # Set to true to use mock data, false to use real database

# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key

# Notification Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Development Environment

For development, you can create a `.env.development` file which will be loaded automatically when NODE_ENV is set to development. This allows you to have different settings for development and production.

Example `.env.development`:
```
PORT=8000
NODE_ENV=development
USE_MOCK_DATA=true
```

## Documentation

API documentation is available at `/api-docs` when the server is running in development mode.
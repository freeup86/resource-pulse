# ResourcePulse Database Setup

This directory contains scripts for setting up and managing the ResourcePulse database.

## Available Scripts

### Setup Scripts

- `setup-db-from-scratch.js` - Sets up the entire database from scratch, including all tables and required components
- `init-db.js` - Legacy script to initialize the basic database structure
- `fix-all.js` - Applies all database fixes (notification tables, capacity tables)
- `fix-capacity.js` - Fixes only the capacity planning tables

### Data Scripts

- `seed-sample-data.js` - Populates the database with sample data for testing

### Schema Scripts

- `setup.sql` - Core database tables (Resources, Projects, Skills, Allocations)
- `capacity-tables.sql` - Capacity planning and forecasting tables
- `notification-tables.sql` - Notification system tables
- `fix-capacity-tables.sql` - Fixes for capacity tables

## Quick Start

To set up the database from scratch:

```bash
# From the resource-pulse-backend directory
node db/setup-db-from-scratch.js
```

To add sample data after setting up the database:

```bash
# From the resource-pulse-backend directory
node db/seed-sample-data.js
```

## Troubleshooting

If you encounter database errors in the application, try running the fix scripts:

```bash
# Fix all issues
node db/fix-all.js

# Or fix only capacity tables
node db/fix-capacity.js
```

## Database Schema Overview

The ResourcePulse database consists of the following main components:

1. **Core Tables**
   - Resources - People who can be allocated to projects
   - Projects - Work that resources can be allocated to
   - Skills - Skills that resources can have
   - Allocations - Assignments of resources to projects for periods of time

2. **Capacity Planning Tables**
   - CapacityScenarios - "What-if" scenarios for planning
   - ScenarioAllocations - Potential allocations in scenarios
   - ResourceCapacity - Tracking available capacity over time

3. **Notification System Tables**
   - NotificationTypes - Types of notifications supported
   - Notifications - Individual notifications for users
   - UserNotificationSettings - User preferences for notifications
   - EmailQueue - Queue for email notifications
   - SystemNotificationSettings - System-wide notification settings

## Best Practices

- Always run database scripts on a test environment before applying to production
- Back up your database before running any script that modifies schema
- When adding new tables, update the appropriate SQL files and the setup script
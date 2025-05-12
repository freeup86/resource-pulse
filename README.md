# Robotics Education CRM System

A comprehensive Customer Relationship Management (CRM) system designed specifically for businesses teaching robotics to children and partnering with schools for robotics education programs.

## Project Overview

This system helps manage:
- Student profiles and learning progress
- Class scheduling and curriculum management
- Parent/guardian relationships
- School partnerships
- Instructor management
- Robotics equipment inventory
- Communications
- Financial transactions
- Reporting and analytics

## Technology Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: Microsoft SQL Server
- **Authentication**: JWT-based
- **State Management**: React Context API
- **API Design**: RESTful principles

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Microsoft SQL Server
- Git

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your database and other configuration settings.

5. Initialize the database:
   ```
   npm run init-db
   ```

6. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Default Admin Login

- Email: admin@roboticsedu.com
- Password: AdminPassword123!

## Development Guidelines

- Follow the established code structure and patterns
- Add appropriate comments for complex logic
- Write tests for new features
- Follow security best practices, especially for handling sensitive student data
- Ensure COPPA compliance for handling children's information
- Use proper error handling and validation

## Key Features

- Student profile and progress tracking
- Class scheduling and enrollment management
- School partnership management
- Equipment inventory tracking
- Parent portal
- Instructor management
- Financial processing
- Reporting and analytics
- Communication tools

## License

Copyright (c) 2023 Robotics Education CRM Team
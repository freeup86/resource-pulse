# ResourcePulse

ResourcePulse is a comprehensive resource allocation and management application designed for professional service organizations to efficiently manage their projects, resources, skills, and allocations.

## Features

### Core Functionality
- Resource Management: Track skills, capacity, and availability
- Project Management: Manage project details, timelines, and required skills
- Allocation Management: Allocate resources to projects with utilization tracking
- Timeline Visualization: Visual timeline of allocations and project schedules
- Analytics Dashboard: Resource utilization and project analytics

### AI-Enhanced Features
- **AI-Powered Skill Recommendations**: Get intelligent recommendations for skill development based on project requirements
- **Personalized Learning Paths**: Customized training recommendations based on experience level, learning style, and constraints
- **Skill Gap Analysis**: Identify skill gaps and get AI suggestions for closing them

## Getting Started

### Prerequisites
- Node.js 14+
- SQL Server Database
- OpenAI API Key (for AI-powered features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/resource-pulse.git
cd resource-pulse

# Install frontend dependencies
npm install

# Install backend dependencies
cd resource-pulse-backend
npm install
cd ..
```

### Configuration

1. Create a `.env` file in the `resource-pulse-backend` directory based on `.env.example`
2. Configure your database connection
3. Add your OpenAI API Key for AI-powered features

### Running the Application

```bash
# Start the frontend development server
npm start

# In a separate terminal, start the backend server
cd resource-pulse-backend
npm run dev
```

## Using AI-Powered Features

### Skill Recommendations

ResourcePulse can generate intelligent recommendations for skill development based on project requirements. To use this feature:

1. Navigate to a Project Detail page
2. Click "Generate AI Recommendations" button
3. View the AI-generated recommendations for each required skill

### Personalized Learning Paths

For more tailored recommendations, you can set your preferences:

1. Click "Personalize Recommendations" on the recommendation panel
2. Configure your preferences:
   - Experience Level: Beginner to Expert
   - Learning Style: Visual, Reading, Interactive, or Social
   - Budget Constraints: Set maximum budget per skill
   - Time Constraints: Set available hours for learning

The AI will generate customized recommendations based on your specific needs and constraints.

## Technology Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: SQL Server
- **AI Integration**: OpenAI API

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
// resource-pulse-backend/services/externalSystemService.js
const axios = require('axios');

class ExternalSystemService {
  constructor() {
    this.baseUrl = process.env.EXTERNAL_SYSTEM_API_URL;
    this.apiKey = process.env.EXTERNAL_SYSTEM_API_KEY;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Check if external system is configured
  isConfigured() {
    return !!(this.baseUrl && this.apiKey);
  }

  // Validate configuration before making requests
  validateConfiguration() {
    if (!this.baseUrl) {
      throw new Error('External system API URL is not configured. Please set EXTERNAL_SYSTEM_API_URL environment variable.');
    }
    if (!this.apiKey) {
      throw new Error('External system API key is not configured. Please set EXTERNAL_SYSTEM_API_KEY environment variable.');
    }
  }

  // Fetch resources from external system
  async fetchResources() {
    try {
      // Check if external system is configured
      if (!this.isConfigured()) {
        console.log('External system not configured, returning mock data');
        return this.getMockResources();
      }

      this.validateConfiguration();
      const response = await axios.get(`${this.baseUrl}/resources`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching resources from external system:', error);
      console.log('Falling back to mock data');
      return this.getMockResources();
    }
  }

  // Mock resources for testing/fallback
  getMockResources() {
    return [
      {
        id: 'ext-1',
        name: 'John Doe',
        email: 'john.doe@external.com',
        role: 'Senior Developer',
        skills: ['JavaScript', 'React', 'Node.js'],
        hourlyRate: 75,
        billableRate: 150
      },
      {
        id: 'ext-2',
        name: 'Jane Smith',
        email: 'jane.smith@external.com',
        role: 'Project Manager',
        skills: ['Project Management', 'Agile', 'Scrum'],
        hourlyRate: 85,
        billableRate: 170
      },
      {
        id: 'ext-3',
        name: 'Mike Johnson',
        email: 'mike.johnson@external.com',
        role: 'UX Designer',
        skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite'],
        hourlyRate: 70,
        billableRate: 140
      }
    ];
  }

  // Fetch projects from external system
  async fetchProjects() {
    try {
      // Check if external system is configured
      if (!this.isConfigured()) {
        console.log('External system not configured, returning mock projects');
        return this.getMockProjects();
      }

      this.validateConfiguration();
      const response = await axios.get(`${this.baseUrl}/projects`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects from external system:', error);
      console.log('Falling back to mock projects');
      return this.getMockProjects();
    }
  }

  // Mock projects for testing/fallback
  getMockProjects() {
    return [
      {
        id: 'ext-proj-1',
        name: 'External E-commerce Platform',
        client: 'External Client A',
        status: 'Active',
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        budget: 250000,
        description: 'Build a modern e-commerce platform'
      },
      {
        id: 'ext-proj-2',
        name: 'External Mobile App',
        client: 'External Client B',
        status: 'Planning',
        startDate: '2024-03-01',
        endDate: '2024-08-15',
        budget: 180000,
        description: 'Develop cross-platform mobile application'
      }
    ];
  }

  // Fetch allocations from external system
  async fetchAllocations() {
    try {
      // Check if external system is configured
      if (!this.isConfigured()) {
        console.log('External system not configured, returning mock allocations');
        return this.getMockAllocations();
      }

      this.validateConfiguration();
      const response = await axios.get(`${this.baseUrl}/allocations`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching allocations from external system:', error);
      console.log('Falling back to mock allocations');
      return this.getMockAllocations();
    }
  }

  // Mock allocations for testing/fallback
  getMockAllocations() {
    return [
      {
        id: 'ext-alloc-1',
        resourceId: 'ext-1',
        projectId: 'ext-proj-1',
        utilization: 75,
        startDate: '2024-01-15',
        endDate: '2024-06-30'
      },
      {
        id: 'ext-alloc-2',
        resourceId: 'ext-2',
        projectId: 'ext-proj-1',
        utilization: 50,
        startDate: '2024-01-15',
        endDate: '2024-06-30'
      },
      {
        id: 'ext-alloc-3',
        resourceId: 'ext-3',
        projectId: 'ext-proj-2',
        utilization: 60,
        startDate: '2024-03-01',
        endDate: '2024-08-15'
      }
    ];
  }
}

module.exports = new ExternalSystemService();
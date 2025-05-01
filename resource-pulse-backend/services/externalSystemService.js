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

  // Fetch resources from external system
  async fetchResources() {
    try {
      const response = await axios.get(`${this.baseUrl}/resources`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching resources from external system:', error);
      throw error;
    }
  }

  // Fetch projects from external system
  async fetchProjects() {
    try {
      const response = await axios.get(`${this.baseUrl}/projects`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects from external system:', error);
      throw error;
    }
  }

  // Fetch allocations from external system
  async fetchAllocations() {
    try {
      const response = await axios.get(`${this.baseUrl}/allocations`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching allocations from external system:', error);
      throw error;
    }
  }
}

module.exports = new ExternalSystemService();
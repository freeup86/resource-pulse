// resource-pulse-backend/services/scheduledSyncService.js
const cron = require('node-cron');
const axios = require('axios');

class ScheduledSyncService {
  constructor() {
    this.baseUrl = process.env.APP_URL || 'http://localhost:8000';
  }
  
  // Initialize scheduled jobs
  initializeJobs() {
    // Run daily at 1:00 AM
    cron.schedule('0 1 * * *', () => {
      this.runFullSync();
    });
  }
  
  // Run a full sync
  async runFullSync() {
    console.log('Starting scheduled data sync...');
    try {
      // Call our own API endpoints to trigger the sync
      await axios.post(`${this.baseUrl}/api/sync/all`, {
        scheduled: true,
        apiKey: process.env.INTERNAL_API_KEY
      });
      
      console.log('Scheduled data sync completed successfully');
    } catch (err) {
      console.error('Error during scheduled data sync:', err);
    }
  }
}

module.exports = new ScheduledSyncService();
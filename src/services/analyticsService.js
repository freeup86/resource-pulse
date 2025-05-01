// src/services/analyticsService.js
import api from './api';

export const getUtilizationStats = async (startDate, endDate) => {
  try {
    const response = await api.get('/analytics/utilization', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching utilization stats:', error);
    throw error;
  }
};

export const getSkillsStats = async () => {
  try {
    const response = await api.get('/analytics/skills');
    return response.data;
  } catch (error) {
    console.error('Error fetching skills stats:', error);
    throw error;
  }
};

export const getProjectStats = async () => {
  try {
    const response = await api.get('/analytics/projects');
    return response.data;
  } catch (error) {
    console.error('Error fetching project stats:', error);
    throw error;
  }
};

export const generateReport = async (reportType, format, filters) => {
  try {
    const response = await api.post('/analytics/reports', {
      reportType,
      format,
      filters
    }, {
      responseType: format === 'pdf' ? 'blob' : 'json'
    });
    
    // If PDF, create a download link
    if (format === 'pdf') {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return { success: true };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};
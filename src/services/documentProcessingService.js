// src/services/documentProcessingService.js
import api from './api';

/**
 * Upload and process a document
 * @param {File} file - Document file to upload
 * @param {string} documentType - Type of document ('resume', 'project_document', 'skill_certification')
 * @param {Object} metadata - Additional metadata for the document
 * @returns {Promise<Object>} - Processed document data
 */
export const processDocument = async (file, documentType, metadata = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await api.post('/documents/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

/**
 * Get processed documents
 * @param {Object} params - Query parameters
 * @param {string} [params.documentType] - Optional filter by document type
 * @param {string} [params.startDate] - Optional filter by start date
 * @param {string} [params.endDate] - Optional filter by end date
 * @returns {Promise<Array>} - Array of processed documents
 */
export const getProcessedDocuments = async (params = {}) => {
  try {
    const response = await api.get('/documents', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching processed documents:', error);
    throw error;
  }
};

/**
 * Get document by ID
 * @param {number} documentId - Document ID
 * @returns {Promise<Object>} - Document details
 */
export const getDocumentById = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Delete a processed document
 * @param {number} documentId - Document ID to delete
 * @returns {Promise<Object>} - Result of deletion
 */
export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    throw error;
  }
};
import React, { useState, useEffect } from 'react';
import { 
  processDocument, 
  getProcessedDocuments, 
  getDocumentById, 
  deleteDocument 
} from '../../../services/documentProcessingService';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import DocumentUpload from './DocumentUpload';
import ProcessedDocumentsList from './ProcessedDocumentsList';
import DocumentViewer from './DocumentViewer';

const DocumentProcessingPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [filter, setFilter] = useState('all');
  
  // Fetch processed documents on initial load
  useEffect(() => {
    fetchDocuments();
  }, [filter]);
  
  // Fetch processed documents
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (filter !== 'all') {
        params.documentType = filter;
      }
      
      const response = await getProcessedDocuments(params);
      setDocuments(response);
    } catch (err) {
      console.error('Error fetching processed documents:', err);
      setError('Failed to load processed documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle document upload and processing
  const handleProcessDocument = async (file, documentType, metadata) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const response = await processDocument(file, documentType, metadata);
      
      // Add the newly processed document to the documents list
      setDocuments([response, ...documents]);
      
      // Show success message
      setSuccessMessage(`Document ${file.name} processed successfully!`);
      
      // Switch to documents tab
      setActiveTab('documents');
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Failed to process document. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle document selection
  const handleDocumentSelect = async (documentId) => {
    if (selectedDocument && selectedDocument.id === documentId) {
      setSelectedDocument(null);
      return;
    }
    
    setDocumentLoading(true);
    setError(null);
    
    try {
      const document = await getDocumentById(documentId);
      setSelectedDocument(document);
    } catch (err) {
      console.error('Error fetching document details:', err);
      setError('Failed to load document details. Please try again later.');
    } finally {
      setDocumentLoading(false);
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = async (documentId) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      await deleteDocument(documentId);
      
      // Remove deleted document from the documents list
      setDocuments(documents.filter(doc => doc.id !== documentId));
      
      // If the deleted document was the selected one, clear selection
      if (selectedDocument && selectedDocument.id === documentId) {
        setSelectedDocument(null);
      }
      
      // Show success message
      setSuccessMessage('Document deleted successfully!');
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Powered Document Processing</h1>
      
      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'upload' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Document
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'documents' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'hover:text-gray-600 hover:border-gray-300'}`}
              onClick={() => setActiveTab('documents')}
            >
              Processed Documents
            </button>
          </li>
        </ul>
      </div>
      
      {/* Content */}
      {activeTab === 'upload' ? (
        <div className="bg-white rounded-lg shadow-md">
          <DocumentUpload 
            onProcessDocument={handleProcessDocument}
            loading={loading}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Documents list - left side */}
          <div className="md:col-span-1">
            <ProcessedDocumentsList 
              documents={documents}
              selectedDocumentId={selectedDocument?.id}
              onDocumentSelect={handleDocumentSelect}
              onDeleteDocument={handleDeleteDocument}
              onFilterChange={handleFilterChange}
              currentFilter={filter}
              loading={loading}
              error={error}
            />
          </div>
          
          {/* Document viewer - right side */}
          <div className="md:col-span-2">
            {documentLoading ? (
              <div className="bg-white rounded-lg shadow-md p-6 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <ErrorMessage message={error} />
              </div>
            ) : selectedDocument ? (
              <DocumentViewer document={selectedDocument} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a Document</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Select a document from the list to view its details and AI-extracted information
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentProcessingPage;
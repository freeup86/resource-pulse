import React, { useState } from 'react';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';

const ProcessedDocumentsList = ({ 
  documents,
  selectedDocumentId,
  onDocumentSelect,
  onDeleteDocument,
  onFilterChange,
  currentFilter,
  loading,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get document icon based on type
  const getDocumentIcon = (type) => {
    switch (type) {
      case 'resume':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'project_document':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'skill_certification':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'contract':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'timesheet':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'invoice':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => {
    const searchMatch = searchTerm === '' || 
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.metadata && doc.metadata.notes && 
       doc.metadata.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const typeMatch = currentFilter === 'all' || doc.documentType === currentFilter;
    
    return searchMatch && typeMatch;
  });
  
  // Document types for filter
  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'resume', label: 'Resumes' },
    { value: 'project_document', label: 'Project Documents' },
    { value: 'skill_certification', label: 'Skill Certifications' },
    { value: 'contract', label: 'Contracts' },
    { value: 'timesheet', label: 'Timesheets' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Processed Documents</h3>
        
        <input
          type="text"
          placeholder="Search documents..."
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Type
          </label>
          <select
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={currentFilter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="p-6 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-4">
          <ErrorMessage message={error} />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          {documents.length === 0 
            ? 'No documents have been processed yet.' 
            : 'No documents match your search criteria.'}
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[600px]">
          <ul className="divide-y divide-gray-200">
            {filteredDocuments.map((document) => (
              <li 
                key={document.id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedDocumentId === document.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="p-4" onClick={() => onDocumentSelect(document.id)}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getDocumentIcon(document.documentType)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.filename}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(document.processedDate)} · {document.fileType}
                      </p>
                      
                      {document.aiTags && document.aiTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {document.aiTags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {document.aiTags.length > 3 && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                              +{document.aiTags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedDocumentId === document.id && (
                  <div className="px-4 py-2 bg-blue-50 flex justify-end border-t border-blue-100">
                    <button
                      className="text-xs text-red-600 hover:text-red-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this document?')) {
                          onDeleteDocument(document.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProcessedDocumentsList;
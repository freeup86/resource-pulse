import React, { useState, useRef } from 'react';
import LoadingSpinner from '../../common/LoadingSpinner';

const DocumentUpload = ({ onProcessDocument, loading }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('resume');
  const [metadata, setMetadata] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Validate and set file
  const validateAndSetFile = (selectedFile) => {
    setFileError('');
    
    if (!selectedFile) return;
    
    // Check file type
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      setFileError('Invalid file type. Please upload a PDF, Word document, text file, or Excel spreadsheet.');
      return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setFileError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setFile(selectedFile);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle click on the drop area
  const handleDropAreaClick = () => {
    fileInputRef.current.click();
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!file) {
      setFileError('Please select a file to upload.');
      return;
    }
    
    // Add document type to metadata
    const docMetadata = {
      ...metadata,
      documentType
    };
    
    // Process document
    onProcessDocument(file, documentType, docMetadata);
  };

  // Handle metadata field change
  const handleMetadataChange = (e) => {
    setMetadata({
      ...metadata,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Upload Document for AI Processing</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={loading}
          >
            <option value="resume">Resume</option>
            <option value="project_document">Project Document</option>
            <option value="skill_certification">Skill Certification</option>
            <option value="contract">Contract</option>
            <option value="timesheet">Timesheet</option>
            <option value="invoice">Invoice</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {/* File drop area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={handleDropAreaClick}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={loading}
            />
            
            {file ? (
              <div className="py-4">
                <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="py-8">
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, Word, Excel or Text files (max. 10MB)
                </p>
              </div>
            )}
          </div>
          
          {fileError && (
            <p className="mt-2 text-sm text-red-600">{fileError}</p>
          )}
        </div>
        
        {/* Additional metadata fields based on document type */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Document Metadata</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentType === 'resume' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    name="candidateName"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={handleMetadataChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Applied For
                  </label>
                  <input
                    type="text"
                    name="position"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={handleMetadataChange}
                    disabled={loading}
                  />
                </div>
              </>
            )}
            
            {documentType === 'project_document' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={handleMetadataChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Category
                  </label>
                  <select
                    name="category"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={handleMetadataChange}
                    disabled={loading}
                  >
                    <option value="">Select category...</option>
                    <option value="requirements">Requirements</option>
                    <option value="proposal">Proposal</option>
                    <option value="scope">Scope Document</option>
                    <option value="plan">Project Plan</option>
                    <option value="report">Status Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}
            
            {documentType === 'skill_certification' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    name="resourceName"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={handleMetadataChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certification Name
                  </label>
                  <input
                    type="text"
                    name="certificationName"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={handleMetadataChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    name="issuingOrg"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={handleMetadataChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={handleMetadataChange}
                    disabled={loading}
                  />
                </div>
              </>
            )}
            
            {/* Common fields for all document types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                rows="3"
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                onChange={handleMetadataChange}
                disabled={loading}
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !file}
          >
            {loading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Processing...</span>
              </div>
            ) : (
              'Process Document'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;
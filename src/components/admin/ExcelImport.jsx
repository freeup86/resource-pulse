import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const ExcelImport = ({ onImportData, dataType }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [mappings, setMappings] = useState({});
  const [headers, setHeaders] = useState([]);
  
  // Define required fields for each data type
  const requiredFields = {
    resources: ['name', 'role'],
    projects: ['name', 'client'],
    allocations: ['resourceId', 'projectId', 'startDate', 'endDate', 'utilization']
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (data.length < 2) {
            setError('File must contain headers and at least one data row');
            return;
          }
          
          // Get headers
          const excelHeaders = data[0];
          setHeaders(excelHeaders);
          
          // Initialize mappings
          const initialMappings = {};
          excelHeaders.forEach((header, index) => {
            // Try to auto-match headers (case-insensitive)
            const lowerHeader = header.toLowerCase();
            if (requiredFields[dataType].includes(lowerHeader)) {
              initialMappings[lowerHeader] = index;
            }
          });
          setMappings(initialMappings);
          
          // Set preview data
          setPreview(data.slice(0, 6)); // Show first 5 rows plus header
        } catch (err) {
          setError('Failed to parse Excel file: ' + err.message);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsBinaryString(selectedFile);
    }
  };
  
  const handleMappingChange = (field, headerIndex) => {
    setMappings(prev => ({
      ...prev,
      [field]: parseInt(headerIndex)
    }));
  };
  
  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    // Validate mappings
    const missingFields = requiredFields[dataType].filter(field => mappings[field] === undefined);
    if (missingFields.length > 0) {
      setError(`Missing mappings for required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      setImporting(true);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with headers
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          // Map data using the defined mappings
          const mappedData = data.map(row => {
            const mappedRow = {};
            
            // Map each required field
            Object.entries(mappings).forEach(([field, headerIndex]) => {
              const headerName = headers[headerIndex];
              mappedRow[field] = row[headerName];
            });
            
            return mappedRow;
          });
          
          // Call the parent component's import handler
          await onImportData(mappedData);
          
          // Reset the form
          setFile(null);
          setPreview(null);
          setError(null);
          
          // Show success message
          alert(`Successfully imported ${mappedData.length} ${dataType}`);
        } catch (err) {
          setError('Failed to import data: ' + err.message);
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setImporting(false);
      };
      
      reader.readAsBinaryString(file);
    } catch (err) {
      setError('Failed to import: ' + err.message);
      setImporting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Import {dataType}</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Excel File
        </label>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <p className="text-sm text-gray-500 mt-1">
          File must be Excel format (.xlsx or .xls)
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {preview && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Preview</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {preview[0].map((header, index) => (
                    <th key={index} className="px-4 py-2 border border-gray-200 text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 border border-gray-200">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <h3 className="text-lg font-medium mt-6 mb-2">Map Fields</h3>
          <p className="text-sm text-gray-500 mb-4">
            Map the required fields to your Excel columns
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {requiredFields[dataType].map(field => (
              <div key={field} className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field} *
                </label>
                <select
                  value={mappings[field] || ''}
                  onChange={(e) => handleMappingChange(field, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">-- Select Column --</option>
                  {headers.map((header, index) => (
                    <option key={index} value={index}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelImport;
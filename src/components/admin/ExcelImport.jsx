import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const ExcelImport = ({ onImportData, dataType }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [mappings, setMappings] = useState({});
  const [headers, setHeaders] = useState([]);
  
  // Define fields for each data type
  const fieldDefinitions = {
    resources: [
      { name: 'name', required: true, description: 'Full name of the resource' },
      { name: 'role', required: true, description: 'Job role or position' },
      { name: 'email', required: false, description: 'Email address' },
      { name: 'phone', required: false, description: 'Phone number' },
      { name: 'skills', required: false, description: 'Comma-separated list of skills' }
    ],
    projects: [
      { name: 'name', required: true, description: 'Project name' },
      { name: 'client', required: true, description: 'Client name' },
      { name: 'description', required: false, description: 'Project description' },
      { name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' },
      { name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' },
      { name: 'requiredSkills', required: false, description: 'Comma-separated list of required skills' },
      { name: 'requiredRoles', required: false, description: 'JSON format: [{"roleId":1,"count":2},{"roleId":3,"count":1}]' },
      { name: 'status', required: false, description: 'Project status (default: Active)' }
    ],
    allocations: [
      { name: 'resourceId', required: true, description: 'Resource ID number' },
      { name: 'projectId', required: true, description: 'Project ID number' },
      { name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' },
      { name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' },
      { name: 'utilization', required: true, description: 'Utilization percentage (1-100)' }
    ]
  };
  
  // Get required fields
  const requiredFields = fieldDefinitions[dataType]
    .filter(field => field.required)
    .map(field => field.name);
  
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
            const matchingField = fieldDefinitions[dataType].find(
              field => field.name.toLowerCase() === lowerHeader
            );
            
            if (matchingField) {
              initialMappings[matchingField.name] = index;
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
    const missingFields = requiredFields.filter(field => mappings[field] === undefined);
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
            
            // Map each field
            fieldDefinitions[dataType].forEach(field => {
              if (mappings[field.name] !== undefined) {
                const headerName = headers[mappings[field.name]];
                mappedRow[field.name] = row[headerName];
              }
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
  
  const downloadTemplate = () => {
    // Get all fields for this data type
    const fields = fieldDefinitions[dataType];
    
    // Use regular field names for headers
    const headers = fields.map(field => field.name);
    
    // Create a row that marks which fields are required
    const requiredMarkers = fields.map(field => 
      field.required ? "REQUIRED" : "optional"
    );
    
    // Create descriptions row
    const descriptions = fields.map(field => field.description);
    
    // Create worksheet with headers
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    
    // Add required/optional row
    XLSX.utils.sheet_add_aoa(worksheet, [requiredMarkers], {origin: "A2"});
    
    // Add descriptions row
    XLSX.utils.sheet_add_aoa(worksheet, [descriptions], {origin: "A3"});
    
    // Add sample data row
    const sampleData = [];
    fields.forEach(field => {
      switch(field.name) {
        case 'name': 
          sampleData.push('John Doe');
          break;
        case 'role':
          sampleData.push('Software Developer');
          break;
        case 'email':
          sampleData.push('john.doe@example.com');
          break;
        case 'phone':
          sampleData.push('123-456-7890');
          break;
        case 'skills':
          sampleData.push('JavaScript,React,Node.js');
          break;
        case 'client':
          sampleData.push('ACME Corporation');
          break;
        case 'description':
          sampleData.push('Project description goes here');
          break;
        case 'startDate':
          sampleData.push('2025-05-01');
          break;
        case 'endDate':
          sampleData.push('2025-12-31');
          break;
        case 'requiredSkills':
          sampleData.push('JavaScript,React,Node.js');
          break;
        case 'status':
          sampleData.push('Active');
          break;
        case 'resourceId':
          sampleData.push('1');
          break;
        case 'projectId':
          sampleData.push('1');
          break;
        case 'utilization':
          sampleData.push('100');
          break;
        case 'requiredRoles':
          sampleData.push('[{"roleId":1,"count":2},{"roleId":3,"count":1}]');
          break;
        default:
          sampleData.push('');
      }
    });
    
    // Add the sample data
    XLSX.utils.sheet_add_aoa(worksheet, [sampleData], {origin: "A4"});
    
    // Add a note at the top about deleting instruction rows
    const note = [["INSTRUCTIONS: The first row contains field names. The second row indicates which fields are required. The third row explains each field. Please DELETE ROWS 2-3 AND this row before uploading and keep only the header row and your data."]];
    XLSX.utils.sheet_add_aoa(worksheet, note, {origin: "A5"});
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, dataType);
    
    // Generate filename
    const fileName = `${dataType}_template.xlsx`;
    
    // Save file
    XLSX.writeFile(workbook, fileName);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Import {dataType}</h2>
      
      <div className="mb-4">
        <button
          onClick={downloadTemplate}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
        >
          Download Template
        </button>
        <p className="text-sm text-gray-600 mt-2">
          * Required fields are highlighted in red in the template
        </p>
      </div>
      
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
            {fieldDefinitions[dataType].map(field => (
              <div key={field.name} className="mb-2">
                <label className={`block text-sm font-medium mb-1 ${field.required ? 'text-red-600' : 'text-gray-700'}`}>
                  {field.name} {field.required && '*'}
                  <span className="text-xs text-gray-500 ml-1">({field.description})</span>
                </label>
                <select
                  value={mappings[field.name] || ''}
                  onChange={(e) => handleMappingChange(field.name, e.target.value)}
                  className={`w-full p-2 border rounded ${
                    field.required && !mappings[field.name] 
                      ? 'border-red-500' 
                      : 'border-gray-300'
                  }`}
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
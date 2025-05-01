// src/components/analytics/ReportControls.jsx
import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { calculateTotalUtilization } from '../../utils/allocationUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportControls = ({ resources, projects }) => {
  const [reportType, setReportType] = useState('utilization');
  const [exportFormat, setExportFormat] = useState('excel');
  
  const generateReport = () => {
    switch (reportType) {
      case 'utilization':
        generateUtilizationReport();
        break;
      case 'allocation':
        generateAllocationReport();
        break;
      case 'skills':
        generateSkillsReport();
        break;
      default:
        console.error('Unknown report type:', reportType);
    }
  };
  
  const generateUtilizationReport = () => {
    // Generate utilization report data
    const reportData = resources.map(resource => ({
      Name: resource.name,
      Role: resource.role,
      Email: resource.email,
      Utilization: `${calculateTotalUtilization(resource)}%`,
      Status: calculateTotalUtilization(resource) >= 100 ? 'Fully Allocated' : 'Available'
    }));
    
    if (exportFormat === 'excel') {
      // Export to Excel
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Utilization');
      XLSX.writeFile(workbook, 'resource_utilization_report.xlsx');
    } else if (exportFormat === 'pdf') {
      // Export to PDF
      const doc = new jsPDF();
      doc.text('Resource Utilization Report', 14, 16);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
      
      // Add table
      doc.autoTable({
        startY: 30,
        head: [['Name', 'Role', 'Email', 'Utilization', 'Status']],
        body: reportData.map(item => [
          item.Name,
          item.Role,
          item.Email,
          item.Utilization,
          item.Status
        ])
      });
      
      doc.save('resource_utilization_report.pdf');
    }
  };
  
  const generateAllocationReport = () => {
    // Generate allocation report data
    // Similar to utilization but with project details
    // ...
  };
  
  const generateSkillsReport = () => {
    // Generate skills gap report data
    // ...
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium mb-4">Generate Reports</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="utilization">Resource Utilization</option>
            <option value="allocation">Project Allocation</option>
            <option value="skills">Skills Gap Analysis</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="excel">Excel (.xlsx)</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={generateReport}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center hover:bg-blue-700 w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        Generated reports will be downloaded to your device.
      </div>
    </div>
  );
};

export default ReportControls;
// src/components/analytics/ReportControls.jsx
import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { calculateTotalUtilization } from '../../utils/allocationUtils';

const ReportControls = ({ resources, projects }) => {
  const [reportType, setReportType] = useState('utilization');
  
  // We'll just focus on Excel exports which are working
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
      Email: resource.email || 'N/A',
      Utilization: `${calculateTotalUtilization(resource)}%`,
      Status: calculateTotalUtilization(resource) >= 100 ? 'Fully Allocated' : 'Available'
    }));
    
    // Export to Excel
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Utilization');
    XLSX.writeFile(workbook, 'resource_utilization_report.xlsx');
  };
  
  const generateAllocationReport = () => {
    // Create a list of all allocations across resources
    const allocations = [];
    
    resources.forEach(resource => {
      // Check both allocations array and allocation property
      const resourceAllocations = resource.allocations || 
        (resource.allocation ? [resource.allocation] : []);
      
      resourceAllocations.forEach(alloc => {
        if (!alloc) return;
        
        // Find the corresponding project
        const project = projects.find(p => p.id === alloc.projectId);
        
        allocations.push({
          ResourceName: resource.name,
          ResourceRole: resource.role,
          ProjectName: project ? project.name : 'Unknown Project',
          Client: project ? project.client : 'Unknown Client',
          StartDate: alloc.startDate ? new Date(alloc.startDate).toLocaleDateString() : 'N/A',
          EndDate: alloc.endDate ? new Date(alloc.endDate).toLocaleDateString() : 'N/A',
          Utilization: `${alloc.utilization || 0}%`
        });
      });
    });
    
    // Export to Excel
    const worksheet = XLSX.utils.json_to_sheet(allocations);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Allocations');
    XLSX.writeFile(workbook, 'project_allocation_report.xlsx');
  };
  
  const generateSkillsReport = () => {
    // Collect all skills across resources and projects
    const allSkills = new Set();
    
    resources.forEach(resource => {
      resource.skills.forEach(skill => allSkills.add(skill));
    });
    
    projects.forEach(project => {
      project.requiredSkills.forEach(skill => allSkills.add(skill));
    });
    
    // Calculate skill supply and demand
    const skillsData = Array.from(allSkills).map(skill => {
      // Count resources with this skill
      const resourcesWithSkill = resources.filter(r => 
        r.skills.includes(skill)
      ).length;
      
      // Count projects requiring this skill
      const projectsRequiringSkill = projects.filter(p => 
        p.requiredSkills.includes(skill)
      ).length;
      
      // List resources with this skill
      const resourcesList = resources
        .filter(r => r.skills.includes(skill))
        .map(r => r.name)
        .join(", ");
      
      // List projects requiring this skill
      const projectsList = projects
        .filter(p => p.requiredSkills.includes(skill))
        .map(p => p.name)
        .join(", ");
      
      return {
        Skill: skill,
        ResourcesAvailable: resourcesWithSkill,
        ProjectsDemand: projectsRequiringSkill,
        Gap: resourcesWithSkill - projectsRequiringSkill,
        Status: resourcesWithSkill >= projectsRequiringSkill ? 'Sufficient' : 'Shortage',
        Resources: resourcesList,
        Projects: projectsList
      };
    }).sort((a, b) => a.Gap - b.Gap); // Sort by gap (shortages first)
    
    // Export to Excel
    const worksheet = XLSX.utils.json_to_sheet(skillsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Skills Gap');
    XLSX.writeFile(workbook, 'skills_gap_analysis_report.xlsx');
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
            disabled={true}
            className="w-full p-2 border border-gray-300 rounded bg-gray-100"
          >
            <option value="excel">Excel (.xlsx)</option>
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
        Generated reports will be downloaded to your device as Excel files.
      </div>
    </div>
  );
};

export default ReportControls;
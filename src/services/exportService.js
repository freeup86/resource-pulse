// src/services/exportService.js
import api from './api';
import * as XLSX from 'xlsx';

// Fetch and export roles list
export const exportRoles = async () => {
  try {
    const response = await api.get('/roles');
    const roles = response.data;
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(roles.map(role => ({
      ID: role.id,
      Name: role.name,
      Description: role.description || ''
    })));
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Roles");
    
    // Generate filename and save
    XLSX.writeFile(workbook, "roles_reference.xlsx");
    
    return { success: true, count: roles.length };
  } catch (error) {
    console.error('Error exporting roles:', error);
    throw error;
  }
};

// Fetch and export resources list
export const exportResources = async () => {
  try {
    const response = await api.get('/resources');
    const resources = response.data;
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(resources.map(resource => ({
      ID: resource.id,
      Name: resource.name,
      Role: resource.role
    })));
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resources");
    
    // Generate filename and save
    XLSX.writeFile(workbook, "resources_reference.xlsx");
    
    return { success: true, count: resources.length };
  } catch (error) {
    console.error('Error exporting resources:', error);
    throw error;
  }
};

// Fetch and export projects list
export const exportProjects = async () => {
  try {
    const response = await api.get('/projects');
    const projects = response.data;
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(projects.map(project => ({
      ID: project.id,
      Name: project.name,
      Client: project.client,
      Status: project.status || 'Active'
    })));
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
    
    // Generate filename and save
    XLSX.writeFile(workbook, "projects_reference.xlsx");
    
    return { success: true, count: projects.length };
  } catch (error) {
    console.error('Error exporting projects:', error);
    throw error;
  }
};

// Export all reference data in a single file
export const exportAllReferenceData = async () => {
  try {
    // Fetch all data
    const [rolesResponse, resourcesResponse, projectsResponse] = await Promise.all([
      api.get('/roles'),
      api.get('/resources'),
      api.get('/projects')
    ]);
    
    const roles = rolesResponse.data;
    const resources = resourcesResponse.data;
    const projects = projectsResponse.data;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Add roles worksheet
    const rolesWorksheet = XLSX.utils.json_to_sheet(roles.map(role => ({
      ID: role.id,
      Name: role.name,
      Description: role.description || ''
    })));
    XLSX.utils.book_append_sheet(workbook, rolesWorksheet, "Roles");
    
    // Add resources worksheet
    const resourcesWorksheet = XLSX.utils.json_to_sheet(resources.map(resource => ({
      ID: resource.id,
      Name: resource.name,
      Role: resource.role
    })));
    XLSX.utils.book_append_sheet(workbook, resourcesWorksheet, "Resources");
    
    // Add projects worksheet
    const projectsWorksheet = XLSX.utils.json_to_sheet(projects.map(project => ({
      ID: project.id,
      Name: project.name,
      Client: project.client,
      Status: project.status || 'Active'
    })));
    XLSX.utils.book_append_sheet(workbook, projectsWorksheet, "Projects");
    
    // Generate filename and save
    XLSX.writeFile(workbook, "reference_data.xlsx");
    
    return { 
      success: true, 
      counts: {
        roles: roles.length,
        resources: resources.length,
        projects: projects.length
      }
    };
  } catch (error) {
    console.error('Error exporting reference data:', error);
    throw error;
  }
};
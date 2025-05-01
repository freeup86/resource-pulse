// resource-pulse-backend/utils/dataMapperUtils.js
// Map external resource to ResourcePulse resource format
exports.mapExternalResource = (externalResource) => {
    return {
      name: externalResource.name || externalResource.fullName,
      role: externalResource.position || externalResource.title,
      email: externalResource.email || externalResource.emailAddress,
      phone: externalResource.phone || externalResource.phoneNumber,
      skills: Array.isArray(externalResource.skills) ? 
        externalResource.skills : 
        (externalResource.skills ? externalResource.skills.split(',').map(s => s.trim()) : [])
    };
  };
  
  // Map external project to ResourcePulse project format
  exports.mapExternalProject = (externalProject) => {
    return {
      name: externalProject.name || externalProject.title,
      client: externalProject.client || externalProject.customerName,
      description: externalProject.description,
      startDate: formatDate(externalProject.startDate),
      endDate: formatDate(externalProject.endDate),
      status: mapStatus(externalProject.status)
    };
  };
  
  // Map external allocation to ResourcePulse allocation format
  exports.mapExternalAllocation = (externalAllocation, resourceMap, projectMap) => {
    // Find the corresponding ResourcePulse IDs
    const resourceId = resourceMap[externalAllocation.resourceExternalId];
    const projectId = projectMap[externalAllocation.projectExternalId];
    
    if (!resourceId || !projectId) {
      console.warn(`Could not map external allocation - Resource ID: ${resourceId}, Project ID: ${projectId}`);
      return null;
    }
    
    return {
      resourceId: resourceId,
      projectId: projectId,
      startDate: formatDate(externalAllocation.startDate),
      endDate: formatDate(externalAllocation.endDate),
      utilization: parseUtilization(externalAllocation.allocation)
    };
  };
  
  // Helper to format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Handle different date formats
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch (err) {
      console.warn(`Date parsing error: ${dateStr}`);
      return null;
    }
  };
  
  // Map external status to ResourcePulse status
  const mapStatus = (externalStatus) => {
    const statusMap = {
      'ACTIVE': 'Active',
      'COMPLETED': 'Completed',
      'ON_HOLD': 'On Hold',
      'CANCELED': 'Cancelled'
      // Add more mappings as needed
    };
    
    return statusMap[externalStatus] || 'Active'; // Default to 'Active'
  };
  
  // Parse utilization value
  const parseUtilization = (utilization) => {
    if (typeof utilization === 'number') {
      // Handle percentage format (0-1 or 0-100)
      if (utilization <= 1) {
        return Math.round(utilization * 100);
      }
      return Math.min(100, Math.max(1, Math.round(utilization)));
    }
    
    // Handle string format
    if (typeof utilization === 'string') {
      // Remove percentage sign if present
      const cleanedValue = utilization.replace('%', '').trim();
      return Math.min(100, Math.max(1, Math.round(parseFloat(cleanedValue) || 100)));
    }
    
    return 100; // Default to 100%
  };
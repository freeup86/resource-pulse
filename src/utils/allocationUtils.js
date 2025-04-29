// Calculate total utilization for a resource
export const calculateTotalUtilization = (resource) => {
    if (!resource) return 0;
    
    // Check allocations array first
    if (resource.allocations && resource.allocations.length > 0) {
      return resource.allocations.reduce((total, alloc) => 
        total + (alloc ? (alloc.utilization || 0) : 0), 0);
    }
    
    // Fall back to single allocation for backwards compatibility
    if (resource.allocation) {
      return resource.allocation.utilization || 0;
    }
    
    return 0;
  };
  
  // Check if a resource is fully allocated (100% or more)
  export const isFullyAllocated = (resource) => {
    return calculateTotalUtilization(resource) >= 100;
  };
  
  // Get all allocations for a resource
  export const getAllocations = (resource) => {
    if (!resource) return [];
    
    if (resource.allocations && resource.allocations.length > 0) {
      return resource.allocations.filter(Boolean);
    }
    
    if (resource.allocation) {
      return [resource.allocation];
    }
    
    return [];
  };
  
  // Check if a resource is allocated to any project
  export const isAllocated = (resource) => {
    return getAllocations(resource).length > 0;
  };
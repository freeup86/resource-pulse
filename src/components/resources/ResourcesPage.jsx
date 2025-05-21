import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TabNav from '../layout/TabNav';
import ResourcesList from './ResourcesList';
import ResourceForm from './ResourceForm';
import AdvancedSearchFilter from '../common/AdvancedSearchFilter';
import ErrorMessage from '../common/ErrorMessage';
import { useResources } from '../../contexts/ResourceContext';
import storageService from '../../services/storageService';

const ResourcesPage = () => {
  const { resources, error, clearError, loading, refreshResources } = useResources();
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState([
    {
      id: 'role',
      label: 'Role',
      type: 'select',
      value: '',
      options: []
    },
    {
      id: 'skills',
      label: 'Skills',
      type: 'text',
      value: '',
      placeholder: 'E.g. React, JavaScript'
    },
    {
      id: 'utilization',
      label: 'Utilization',
      type: 'range',
      value: { min: '', max: '' }
    }
  ]);
  const [savedSearches, setSavedSearches] = useState([]);
  
  // Load saved searches from local storage
  useEffect(() => {
    const searches = storageService.savedSearches.getSavedSearches();
    setSavedSearches(searches);
  }, []);
  
  // Extract unique roles for the role filter
  useEffect(() => {
    if (resources.length > 0) {
      const uniqueRoles = [...new Set(resources.map(r => r.role).filter(Boolean))];
      const roleOptions = uniqueRoles.map(role => ({ label: role, value: role }));
      
      setAdvancedFilters(prev => prev.map(filter => 
        filter.id === 'role' 
          ? { ...filter, options: roleOptions } 
          : filter
      ));
    }
  }, [resources]);
  
  // Check for filter in location state (for dashboard navigation)
  useEffect(() => {
    if (location.state?.filter === 'unallocated') {
      setStatusFilter('available');
    }
  }, [location.state]);
  
  const handleAddNew = () => {
    setSelectedResource(null);
    setShowForm(true);
  };
  
  const handleEdit = (resource) => {
    setSelectedResource(resource);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedResource(null);
  };
  
  const filterOptions = [
    { label: 'All', value: 'all', active: statusFilter === 'all' },
    { label: 'Available', value: 'available', active: statusFilter === 'available' },
    { label: 'Allocated', value: 'allocated', active: statusFilter === 'allocated' }
  ];
  
  // Handle advanced filter changes
  const handleAdvancedFilterChange = (filterId, value) => {
    setAdvancedFilters(prev => 
      prev.map(filter => 
        filter.id === filterId ? { ...filter, value } : filter
      )
    );
  };
  
  // Save current search
  const handleSaveSearch = (searchData) => {
    const newSearch = {
      ...searchData,
      entityType: 'resources',
      statusFilter
    };
    
    storageService.savedSearches.saveSearch(newSearch);
    setSavedSearches(storageService.savedSearches.getSavedSearches());
  };
  
  // Apply a saved search
  const handleApplySavedSearch = (search) => {
    setSearchTerm(search.query || '');
    setStatusFilter(search.statusFilter || 'all');
    
    // Apply advanced filters if available
    if (search.filters && Array.isArray(search.filters)) {
      setAdvancedFilters(prev => {
        return prev.map(filter => {
          const savedFilter = search.filters.find(f => f.id === filter.id);
          return savedFilter ? { ...filter, value: savedFilter.value } : filter;
        });
      });
    }
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAdvancedFilters(prev => 
      prev.map(filter => ({ ...filter, value: filter.type === 'range' ? { min: '', max: '' } : '' }))
    );
  };
  
  // Filter and search resources with advanced filtering
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      // Apply status filter
      if (statusFilter === 'available' && resource.allocation) return false;
      if (statusFilter === 'allocated' && !resource.allocation) return false;
      
      // Apply advanced filters
      
      // Role filter
      const roleFilter = advancedFilters.find(f => f.id === 'role');
      if (roleFilter?.value && resource.role !== roleFilter.value) {
        return false;
      }
      
      // Skills filter
      const skillsFilter = advancedFilters.find(f => f.id === 'skills');
      if (skillsFilter?.value) {
        const skillTerms = skillsFilter.value.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        if (skillTerms.length > 0) {
          const resourceHasSkills = skillTerms.some(term => {
            return resource.skills.some(skill => {
              const skillName = typeof skill === 'string' 
                ? skill.toLowerCase() 
                : (skill.name ? skill.name.toLowerCase() : '');
              return skillName.includes(term);
            });
          });
          if (!resourceHasSkills) return false;
        }
      }
      
      // Utilization filter
      const utilizationFilter = advancedFilters.find(f => f.id === 'utilization');
      if (utilizationFilter?.value) {
        const { min, max } = utilizationFilter.value;
        const utilization = resource.utilization || 0;
        
        if (min !== '' && utilization < parseInt(min)) return false;
        if (max !== '' && utilization > parseInt(max)) return false;
      }
      
      // Apply search filter
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          resource.name.toLowerCase().includes(searchTermLower) ||
          resource.role.toLowerCase().includes(searchTermLower) ||
          (resource.skills && Array.isArray(resource.skills) && resource.skills.some(skill =>
            typeof skill === 'string'
              ? skill.toLowerCase().includes(searchTermLower)
              : skill && typeof skill === 'object' && skill.name
                ? skill.name.toLowerCase().includes(searchTermLower)
                : false
          ))
        );
      }
      
      return true;
    });
  }, [resources, statusFilter, searchTerm, advancedFilters]);
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Resources Management</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Resource
        </button>
      </div>

      <TabNav />

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <AdvancedSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        onFilterChange={setStatusFilter}
        advancedFilters={advancedFilters}
        onAdvancedFilterChange={handleAdvancedFilterChange}
        savedSearches={savedSearches}
        onSaveSearch={handleSaveSearch}
        onApplySavedSearch={handleApplySavedSearch}
        onClearFilters={handleClearFilters}
      />

      <ResourcesList 
        onEdit={handleEdit} 
        resources={filteredResources} 
        refreshList={refreshResources}
      />

      {showForm && (
        <ResourceForm
          resource={selectedResource}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default ResourcesPage;
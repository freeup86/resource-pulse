import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TabNav from '../layout/TabNav';
import ResourcesList from './ResourcesList';
import ResourceForm from './ResourceForm';
import SearchFilter from '../common/SearchFilter';
import ErrorMessage from '../common/ErrorMessage';
import { useResources } from '../../contexts/ResourceContext';

const ResourcesPage = () => {
  const { resources, error, clearError, loading } = useResources();
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
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
  
  // Filter and search resources
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      // Apply status filter
      if (statusFilter === 'available' && resource.allocation) return false;
      if (statusFilter === 'allocated' && !resource.allocation) return false;
      
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
  }, [resources, statusFilter, searchTerm]);
  
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

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        onFilterChange={setStatusFilter}
      />

      <ResourcesList onEdit={handleEdit} resources={filteredResources} />

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
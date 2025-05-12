import React, { useState } from 'react';
import { useRoles } from '../../contexts/RoleContext';
import RolesList from './RolesList';
import RoleForm from './RoleForm';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const RolesPage = () => {
  const { roles, loading, error, clearError } = useRoles();
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const handleAddNew = () => {
    setSelectedRole(null);
    setShowForm(true);
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedRole(null);
  };

  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Role Management</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Role
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <RolesList roles={roles} onEdit={handleEdit} />

      {showForm && (
        <RoleForm
          role={selectedRole}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default RolesPage;
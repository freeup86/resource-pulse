import React, { useState } from 'react';
import { Trash, Tag, Users, Briefcase, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useResources } from '../../contexts/ResourceContext';
import ErrorModal from '../common/ErrorModal';

const BulkActionBar = ({ selectedResources, onClearSelection, refreshList }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSkillsForm, setShowSkillsForm] = useState(false);
  const [newSkills, setNewSkills] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { bulkDeleteResources, bulkAddSkills } = useResources();
  
  const selectedCount = selectedResources.length;
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!selectedCount) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedCount} selected resources?`)) {
      try {
        await bulkDeleteResources(selectedResources.map(r => r.id));
        onClearSelection();
        refreshList();
      } catch (err) {
        setErrorMessage(err.message || 'Failed to delete selected resources. Some may have active allocations.');
        setErrorModalOpen(true);
      }
    }
  };
  
  // Handle adding skills to multiple resources
  const handleBulkAddSkills = async () => {
    if (!selectedCount || !newSkills.trim()) return;
    
    try {
      // Parse skills from comma-separated string
      const skillsToAdd = newSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      if (skillsToAdd.length === 0) {
        setErrorMessage('Please enter at least one valid skill');
        setErrorModalOpen(true);
        return;
      }
      
      await bulkAddSkills(
        selectedResources.map(r => r.id),
        skillsToAdd
      );
      
      setNewSkills('');
      setShowSkillsForm(false);
      refreshList();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add skills to selected resources');
      setErrorModalOpen(true);
    }
  };
  
  // Don't render anything if no resources are selected
  if (selectedCount === 0) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-2xl">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-3 flex justify-between items-center">
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            <span className="font-medium">{selectedCount} resources selected</span>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="mr-2 text-white hover:text-blue-100"
              aria-label={isOpen ? "Hide bulk actions" : "Show bulk actions"}
            >
              {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
            
            <button 
              onClick={onClearSelection}
              className="text-white hover:text-blue-100"
              aria-label="Clear selection"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Collapsible bulk actions panel */}
        {isOpen && (
          <div className="bg-blue-700 p-3 border-t border-blue-500">
            <div className="flex flex-wrap gap-2">
              {/* Bulk Delete */}
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center"
              >
                <Trash className="h-4 w-4 mr-1" />
                <span>Delete Resources</span>
              </button>
              
              {/* Bulk Add Skills */}
              <button
                onClick={() => setShowSkillsForm(!showSkillsForm)}
                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center"
              >
                <Tag className="h-4 w-4 mr-1" />
                <span>Add Skills</span>
              </button>
              
              {/* Add more bulk actions here */}
            </div>
            
            {/* Add Skills Form */}
            {showSkillsForm && (
              <div className="mt-3 bg-blue-800 p-3 rounded">
                <div className="text-sm mb-2">Add skills to {selectedCount} resources (comma-separated):</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="React, TypeScript, Node.js, etc."
                    className="flex-grow p-2 rounded text-gray-800"
                  />
                  <button
                    onClick={handleBulkAddSkills}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Error Modal */}
      <ErrorModal
        show={errorModalOpen}
        title="Bulk Operation Error"
        message={errorMessage}
        onClose={() => setErrorModalOpen(false)}
      />
    </div>
  );
};

export default BulkActionBar;
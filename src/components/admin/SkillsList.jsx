import React, { useState } from 'react';
import { useSkills } from '../../contexts/SkillsContext';
import { Edit, Trash2, Users, Briefcase, Eye, EyeOff } from 'lucide-react';

const SkillsList = ({ skills, onEdit, loading }) => {
  const { deleteSkill } = useSkills();
  const [deletingSkill, setDeletingSkill] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (skill) => {
    setDeletingSkill(skill);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSkill) return;

    try {
      await deleteSkill(deletingSkill.id);
      setShowDeleteConfirm(false);
      setDeletingSkill(null);
    } catch (error) {
      console.error('Error deleting skill:', error);
      // You might want to show an error message here
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingSkill(null);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Technical': 'bg-blue-100 text-blue-800',
      'Business': 'bg-green-100 text-green-800',
      'Soft Skills': 'bg-purple-100 text-purple-800',
      'Design': 'bg-pink-100 text-pink-800',
      'Management': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6 text-center text-gray-500">
          Loading skills...
        </div>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6 text-center text-gray-500">
          <div className="mb-2">No skills found</div>
          <div className="text-sm">Try adjusting your search filters or add a new skill</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-3">Skill Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-1">Resources</div>
            <div className="col-span-1">Projects</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {skills.map((skill) => (
            <div key={skill.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Skill Name */}
                <div className="col-span-3">
                  <div className="font-medium text-gray-900">{skill.name}</div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  {skill.category ? (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(skill.category)}`}>
                      {skill.category}
                    </span>
                  ) : (
                    <span className="text-gray-400">No category</span>
                  )}
                </div>

                {/* Description */}
                <div className="col-span-3">
                  <div className="text-sm text-gray-600">
                    {skill.description ? (
                      skill.description.length > 100 ? 
                        `${skill.description.substring(0, 100)}...` : 
                        skill.description
                    ) : (
                      <span className="text-gray-400">No description</span>
                    )}
                  </div>
                </div>

                {/* Resource Count */}
                <div className="col-span-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {skill.resourceCount || 0}
                  </div>
                </div>

                {/* Project Count */}
                <div className="col-span-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {skill.projectCount || 0}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <div className="flex items-center">
                    {skill.isActive ? (
                      <Eye className="h-4 w-4 text-green-500" title="Active" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" title="Inactive" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(skill)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit skill"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(skill)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete skill"
                      disabled={skill.resourceCount > 0 || skill.projectCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Proficiency Distribution (if available) */}
              {skill.proficiencyDistribution && skill.proficiencyDistribution.length > 0 && (
                <div className="mt-2 col-span-12">
                  <div className="text-xs text-gray-500 mb-1">Proficiency Distribution:</div>
                  <div className="flex space-x-2">
                    {skill.proficiencyDistribution.map((dist, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {dist.level}: {dist.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Skill
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deletingSkill?.name}"? This action cannot be undone.
              </p>
              
              {(deletingSkill?.resourceCount > 0 || deletingSkill?.projectCount > 0) && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  <p className="text-sm">
                    This skill is currently used by {deletingSkill.resourceCount} resource(s) and {deletingSkill.projectCount} project(s). 
                    Deleting it may affect those records.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SkillsList;
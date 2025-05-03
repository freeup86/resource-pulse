import React, { useState, useEffect } from 'react';
import { useSkills } from '../../contexts/SkillsContext';

const SkillRecommendationForm = ({ onClose, skillId = null }) => {
  const { skills, addRecommendation } = useSkills();
  
  const [formData, setFormData] = useState({
    skillId: skillId || '',
    title: '',
    description: '',
    resourceUrl: '',
    estimatedTimeHours: '',
    cost: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Pre-select skill if skillId is provided
  useEffect(() => {
    if (skillId) {
      setFormData(prev => ({
        ...prev,
        skillId
      }));
    }
  }, [skillId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.skillId) newErrors.skillId = 'Skill is required';
    if (!formData.title) newErrors.title = 'Title is required';
    
    // Validate numeric fields
    if (formData.estimatedTimeHours && isNaN(Number(formData.estimatedTimeHours))) {
      newErrors.estimatedTimeHours = 'Must be a number';
    }
    
    if (formData.cost && isNaN(Number(formData.cost))) {
      newErrors.cost = 'Must be a number';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      estimatedTimeHours: formData.estimatedTimeHours ? Number(formData.estimatedTimeHours) : null,
      cost: formData.cost ? Number(formData.cost) : null
    };
    
    // Submit recommendation
    try {
      setLoading(true);
      await addRecommendation(submitData);
      setSuccess(true);
      
      // Reset form after short delay to show success message
      setTimeout(() => {
        if (skillId) {
          // If embedded in skill page, just close the form
          onClose();
        } else {
          // If standalone form, reset the form values
          setFormData({
            skillId: '',
            title: '',
            description: '',
            resourceUrl: '',
            estimatedTimeHours: '',
            cost: ''
          });
          setSuccess(false);
        }
      }, 1500);
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add recommendation' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Add Skill Development Recommendation</h2>
      
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Recommendation added successfully!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
            <select
              name="skillId"
              value={formData.skillId}
              onChange={handleChange}
              disabled={!!skillId}
              className={`w-full p-2 border rounded ${errors.skillId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select a skill</option>
              {skills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} {skill.category && `(${skill.category})`}
                </option>
              ))}
            </select>
            {errors.skillId && <p className="mt-1 text-sm text-red-600">{errors.skillId}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Complete AWS Developer Course"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Describe the learning resource and its benefits"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource URL</label>
            <input
              type="url"
              name="resourceUrl"
              value={formData.resourceUrl}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g., https://www.udemy.com/course/..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (hours)</label>
              <input
                type="text"
                name="estimatedTimeHours"
                value={formData.estimatedTimeHours}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.estimatedTimeHours ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., 20"
              />
              {errors.estimatedTimeHours && <p className="mt-1 text-sm text-red-600">{errors.estimatedTimeHours}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
              <input
                type="text"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.cost ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., 19.99"
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost}</p>}
            </div>
          </div>
          
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.submit}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Recommendation'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SkillRecommendationForm;
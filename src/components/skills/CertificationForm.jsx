import React, { useState, useEffect } from 'react';
import { useSkills } from '../../contexts/SkillsContext';
import { useResources } from '../../contexts/ResourceContext';

const CertificationForm = ({ onClose, resourceId = null }) => {
  const { skills, addCertification } = useSkills();
  const { resources } = useResources();
  
  const [formData, setFormData] = useState({
    resourceId: resourceId || '',
    skillId: '',
    certificationName: '',
    issueDate: '',
    expiryDate: '',
    issuer: '',
    certificationUrl: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Pre-select resource if resourceId is provided
  useEffect(() => {
    if (resourceId) {
      setFormData(prev => ({
        ...prev,
        resourceId
      }));
    }
  }, [resourceId]);
  
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
    if (!formData.resourceId) newErrors.resourceId = 'Resource is required';
    if (!formData.skillId) newErrors.skillId = 'Skill is required';
    if (!formData.certificationName) newErrors.certificationName = 'Certification name is required';
    
    if (formData.expiryDate && formData.issueDate && new Date(formData.expiryDate) < new Date(formData.issueDate)) {
      newErrors.expiryDate = 'Expiry date cannot be before issue date';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit certification
    try {
      setLoading(true);
      await addCertification(formData);
      setSuccess(true);
      
      // Reset form after short delay to show success message
      setTimeout(() => {
        if (resourceId) {
          // If embedded in resource page, just close the form
          onClose();
        } else {
          // If standalone form, reset the form values
          setFormData({
            resourceId: '',
            skillId: '',
            certificationName: '',
            issueDate: '',
            expiryDate: '',
            issuer: '',
            certificationUrl: '',
            notes: ''
          });
          setSuccess(false);
        }
      }, 1500);
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add certification' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Add Skill Certification</h2>
      
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Certification added successfully!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <select
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              disabled={!!resourceId}
              className={`w-full p-2 border rounded ${errors.resourceId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select a resource</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
            {errors.resourceId && <p className="mt-1 text-sm text-red-600">{errors.resourceId}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
            <select
              name="skillId"
              value={formData.skillId}
              onChange={handleChange}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
            <input
              type="text"
              name="certificationName"
              value={formData.certificationName}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.certificationName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., AWS Certified Developer"
            />
            {errors.certificationName && <p className="mt-1 text-sm text-red-600">{errors.certificationName}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.issueDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.issueDate && <p className="mt-1 text-sm text-red-600">{errors.issueDate}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
            <input
              type="text"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g., Amazon Web Services"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Certification URL</label>
            <input
              type="url"
              name="certificationUrl"
              value={formData.certificationUrl}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g., https://www.credly.com/badges/..."
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Any additional information about the certification"
            ></textarea>
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
              {loading ? 'Adding...' : 'Add Certification'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CertificationForm;
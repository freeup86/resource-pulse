import React, { useState, useEffect } from 'react';
import { useResources } from '../../contexts/ResourceContext';
import { useRoles } from '../../contexts/RoleContext';
import { useSkills } from '../../contexts/SkillsContext';

const ResourceForm = ({ resource = null, onClose }) => {
  const { addResource, updateResource } = useResources();
  const { roles, loading: rolesLoading } = useRoles();
  const { skills: availableSkills, proficiencyLevels, categories, loading: skillsLoading } = useSkills();
  
  const [formData, setFormData] = useState({
    name: '',
    roleId: '',
    email: '',
    phone: '',
    skills: [],
    skillInput: '',
    hourlyRate: '',
    billableRate: '',
    currency: 'USD'
  });
  const [errors, setErrors] = useState({});
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('');
  const [skillSearchResults, setSkillSearchResults] = useState([]);
  const [showSkillSearch, setShowSkillSearch] = useState(false);

  // If editing an existing resource, populate the form
  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        roleId: resource.roleId || '',
        email: resource.email || '',
        phone: resource.phone || '',
        skills: [...(resource.skills || []).map(skill => {
          // If skill is a string, convert to object
          if (typeof skill === 'string') {
            return { name: skill, proficiencyLevel: null };
          }
          return skill;
        })],
        skillInput: '',
        hourlyRate: resource.hourlyRate || '',
        billableRate: resource.billableRate || '',
        currency: resource.currency || 'USD'
      });
    }
  }, [resource]);

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

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      skillInput: value
    }));
    
    // Filter available skills based on input
    if (value.trim()) {
      const filteredSkills = availableSkills.filter(skill => 
        skill.name.toLowerCase().includes(value.toLowerCase())
      );
      setSkillSearchResults(filteredSkills.slice(0, 5));
      setShowSkillSearch(true);
    } else {
      setSkillSearchResults([]);
      setShowSkillSearch(false);
    }
  };

  const handleSelectSkill = (skill) => {
    setSelectedSkill(skill);
    setFormData(prev => ({
      ...prev,
      skillInput: skill.name
    }));
    setShowSkillSearch(false);
  };

  const handleAddSkill = () => {
    // Check if skill input is not empty
    if (!formData.skillInput.trim()) {
      return;
    }
    
    // Create skill object
    let skillToAdd;
    if (selectedSkill && selectedSkill.id) {
      // If a skill was selected from dropdown
      skillToAdd = {
        id: selectedSkill.id,
        name: selectedSkill.name,
        proficiencyLevel: selectedProficiency || null
      };
    } else {
      // If a new skill name was typed
      skillToAdd = {
        name: formData.skillInput.trim(),
        proficiencyLevel: selectedProficiency || null
      };
    }
    
    // Check if skill already exists
    const skillExists = formData.skills.some(skill => 
      skill.name.toLowerCase() === skillToAdd.name.toLowerCase()
    );
    
    if (skillExists) {
      setErrors(prev => ({
        ...prev,
        skillInput: 'This skill already exists'
      }));
      return;
    }
    
    // Add skill to form data
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, skillToAdd],
      skillInput: ''
    }));
    
    // Reset selected skill and proficiency
    setSelectedSkill('');
    setSelectedProficiency('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => 
        skill.name !== skillToRemove.name
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.roleId) newErrors.roleId = 'Role is required';
    if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create or update resource
    const resourceData = {
      name: formData.name,
      roleId: parseInt(formData.roleId),
      email: formData.email || null,
      phone: formData.phone || null,
      skills: formData.skills.map(skill => {
        // Pass the complete skill object with proficiency level
        return {
          name: skill.name,
          proficiencyLevel: skill.proficiencyLevel
        };
      }),
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
      billableRate: formData.billableRate ? parseFloat(formData.billableRate) : null,
      currency: formData.currency || 'USD'
    };
    
    if (resource) {
      updateResource({ ...resourceData, id: resource.id });
    } else {
      addResource(resourceData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">{resource ? 'Edit Resource' : 'Add New Resource'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter resource name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.roleId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select a role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.roleId && <p className="mt-1 text-sm text-red-600">{errors.roleId}</p>}
            {rolesLoading && <p className="mt-1 text-sm text-gray-500">Loading roles...</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter email address"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter phone number"
            />
          </div>
          
          {/* Financial Information Section */}
          <div className="mb-6 border-t pt-4 mt-4">
            <h3 className="text-md font-medium text-gray-800 mb-2">Financial Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Cost Rate</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 pl-7 border border-gray-300 rounded"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Internal cost rate per hour</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billable Rate</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="billableRate"
                    value={formData.billableRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 pl-7 border border-gray-300 rounded"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Rate charged to clients</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
              
              {formData.hourlyRate && formData.billableRate && (
                <div className="flex items-center">
                  <div className="p-2 bg-gray-50 rounded-lg w-full">
                    <p className="text-sm text-gray-700 mb-1">Markup</p>
                    <div className="text-lg font-bold text-gray-900">
                      {((parseFloat(formData.billableRate) / parseFloat(formData.hourlyRate) - 1) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <div className="flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  name="skillInput"
                  value={formData.skillInput}
                  onChange={handleSkillInputChange}
                  className={`w-full p-2 border rounded-l ${errors.skillInput ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Add a skill"
                  autoComplete="off"
                />
                {showSkillSearch && skillSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
                    {skillSearchResults.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelectSkill(skill)}
                      >
                        {skill.name} {skill.category && <span className="text-xs text-gray-500">({skill.category})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <select
                value={selectedProficiency}
                onChange={(e) => setSelectedProficiency(e.target.value)}
                className="p-2 border border-gray-300 border-l-0"
              >
                <option value="">Proficiency</option>
                {proficiencyLevels.map(level => (
                  <option key={level.id} value={level.name}>
                    {level.name}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {errors.skillInput && <p className="mt-1 text-sm text-red-600">{errors.skillInput}</p>}
            {errors.skills && <p className="mt-1 text-sm text-red-600">{errors.skills}</p>}
            {skillsLoading && <p className="mt-1 text-sm text-gray-500">Loading skills...</p>}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skills.map((skill, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center px-2 py-1 rounded-full text-sm
                    ${skill.proficiencyLevel === 'Beginner' ? 'bg-blue-100 text-blue-800' : 
                      skill.proficiencyLevel === 'Intermediate' ? 'bg-green-100 text-green-800' :
                      skill.proficiencyLevel === 'Advanced' ? 'bg-purple-100 text-purple-800' :
                      skill.proficiencyLevel === 'Expert' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'}`}
                >
                  {skill.name}
                  {skill.proficiencyLevel && (
                    <span className="ml-1 font-semibold">[{skill.proficiencyLevel.charAt(0)}]</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 text-gray-600 hover:text-gray-900 font-bold"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
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
            >
              {resource ? 'Update' : 'Add'} Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceForm;
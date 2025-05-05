import React, { useState } from 'react';

/**
 * Component for collecting user learning preferences for AI recommendations
 */
const LearningPreferencesForm = ({ onSubmit, onCancel, initialValues = {} }) => {
  const [preferences, setPreferences] = useState({
    experienceLevel: initialValues.experienceLevel || 'intermediate',
    preferredLearningStyle: initialValues.preferredLearningStyle || 'mixed',
    budget: initialValues.budget !== undefined ? initialValues.budget : '',
    timeAvailable: initialValues.timeAvailable !== undefined ? initialValues.timeAvailable : '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: name === 'budget' || name === 'timeAvailable' ? 
        (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(preferences);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Personalize Your Learning Recommendations</h2>
      
      <p className="text-sm text-gray-600 mb-6">
        Customize these preferences to get AI-generated skill recommendations that match your learning style, 
        experience level, and constraints.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Experience Level
          </label>
          <select
            name="experienceLevel"
            value={preferences.experienceLevel}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="beginner">Beginner - Just starting out</option>
            <option value="intermediate">Intermediate - Some experience</option>
            <option value="advanced">Advanced - Significant experience</option>
            <option value="expert">Expert - Deep expertise</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Learning Style
          </label>
          <select
            name="preferredLearningStyle"
            value={preferences.preferredLearningStyle}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="mixed">Balanced Mix of Resources</option>
            <option value="visual">Visual Learning (videos, diagrams)</option>
            <option value="reading">Reading-based Learning (books, documentation)</option>
            <option value="interactive">Interactive Learning (workshops, projects)</option>
            <option value="social">Social Learning (cohort courses, communities)</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Constraint (USD)
            </label>
            <input
              type="number"
              name="budget"
              value={preferences.budget}
              onChange={handleChange}
              placeholder="Maximum budget per skill"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank for no budget constraint
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Available (Hours)
            </label>
            <input
              type="number"
              name="timeAvailable"
              value={preferences.timeAvailable}
              onChange={handleChange}
              placeholder="Available hours per skill"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank for no time constraint
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate Personalized Recommendations
          </button>
        </div>
      </form>
    </div>
  );
};

export default LearningPreferencesForm;
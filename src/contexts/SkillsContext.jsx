import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as skillsService from '../services/skillsService';

const SkillsContext = createContext();

export const useSkills = () => {
  return useContext(SkillsContext);
};

export const SkillsProvider = ({ children }) => {
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [proficiencyLevels, setProficiencyLevels] = useState([]);
  const [gapAnalysis, setGapAnalysis] = useState([]);
  const [trainingRecommendations, setTrainingRecommendations] = useState([]);
  const [hiringRecommendations, setHiringRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all skills
  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      const data = await skillsService.getSkills();
      setSkills(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await skillsService.getSkillCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching skill categories:', err);
    }
  }, []);

  // Fetch proficiency levels
  const fetchProficiencyLevels = useCallback(async () => {
    try {
      const data = await skillsService.getSkillProficiencyLevels();
      setProficiencyLevels(data);
    } catch (err) {
      console.error('Error fetching skill proficiency levels:', err);
    }
  }, []);

  // Fetch gap analysis
  const fetchGapAnalysis = useCallback(async () => {
    try {
      const data = await skillsService.getSkillsGapAnalysis();
      setGapAnalysis(data);
      return data; // Return the data for components to use directly
    } catch (err) {
      console.error('Error fetching skills gap analysis:', err);
      throw err; // Rethrow to allow components to catch errors
    }
  }, []);
  
  // Fetch training recommendations
  const fetchTrainingRecommendations = useCallback(async (params = {}) => {
    try {
      const data = await skillsService.getTrainingRecommendations(params);
      setTrainingRecommendations(data);
      return data;
    } catch (err) {
      console.error('Error fetching training recommendations:', err);
    }
  }, []);
  
  // Fetch hiring recommendations
  const fetchHiringRecommendations = useCallback(async (params = {}) => {
    try {
      const data = await skillsService.getHiringRecommendations(params);
      setHiringRecommendations(data);
      return data;
    } catch (err) {
      console.error('Error fetching hiring recommendations:', err);
    }
  }, []);

  // Add a new skill
  const addSkill = useCallback(async (skillData) => {
    try {
      const newSkill = await skillsService.createSkill(skillData);
      setSkills(prevSkills => [...prevSkills, newSkill]);
      return newSkill;
    } catch (err) {
      console.error('Error adding skill:', err);
      throw err;
    }
  }, []);

  // Update a skill
  const updateSkill = useCallback(async (id, skillData) => {
    try {
      const updatedSkill = await skillsService.updateSkill(id, skillData);
      setSkills(prevSkills => 
        prevSkills.map(skill => 
          skill.id === updatedSkill.id ? updatedSkill : skill
        )
      );
      return updatedSkill;
    } catch (err) {
      console.error('Error updating skill:', err);
      throw err;
    }
  }, []);

  // Delete a skill
  const deleteSkill = useCallback(async (id) => {
    try {
      await skillsService.deleteSkill(id);
      setSkills(prevSkills => prevSkills.filter(skill => skill.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting skill:', err);
      throw err;
    }
  }, []);

  // Add a certification
  const addCertification = useCallback(async (certificationData) => {
    try {
      const newCertification = await skillsService.createSkillCertification(certificationData);
      return newCertification;
    } catch (err) {
      console.error('Error adding certification:', err);
      throw err;
    }
  }, []);

  // Add a recommendation
  const addRecommendation = useCallback(async (recommendationData) => {
    try {
      const newRecommendation = await skillsService.createSkillRecommendation(recommendationData);
      return newRecommendation;
    } catch (err) {
      console.error('Error adding recommendation:', err);
      throw err;
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchSkills();
    fetchCategories();
    fetchProficiencyLevels();
    // Gap analysis is fetched on demand, not initially
  }, [fetchSkills, fetchCategories, fetchProficiencyLevels]);

  const value = {
    skills,
    categories,
    proficiencyLevels,
    gapAnalysis,
    trainingRecommendations,
    hiringRecommendations,
    loading,
    error,
    fetchSkills,
    fetchGapAnalysis,
    fetchTrainingRecommendations,
    fetchHiringRecommendations,
    addSkill,
    updateSkill,
    deleteSkill,
    addCertification,
    addRecommendation
  };

  return (
    <SkillsContext.Provider value={value}>
      {children}
    </SkillsContext.Provider>
  );
};

export default SkillsContext;
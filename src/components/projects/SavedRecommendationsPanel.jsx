import React, { useState, useEffect } from 'react';
import { getProjectRecommendations, deleteRecommendation } from '../../services/aiRecommendationService';
import AiRecommendationDisplay from './AiRecommendationDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Component for displaying and managing saved skill recommendations for a project
 */
const SavedRecommendationsPanel = ({ projectId, projectName, recommendations: propRecommendations, refreshTrigger, onRecommendationDeleted }) => {
  const [recommendations, setRecommendations] = useState(propRecommendations || []);
  const [loading, setLoading] = useState(!propRecommendations);
  const [error, setError] = useState(null);

  // Update recommendations when prop changes
  useEffect(() => {
    if (propRecommendations) {
      console.log('SavedRecommendationsPanel received new recommendations:', propRecommendations);
      setRecommendations(propRecommendations);
      setLoading(false);
    }
  }, [propRecommendations, refreshTrigger]);

  // Fetch saved recommendations when component mounts or projectId changes (only if no prop recommendations)
  useEffect(() => {
    if (projectId && !propRecommendations) {
      fetchRecommendations();
    }
  }, [projectId]);

  // Function to fetch saved recommendations
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getProjectRecommendations(projectId);
      setRecommendations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching saved recommendations:', err);
      setError('Failed to load saved recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Handle recommendation deletion
  const handleDelete = async (recommendationId) => {
    try {
      setLoading(true);
      await deleteRecommendation(recommendationId);

      // Remove the deleted recommendation from the state
      setRecommendations(prevRecs =>
        prevRecs.filter(rec => rec.id !== recommendationId)
      );

      // Notify parent component if needed
      if (onRecommendationDeleted) {
        onRecommendationDeleted(recommendationId);
      }

    } catch (err) {
      console.error('Error deleting recommendation:', err);
      setError('Failed to delete recommendation');
    } finally {
      setLoading(false);
    }
  };

  // If there are no recommendations, don't render anything
  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
        </div>
      ) : (
        <div>
          {recommendations.length > 0 ? (
            <AiRecommendationDisplay
              recommendations={recommendations}
              projectName={projectName}
              onSave={(rec) => {
                // For saved recommendations, don't do anything on save
                console.log('Save clicked on already saved recommendation:', rec);
                return Promise.resolve();
              }}
              onCancel={() => {
                // No cancel action needed for saved recommendations
                console.log('Close clicked on saved recommendations panel');
              }}
              onDelete={handleDelete}
              showDelete={true}
            />
          ) : (
            <p className="text-gray-500 text-center p-4">
              No saved recommendations yet. Generate AI recommendations to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedRecommendationsPanel;
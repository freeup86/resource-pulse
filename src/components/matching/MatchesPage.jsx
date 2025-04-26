import React, { useState, useEffect } from 'react';
import TabNav from '../layout/TabNav';
import MatchList from './MatchList';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import * as allocationService from '../../services/allocationService';

const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const data = await allocationService.getResourceMatches();
        setMatches(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch skill matches');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Skill Matches</h2>
      <TabNav />
      <MatchList matches={matches} />
    </div>
  );
};

export default MatchesPage;
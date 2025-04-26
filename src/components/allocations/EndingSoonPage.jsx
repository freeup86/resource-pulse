import React, { useState, useEffect } from 'react';
import TabNav from '../layout/TabNav';
import EndingSoonList from './EndingSoonList';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import * as allocationService from '../../services/allocationService';

const EndingSoonPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEndingSoon = async () => {
      try {
        setLoading(true);
        const data = await allocationService.getResourcesEndingSoon(14); // 14 days threshold
        setResources(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch resources ending soon');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEndingSoon();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Assignments Ending Soon</h2>
      <TabNav />
      <EndingSoonList resources={resources} />
    </div>
  );
};

export default EndingSoonPage;
import React, { useEffect, useState } from 'react';
import debugProfileFetch from '../debug-profile-fetch';

const DebugProfilePage = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDebug = async () => {
      try {
        setLoading(true);
        const debugResult = await debugProfileFetch();
        setResult(debugResult);
      } catch (err) {
        console.error('Error in debug component:', err);
        setError(err.message || 'An error occurred during debugging');
      } finally {
        setLoading(false);
      }
    };

    runDebug();
  }, []);

  if (loading) {
    return <div>Loading debug results...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Debug Profile Results</h2>
      {result ? (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      ) : (
        <p>No results available. Check the console for debug output.</p>
      )}
    </div>
  );
};

export default DebugProfilePage;
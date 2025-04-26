import React from 'react';
import TabNav from '../layout/TabNav';
import AllocationsList from './AllocationsList';
import UnallocatedResources from './UnallocatedResources';

const AllocationsPage = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Resource Allocations</h2>
      <TabNav />
      <div className="space-y-6">
        <AllocationsList />
        <UnallocatedResources />
      </div>
    </div>
  );
};

export default AllocationsPage;
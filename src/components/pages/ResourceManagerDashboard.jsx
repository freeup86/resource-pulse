import React from 'react';
import RequestList from '../requests/RequestList';
import CapacityHeatmap from '../resources/CapacityHeatmap';

const ResourceManagerDashboard = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Resource Manager Dashboard</h1>
                <p className="text-gray-600">Manage resource requests and allocations.</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Incoming Resource Requests</h2>
                <RequestList isResourceManager={true} />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <CapacityHeatmap />
            </div>
        </div>
    );
};

export default ResourceManagerDashboard;

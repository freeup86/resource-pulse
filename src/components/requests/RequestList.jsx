import React, { useState, useEffect } from 'react';
import { getRequests, updateRequestStatus } from '../../services/workflowService';
import { formatDate } from '../../utils/dateUtils';

const RequestList = ({ projectId, isResourceManager }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, [projectId]);

    const loadRequests = async () => {
        try {
            const response = await getRequests(projectId);
            setRequests(response.data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateRequestStatus(id, newStatus);
            loadRequests();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) return <div>Loading requests...</div>;

    return (
        <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Requests</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            {isResourceManager && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map(req => (
                            <tr key={req.RequestID}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {/* TODO: Map RoleID to Name if not joined in backend, but backend query joins it? No, backend joins Project but not Role yet. */}
                                    Role #{req.RoleID}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.Count}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(req.StartDate)} - {formatDate(req.EndDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${req.Status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            req.Status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {req.Status}
                                    </span>
                                </td>
                                {isResourceManager && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {req.Status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(req.RequestID, 'Approved')}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(req.RequestID, 'Rejected')}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RequestList;

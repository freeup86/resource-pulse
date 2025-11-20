import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../services/auditService';
import { formatDate } from '../../utils/dateUtils';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entityName: '',
        action: '',
        limit: 50
    });

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const response = await getAuditLogs(filters);
            setLogs(response.data);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        loadLogs();
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Audit Logs</h2>

            <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Entity</label>
                    <input
                        type="text"
                        name="entityName"
                        placeholder="e.g. Project"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        value={filters.entityName}
                        onChange={handleFilterChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Action</label>
                    <select
                        name="action"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        value={filters.action}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Actions</option>
                        <option value="POST">Create (POST)</option>
                        <option value="PUT">Update (PUT)</option>
                        <option value="PATCH">Update (PATCH)</option>
                        <option value="DELETE">Delete (DELETE)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Limit</label>
                    <select
                        name="limit"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        value={filters.limit}
                        onChange={handleFilterChange}
                    >
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="500">500</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Filter Logs
                    </button>
                </div>
            </form>

            {loading ? (
                <div>Loading logs...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map(log => (
                                <tr key={log.LogID}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(log.ChangeDate).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {log.ChangedBy}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.Action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                log.Action === 'POST' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {log.Action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {log.EntityName} #{log.EntityID}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.NewValues}>
                                        {log.NewValues}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No logs found matching criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditLogViewer;

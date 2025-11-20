import React, { useState, useEffect } from 'react';
import { financialService } from '../../services/financialService';

const FinancialSnapshots = ({ projectId, currency = 'USD' }) => {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newSnapshot, setNewSnapshot] = useState({
        name: '',
        notes: ''
    });

    useEffect(() => {
        loadSnapshots();
    }, [projectId]);

    const loadSnapshots = async () => {
        try {
            setLoading(true);
            const data = await financialService.getSnapshots(projectId);
            setSnapshots(data);
        } catch (err) {
            console.error('Error loading snapshots:', err);
            setError('Failed to load snapshots');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSnapshot = async (e) => {
        e.preventDefault();
        try {
            await financialService.createSnapshot(projectId, newSnapshot);
            setShowModal(false);
            setNewSnapshot({ name: '', notes: '' });
            loadSnapshots();
        } catch (err) {
            console.error('Error creating snapshot:', err);
            setError('Failed to create snapshot');
        }
    };

    if (loading) return <div className="p-4">Loading snapshots...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Financial Snapshots</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                    Capture Snapshot
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Snapshot Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Budget</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {snapshots.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No snapshots recorded</td>
                            </tr>
                        ) : (
                            snapshots.map((snapshot) => (
                                <tr key={snapshot.SnapshotID}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{snapshot.SnapshotName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {new Date(snapshot.SnapshotDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(snapshot.PlannedBudget)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(snapshot.ActualCost)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{snapshot.Notes}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Capture Financial Snapshot</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            This will record the current state of the project's budget and actual costs for historical comparison.
                        </p>
                        <form onSubmit={handleCreateSnapshot}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Snapshot Name</label>
                                <input
                                    type="text"
                                    value={newSnapshot.name}
                                    onChange={(e) => setNewSnapshot({ ...newSnapshot, name: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="e.g., Q1 Baseline, Month End Close"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={newSnapshot.notes}
                                    onChange={(e) => setNewSnapshot({ ...newSnapshot, notes: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Save Snapshot
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialSnapshots;

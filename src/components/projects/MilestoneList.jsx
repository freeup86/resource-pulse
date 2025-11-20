import React, { useState, useEffect } from 'react';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '../../services/workflowService';
import { formatDate } from '../../utils/dateUtils';

const MilestoneList = ({ projectId, canEdit }) => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', dueDate: '', description: '' });

    useEffect(() => {
        loadMilestones();
    }, [projectId]);

    const loadMilestones = async () => {
        try {
            const response = await getMilestones(projectId);
            setMilestones(response.data);
        } catch (error) {
            console.error('Error loading milestones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createMilestone(projectId, formData);
            setShowForm(false);
            setFormData({ name: '', dueDate: '', description: '' });
            loadMilestones();
        } catch (error) {
            console.error('Error creating milestone:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this milestone?')) {
            try {
                await deleteMilestone(projectId, id);
                loadMilestones();
            } catch (error) {
                console.error('Error deleting milestone:', error);
            }
        }
    };

    if (loading) return <div>Loading milestones...</div>;

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Project Milestones</h3>
                {canEdit && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                        {showForm ? 'Cancel' : 'Add Milestone'}
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input
                                type="date"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Save Milestone
                    </button>
                </form>
            )}

            <div className="space-y-3">
                {milestones.length === 0 ? (
                    <p className="text-gray-500 italic">No milestones defined.</p>
                ) : (
                    milestones.map(milestone => (
                        <div key={milestone.MilestoneID} className="border rounded-lg p-4 flex justify-between items-center bg-white shadow-sm">
                            <div>
                                <h4 className="font-medium text-gray-900">{milestone.Name}</h4>
                                <p className="text-sm text-gray-500">{milestone.Description}</p>
                                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                                    Due: {formatDate(milestone.DueDate)}
                                </span>
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => handleDelete(milestone.MilestoneID)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MilestoneList;

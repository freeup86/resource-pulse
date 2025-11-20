import React, { useState, useEffect } from 'react';
import { getRAIDItems, createRAIDItem, updateRAIDItem, deleteRAIDItem } from '../../services/advancedService';
import { formatDate } from '../../utils/dateUtils';

const RAIDLog = ({ projectId, canEdit }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Risk'); // Risk, Assumption, Issue, Dependency
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        impact: 'Medium',
        probability: 'Medium',
        owner: '',
        dueDate: ''
    });

    useEffect(() => {
        loadItems();
    }, [projectId, activeTab]);

    const loadItems = async () => {
        try {
            const response = await getRAIDItems(projectId, activeTab);
            setItems(response.data);
        } catch (error) {
            console.error('Error loading RAID items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                type: activeTab, // Use activeTab for the type
                description: formData.description,
                impact: formData.impact,
                probability: formData.probability,
                status: formData.status,
                owner: formData.owner
            };

            // Only include dueDate if it has a value
            if (formData.dueDate) {
                payload.dueDate = formData.dueDate;
            }

            await createRAIDItem(projectId, payload);
            setShowForm(false);
            setFormData({
                description: '',
                impact: 'Medium',
                probability: 'Medium',
                status: 'Open',
                owner: '',
                dueDate: ''
            });
            loadItems();
        } catch (error) {
            console.error('Error creating RAID item:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this item?')) {
            try {
                await deleteRAIDItem(projectId, id);
                loadItems();
            } catch (error) {
                console.error('Error deleting item:', error);
            }
        }
    };

    const tabs = ['Risk', 'Assumption', 'Issue', 'Dependency'];

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">RAID Log</h3>
                {canEdit && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                        {showForm ? 'Cancel' : `Add ${activeTab}`}
                    </button>
                )}
            </div>

            <div className="flex space-x-4 border-b mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-4 ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab}s
                    </button>
                ))}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 border">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Impact</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.impact}
                                onChange={e => setFormData({ ...formData, impact: e.target.value })}
                            >
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                        </div>
                        {activeTab === 'Risk' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Probability</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                    value={formData.probability}
                                    onChange={e => setFormData({ ...formData, probability: e.target.value })}
                                >
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Owner</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.owner}
                                onChange={e => setFormData({ ...formData, owner: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Save {activeTab}
                    </button>
                </form>
            )}

            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-gray-500 italic">No {activeTab.toLowerCase()}s recorded.</p>
                ) : (
                    items.map(item => (
                        <div key={item.RAIDID} className="border rounded-lg p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-900">{item.Description}</p>
                                    <div className="flex space-x-3 mt-2 text-sm text-gray-500">
                                        <span>Impact: <span className={`font-semibold ${item.Impact === 'High' ? 'text-red-600' : ''}`}>{item.Impact}</span></span>
                                        {item.Type === 'Risk' && <span>Prob: {item.Probability}</span>}
                                        <span>Owner: {item.Owner || 'Unassigned'}</span>
                                        {item.DueDate && <span>Due: {formatDate(item.DueDate)}</span>}
                                    </div>
                                </div>
                                {canEdit && (
                                    <button onClick={() => handleDelete(item.RAIDID)} className="text-red-600 hover:text-red-800 text-sm">
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RAIDLog;

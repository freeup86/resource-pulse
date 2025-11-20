import React, { useState, useEffect } from 'react';
import { getFinancialPhasing, upsertFinancialPhasing } from '../../services/advancedService';
import { formatDate } from '../../utils/dateUtils';

const FinancialPhasing = ({ projectId, canEdit }) => {
    const [phasing, setPhasing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState([]);

    useEffect(() => {
        loadPhasing();
    }, [projectId]);

    const loadPhasing = async () => {
        try {
            const response = await getFinancialPhasing(projectId);
            setPhasing(response.data);
            // Initialize form data with existing data or defaults for next 12 months
            // Simplified for now: just load existing
            setFormData(response.data);
        } catch (error) {
            console.error('Error loading phasing:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Don't save if there's no data
            if (formData.length === 0) {
                alert('Please add some phasing data first');
                return;
            }

            // Transform formData to match backend expectations
            const items = formData.map(item => ({
                period: item.Period || item.period,
                amount: parseFloat(item.Amount || item.amount || 0),
                type: item.Type || item.type || 'Budget',
                category: item.Category || item.category || 'Labor'
            }));

            console.log('Sending phasing data:', { items });
            await upsertFinancialPhasing(projectId, { items });
            setEditMode(false);
            loadPhasing();
        } catch (error) {
            console.error('Error saving phasing:', error);
            console.error('Error response:', error.response?.data);
            alert('Error saving phasing data. Please try again.');
        }
    };

    const handleAmountChange = (index, amount) => {
        const newFormData = [...formData];
        // Use lowercase to match generateMonths format
        newFormData[index] = {
            ...newFormData[index],
            amount: parseFloat(amount),
            Amount: parseFloat(amount) // Keep both for compatibility
        };
        setFormData(newFormData);
    };

    // Helper to generate months if empty (simplified)
    const generateMonths = () => {
        if (formData.length > 0) return;
        const months = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
            months.push({
                period: d.toISOString().split('T')[0],
                Period: d.toISOString().split('T')[0], // Add uppercase for compatibility
                amount: 0,
                Amount: 0,
                type: 'Budget',
                Type: 'Budget',
                category: 'Labor',
                Category: 'Labor'
            });
        }
        setFormData(months);
    };

    if (loading) return <div>Loading financials...</div>;

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Financial Phasing (Budget)</h3>
                {canEdit && (
                    <div>
                        {editMode ? (
                            <>
                                <button onClick={() => setEditMode(false)} className="mr-2 text-gray-600">Cancel</button>
                                <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                            </>
                        ) : (
                            <button
                                onClick={() => { setEditMode(true); if (phasing.length === 0) generateMonths(); }}
                                className="bg-blue-600 text-white px-3 py-1 rounded"
                            >
                                Edit Phasing
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {(editMode ? formData : phasing).map((item, idx) => (
                            <tr key={idx}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(item.Period || item.period)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {editMode ? (
                                        <input
                                            type="number"
                                            value={(item.Amount || item.amount) || 0}
                                            onChange={(e) => handleAmountChange(idx, e.target.value)}
                                            className="border rounded p-1 w-32"
                                        />
                                    ) : (
                                        `$${((item.Amount || item.amount) || 0).toLocaleString()}`
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.Type || item.type}
                                </td>
                            </tr>
                        ))}
                        {phasing.length === 0 && !editMode && (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No phasing data available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinancialPhasing;

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CapacityHeatmap = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('utilization'); // utilization, availability

    useEffect(() => {
        loadForecast();
    }, [startDate]);

    const loadForecast = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/allocations/capacity/forecast?startDate=${startDate}`);
            setData(response.data);
        } catch (err) {
            console.error('Error loading forecast:', err);
            setError('Failed to load capacity forecast');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4">Loading capacity forecast...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;
    if (!data) return null;

    // Helper to generate weeks
    const getWeeks = () => {
        const weeks = [];
        const start = new Date(data.range.start);
        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(start);
            weekStart.setDate(start.getDate() + (i * 7));
            weeks.push(weekStart);
        }
        return weeks;
    };

    const weeks = getWeeks();

    // Helper to calculate utilization for a resource in a specific week
    const calculateMetric = (resource, weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const allocations = data.allocations.filter(a =>
            a.ResourceID === resource.ResourceID &&
            new Date(a.StartDate) <= weekEnd &&
            new Date(a.EndDate) >= weekStart
        );

        const totalUtilization = allocations.reduce((sum, a) => sum + a.Utilization, 0);

        if (viewMode === 'utilization') {
            return totalUtilization;
        } else {
            // Availability = Capacity - (Utilization/100 * Capacity)
            // Simplified: Capacity * (1 - Utilization/100)
            const capacity = resource.CapacityHoursPerWeek || 40;
            const usedHours = capacity * (totalUtilization / 100);
            return Math.round(capacity - usedHours);
        }
    };

    const getCellColor = (value) => {
        if (viewMode === 'utilization') {
            if (value > 100) return 'bg-red-100 text-red-800';
            if (value >= 80) return 'bg-yellow-100 text-yellow-800';
            if (value > 0) return 'bg-green-100 text-green-800';
            return 'bg-gray-50 text-gray-400';
        } else {
            // Availability
            if (value < 0) return 'bg-red-100 text-red-800';
            if (value < 8) return 'bg-yellow-100 text-yellow-800'; // Less than 1 day available
            return 'bg-green-100 text-green-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mt-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Capacity Planning</h2>
                <div className="flex gap-4">
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="border rounded p-2"
                    >
                        <option value="utilization">Utilization %</option>
                        <option value="availability">Availability (Hours)</option>
                    </select>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded p-2"
                    />
                </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                            Resource
                        </th>
                        {weeks.map((week, i) => (
                            <th key={i} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                {week.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.resources.map(resource => (
                        <tr key={resource.ResourceID}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-white z-10 border-r">
                                {resource.Name}
                                <div className="text-xs text-gray-500 font-normal">{resource.Role}</div>
                            </td>
                            {weeks.map((week, i) => {
                                const value = calculateMetric(resource, week);
                                return (
                                    <td key={i} className={`px-2 py-4 text-center text-sm font-medium ${getCellColor(value)} border`}>
                                        {value}{viewMode === 'utilization' ? '%' : ''}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CapacityHeatmap;

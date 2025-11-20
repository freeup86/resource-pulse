import React, { useState, useEffect } from 'react';
import { financialService } from '../../services/financialService';

const CurrencySettings = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        sourceCurrency: 'EUR',
        rate: '',
        effectiveDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadRates();
    }, []);

    const loadRates = async () => {
        try {
            setLoading(true);
            const data = await financialService.getExchangeRates();
            setRates(data);
        } catch (err) {
            console.error('Error loading rates:', err);
            setError('Failed to load exchange rates');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await financialService.saveExchangeRate(formData);
            loadRates();
            setFormData(prev => ({ ...prev, rate: '' }));
        } catch (err) {
            console.error('Error saving rate:', err);
            setError('Failed to save exchange rate');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Currency Exchange Rates</h2>

            <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Add / Update Rate</h3>
                <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                        <select
                            value={formData.sourceCurrency}
                            onChange={(e) => setFormData({ ...formData, sourceCurrency: e.target.value })}
                            className="p-2 border rounded w-32"
                        >
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="CAD">CAD (C$)</option>
                            <option value="AUD">AUD (A$)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Rate (to USD)</label>
                        <input
                            type="number"
                            step="0.000001"
                            value={formData.rate}
                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                            className="p-2 border rounded w-32"
                            placeholder="1.000000"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Effective Date</label>
                        <input
                            type="date"
                            value={formData.effectiveDate}
                            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                            className="p-2 border rounded"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Save Rate
                    </button>
                </form>
            </div>

            {loading ? (
                <p>Loading rates...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rates.map((rate) => (
                                <tr key={rate.RateID}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{rate.SourceCurrency}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{rate.TargetCurrency}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono">{rate.Rate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {new Date(rate.EffectiveDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CurrencySettings;

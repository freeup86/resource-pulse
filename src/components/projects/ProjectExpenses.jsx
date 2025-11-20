import React, { useState, useEffect } from 'react';
import { financialService } from '../../services/financialService';

const ProjectExpenses = ({ projectId, currency = 'USD' }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        category: 'Software',
        description: '',
        plannedAmount: '',
        actualAmount: ''
    });

    useEffect(() => {
        loadExpenses();
    }, [projectId]);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const data = await financialService.getExpenses(projectId);
            setExpenses(data);
            setError(null);
        } catch (err) {
            console.error('Error loading expenses:', err);
            setError('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await financialService.createExpense(projectId, newExpense);
            setShowAddModal(false);
            setNewExpense({
                category: 'Software',
                description: '',
                plannedAmount: '',
                actualAmount: ''
            });
            loadExpenses();
        } catch (err) {
            console.error('Error adding expense:', err);
            setError('Failed to add expense');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await financialService.deleteExpense(projectId, id);
            loadExpenses();
        } catch (err) {
            console.error('Error deleting expense:', err);
            setError('Failed to delete expense');
        }
    };

    const totalPlanned = expenses.reduce((sum, item) => sum + (item.PlannedAmount || 0), 0);
    const totalActual = expenses.reduce((sum, item) => sum + (item.ActualAmount || 0), 0);

    if (loading) return <div className="p-4">Loading expenses...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Project Expenses (Non-Labor)</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Add Expense
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Total Planned Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalPlanned)}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Total Actual Expenses</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalActual)}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Variance</p>
                    <p className={`text-2xl font-bold ${totalPlanned - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalPlanned - totalActual)}
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No expenses recorded</td>
                            </tr>
                        ) : (
                            expenses.map((expense) => (
                                <tr key={expense.BudgetItemID}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.Category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.Description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(expense.PlannedAmount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(expense.ActualAmount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDeleteExpense(expense.BudgetItemID)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Add New Expense</h3>
                        <form onSubmit={handleAddExpense}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="Software">Software License</option>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Travel">Travel & Expenses</option>
                                    <option value="Training">Training</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Planned Amount</label>
                                    <input
                                        type="number"
                                        value={newExpense.plannedAmount}
                                        onChange={(e) => setNewExpense({ ...newExpense, plannedAmount: e.target.value })}
                                        className="w-full p-2 border rounded"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Amount</label>
                                    <input
                                        type="number"
                                        value={newExpense.actualAmount}
                                        onChange={(e) => setNewExpense({ ...newExpense, actualAmount: e.target.value })}
                                        className="w-full p-2 border rounded"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectExpenses;

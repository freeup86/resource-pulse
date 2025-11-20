import api from './api';

export const financialService = {
    // Financial Phasing
    getPhasing: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/financials`);
        return response.data;
    },

    savePhasing: async (projectId, phasingData) => {
        const response = await api.post(`/projects/${projectId}/financials`, phasingData);
        return response.data;
    },

    // Expenses
    getExpenses: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/financials/expenses`);
        return response.data;
    },

    createExpense: async (projectId, expenseData) => {
        const response = await api.post(`/projects/${projectId}/financials/expenses`, expenseData);
        return response.data;
    },

    deleteExpense: async (projectId, expenseId) => {
        const response = await api.delete(`/projects/${projectId}/financials/expenses/${expenseId}`);
        return response.data;
    },

    // Snapshots
    getSnapshots: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/financials/snapshots`);
        return response.data;
    },

    createSnapshot: async (projectId, snapshotData) => {
        const response = await api.post(`/projects/${projectId}/financials/snapshots`, snapshotData);
        return response.data;
    },

    // Currency
    getExchangeRates: async () => {
        const response = await api.get('/currency');
        return response.data;
    },

    saveExchangeRate: async (rateData) => {
        const response = await api.post('/currency', rateData);
        return response.data;
    }
};

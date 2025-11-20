import api from './api';

// Financial Phasing
export const getFinancialPhasing = (projectId) => api.get(`/projects/${projectId}/financials/phasing`);

export const upsertFinancialPhasing = (projectId, data) => {
    console.log('Service sending:', data);
    return api.post(`/projects/${projectId}/financials/phasing`, data);
};

// RAID Log
export const getRAIDItems = async (projectId, type = null) => {
    const params = {};
    if (type) params.type = type;
    return api.get(`/projects/${projectId}/raid`, { params });
};

export const createRAIDItem = async (projectId, data) => {
    return api.post(`/projects/${projectId}/raid`, data);
};

export const updateRAIDItem = async (projectId, itemId, data) => {
    return api.patch(`/projects/${projectId}/raid/${itemId}`, data);
};

export const deleteRAIDItem = async (projectId, itemId) => {
    return api.delete(`/projects/${projectId}/raid/${itemId}`);
};

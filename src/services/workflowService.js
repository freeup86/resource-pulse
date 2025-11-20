import api from './api';

// Resource Requests
export const getRequests = async (projectId = null, status = null) => {
    const params = {};
    if (projectId) params.projectId = projectId;
    if (status) params.status = status;
    return api.get('/requests', { params });
};

export const createRequest = async (data) => {
    return api.post('/requests', data);
};

export const updateRequestStatus = async (id, status) => {
    return api.patch(`/requests/${id}/status`, { status });
};

// Project Milestones
export const getMilestones = async (projectId) => {
    return api.get(`/projects/${projectId}/milestones`);
};

export const createMilestone = async (projectId, data) => {
    return api.post(`/projects/${projectId}/milestones`, data);
};

export const updateMilestone = async (projectId, milestoneId, data) => {
    return api.patch(`/projects/${projectId}/milestones/${milestoneId}`, data);
};

export const deleteMilestone = async (projectId, milestoneId) => {
    return api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
};

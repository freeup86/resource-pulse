import api from './api';

export const getAuditLogs = async (params) => {
    return api.get('/audit', { params });
};

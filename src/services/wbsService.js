import api from './api';

export const wbsService = {
    // Phases
    getPhases: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/wbs/phases`);
        return response.data;
    },

    createPhase: async (projectId, phaseData) => {
        const response = await api.post(`/projects/${projectId}/wbs/phases`, phaseData);
        return response.data;
    },

    updatePhase: async (projectId, phaseId, phaseData) => {
        const response = await api.put(`/projects/${projectId}/wbs/phases/${phaseId}`, phaseData);
        return response.data;
    },

    deletePhase: async (projectId, phaseId) => {
        const response = await api.delete(`/projects/${projectId}/wbs/phases/${phaseId}`);
        return response.data;
    },

    // Tasks
    getTasks: async (projectId) => {
        const response = await api.get(`/projects/${projectId}/wbs/tasks`);
        return response.data;
    },

    createTask: async (projectId, taskData) => {
        const response = await api.post(`/projects/${projectId}/wbs/tasks`, taskData);
        return response.data;
    },

    updateTask: async (projectId, taskId, taskData) => {
        const response = await api.put(`/projects/${projectId}/wbs/tasks/${taskId}`, taskData);
        return response.data;
    },

    deleteTask: async (projectId, taskId) => {
        const response = await api.delete(`/projects/${projectId}/wbs/tasks/${taskId}`);
        return response.data;
    }
};

import apiClient from './api';

export const getLeaves = async (params) => {
    const response = await apiClient.get('/leaves', { params });
    return response.data.data;
};

export const getLeaveById = async (id) => {
    const response = await apiClient.get(`/leaves/${id}`);
    return response.data;
};

export const createLeave = async (data) => {
    const response = await apiClient.post('/leaves', data);
    return response.data;
};

export const updateLeave = async (id, data) => {
    const response = await apiClient.put(`/leaves/${id}`, data);
    return response.data;
};

export const deleteLeave = async (id) => {
    const response = await apiClient.delete(`/leaves/${id}`);
    return response.data;
};

export const updateLeaveStatus = async (id, status, adminComment) => {
    const response = await apiClient.patch(`/leaves/${id}/status`, { status, adminComment });
    return response.data;
};

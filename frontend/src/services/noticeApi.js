import apiClient from './api';

export const getNotices = async (params) => {
    const response = await apiClient.get('/notices', { params });
    return response.data.data;
};

export const getNoticeById = async (id) => {
    const response = await apiClient.get(`/notices/${id}`);
    return response.data.data;
};

export const createNotice = async (data) => {
    const response = await apiClient.post('/notices', data);
    return response.data.data;
};

export const updateNotice = async (id, data) => {
    const response = await apiClient.put(`/notices/${id}`, data);
    return response.data.data;
};

export const deleteNotice = async (id) => {
    const response = await apiClient.delete(`/notices/${id}`);
    return response.data.data;
};

export const publishNotice = async (id) => {
    const response = await apiClient.patch(`/notices/${id}/publish`);
    return response.data.data;
};

export const archiveNotice = async (id) => {
    const response = await apiClient.patch(`/notices/${id}/archive`);
    return response.data.data;
};

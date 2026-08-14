import apiClient from './api';

export const getHomeworks = async (params) => {
    const response = await apiClient.get('/homework', { params });
    return response.data.data;
};

export const getHomeworkById = async (id) => {
    const response = await apiClient.get(`/homework/${id}`);
    return response.data;
};

export const createHomework = async (data) => {
    const response = await apiClient.post('/homework', data);
    return response.data;
};

export const updateHomework = async (id, data) => {
    const response = await apiClient.put(`/homework/${id}`, data);
    return response.data;
};

export const deleteHomework = async (id) => {
    const response = await apiClient.delete(`/homework/${id}`);
    return response.data;
};

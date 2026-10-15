import apiClient from './api';

export const getParents = async (params = {}) => {
    const { page = 1, limit = 10, search } = params;
    const response = await apiClient.get('/parents', {
        params: { page, limit, ...(search ? { search } : {}) },
    });
    return response.data?.data;
};

export const createParent = async (data) => {
    const response = await apiClient.post('/parents', data);
    return response.data?.data;
};

export const updateParent = async (id, data) => {
    const response = await apiClient.put(`/parents/${id}`, data);
    return response.data?.data?.parent;
};

export const setParentActive = async (id, isActive) => {
    const response = await apiClient.patch(`/parents/${id}/${isActive ? 'activate' : 'deactivate'}`);
    return response.data?.data?.parent;
};

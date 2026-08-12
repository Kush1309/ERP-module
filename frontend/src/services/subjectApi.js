import apiClient from './api';

export const getSubjects = async (params = {}) => {
    const { search, ...otherParams } = params;

    const response = await apiClient.get('/subjects', {
        params: {
            search,
            ...otherParams
        },
    });

    return response.data?.data;
};

export const createSubject = async (subjectData) => {
    const response = await apiClient.post('/subjects', subjectData);
    return response.data;
};

export const getSubjectById = async (id) => {
    const response = await apiClient.get(`/subjects/${id}`);
    return response.data?.data?.subject;
};

export const updateSubject = async (id, subjectData) => {
    const response = await apiClient.put(`/subjects/${id}`, subjectData);
    return response.data?.data?.subject;
};

export const deleteSubject = async (id) => {
    const response = await apiClient.delete(`/subjects/${id}`);
    return response.data;
};

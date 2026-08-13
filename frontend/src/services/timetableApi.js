import apiClient from './api';

export const getTimetables = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/timetable', {
        params: { page, limit, ...otherParams },
    });
    return response.data?.data;
};

export const createTimetable = async (data) => {
    const response = await apiClient.post('/timetable', data);
    return response.data;
};

export const getTimetableById = async (id) => {
    const response = await apiClient.get(`/timetable/${id}`);
    return response.data?.data;
};

export const updateTimetable = async (id, data) => {
    const response = await apiClient.put(`/timetable/${id}`, data);
    return response.data;
};

export const deleteTimetable = async (id) => {
    const response = await apiClient.delete(`/timetable/${id}`);
    return response.data;
};

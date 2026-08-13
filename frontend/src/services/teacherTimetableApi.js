import apiClient from './api';

export const getTeacherTimetables = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/teacher/timetable', {
        params: { page, limit, ...otherParams },
    });
    return response.data?.data;
};

export const getTeacherTimetableById = async (id) => {
    const response = await apiClient.get(`/teacher/timetable/${id}`);
    return response.data?.data;
};

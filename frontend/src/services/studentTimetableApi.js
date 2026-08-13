import apiClient from './api';

export const getStudentTimetables = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/student/timetable', {
        params: { page, limit, ...otherParams },
    });
    return response.data?.data;
};

export const getStudentTimetableById = async (id) => {
    const response = await apiClient.get(`/student/timetable/${id}`);
    return response.data?.data;
};

import apiClient from './api';

export const getTeachers = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/teachers', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data?.data;
};

export const createTeacher = async (teacherData) => {
    const response = await apiClient.post('/teachers', teacherData);
    return response.data; // Note: controller returns `{ success, message, data: { teacher, credentials } }` directly mapping to response.data
};

export const getTeacherById = async (id) => {
    const response = await apiClient.get(`/teachers/${id}`);
    return response.data?.data?.teacher;
};

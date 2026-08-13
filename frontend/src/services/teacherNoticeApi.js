import apiClient from './api';

export const getTeacherNotices = async (params) => {
    const response = await apiClient.get('/teacher/notices', { params });
    return response.data.data;
};

export const getTeacherNoticeById = async (id) => {
    const response = await apiClient.get(`/teacher/notices/${id}`);
    return response.data.data;
};

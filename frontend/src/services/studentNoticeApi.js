import apiClient from './api';

export const getStudentNotices = async (params) => {
    const response = await apiClient.get('/student/notices', { params });
    return response.data.data;
};

export const getStudentNoticeById = async (id) => {
    const response = await apiClient.get(`/student/notices/${id}`);
    return response.data.data;
};

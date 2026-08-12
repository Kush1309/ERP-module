import apiClient from './api';

export const getStudentResults = async (params = {}) => {
    const response = await apiClient.get('/student/results', { params });
    return response.data?.data?.results || [];
};

export const getStudentResultByExam = async (examId) => {
    const response = await apiClient.get(`/student/results/${examId}`);
    return response.data?.data?.results || [];
};

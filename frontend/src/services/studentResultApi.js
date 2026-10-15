import apiClient from './api';

export const getStudentResults = async (params = {}) => {
    const response = await apiClient.get('/student/results', { params });
    return response.data?.data?.results || [];
};

export const getStudentResultByExam = async (examId) => {
    const response = await apiClient.get(`/student/results/${examId}`);
    return response.data?.data?.results || [];
};

// Examination schedule for the signed-in student's class/section
export const getStudentExams = async () => {
    const response = await apiClient.get('/student/exams');
    return response.data?.data?.exams || [];
};

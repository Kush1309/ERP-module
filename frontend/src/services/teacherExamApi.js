import apiClient from './api';

export const getTeacherExams = async () => {
    const response = await apiClient.get('/teacher/exams');
    return response.data?.data?.exams;
};

export const getTeacherExamById = async (id) => {
    const response = await apiClient.get(`/teacher/exams/${id}`);
    return response.data?.data?.exam;
};

// Uses the main results API but explicitly targeting the exam results list appropriately
export const getTeacherExamResults = async (examId) => {
    // A teacher can securely read results over the admin endpoint if protected correctly,
    // OR we just use the existing one provided in examApi if it does not enforce ID boundaries on read.
    // Assuming the user must fetch results for an exam.
    // Actually, we'll build a specific call here just in case.
    const response = await apiClient.get(`/exams/${examId}/results`);
    return response.data?.data?.results;
};

export const createTeacherResult = async (examId, resultData) => {
    const response = await apiClient.post(`/teacher/exams/${examId}/results`, resultData);
    return response.data;
};

export const updateTeacherResult = async (resultId, resultData) => {
    const response = await apiClient.put(`/teacher/exams/results/${resultId}`, resultData);
    return response.data;
};

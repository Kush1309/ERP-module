import apiClient from './api';

export const getExams = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/exams', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data?.data;
};

export const createExam = async (examData) => {
    const response = await apiClient.post('/exams', examData);
    return response.data;
};

export const getExamById = async (id) => {
    const response = await apiClient.get(`/exams/${id}`);
    return response.data?.data?.exam;
};

export const updateExam = async (id, examData) => {
    const response = await apiClient.put(`/exams/${id}`, examData);
    return response.data?.data?.exam;
};

export const deleteExam = async (id) => {
    const response = await apiClient.delete(`/exams/${id}`);
    return response.data;
};

export const getExamResults = async (examId, params = {}) => {
    const { page = 1, limit = 20, ...otherParams } = params;
    const response = await apiClient.get(`/exams/${examId}/results`, {
        params: {
            page,
            limit,
            ...otherParams
        }
    });
    return response.data?.data;
};

export const createResult = async (examId, resultData) => {
    const response = await apiClient.post(`/exams/${examId}/results`, resultData);
    return response.data;
};

export const getResultById = async (resultId) => {
    const response = await apiClient.get(`/results/${resultId}`);
    return response.data?.data?.result;
};

export const updateResult = async (resultId, resultData) => {
    const response = await apiClient.put(`/results/${resultId}`, resultData);
    return response.data?.data?.result;
};

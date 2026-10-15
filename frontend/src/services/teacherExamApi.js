import apiClient from './api';

export const getTeacherExams = async () => {
    const response = await apiClient.get('/teacher/exams');
    return response.data?.data?.exams;
};

export const getTeacherExamById = async (id) => {
    const response = await apiClient.get(`/teacher/exams/${id}`);
    return response.data?.data?.exam;
};

// Subjects catalogue available to teachers for marks entry (read-only)
export const getTeacherSubjects = async () => {
    const response = await apiClient.get('/teacher/exams/subjects');
    return response.data?.data?.subjects || [];
};

// Active students of the teacher's own class/section for the given exam
export const getTeacherExamStudents = async (examId) => {
    const response = await apiClient.get(`/teacher/exams/${examId}/students`);
    return response.data?.data?.students || [];
};

// Results already recorded for the teacher's students in this exam
export const getTeacherExamResults = async (examId) => {
    const response = await apiClient.get(`/teacher/exams/${examId}/results`);
    return response.data?.data?.results || [];
};

export const createTeacherResult = async (examId, resultData) => {
    const response = await apiClient.post(`/teacher/exams/${examId}/results`, resultData);
    return response.data;
};

export const updateTeacherResult = async (resultId, resultData) => {
    const response = await apiClient.put(`/teacher/exams/results/${resultId}`, resultData);
    return response.data;
};

import apiClient from './api';

export const parentApi = {
    getStudents: async () => {
        const response = await apiClient.get('/parent/students');
        return response.data;
    },

    getStudentById: async (studentId) => {
        const response = await apiClient.get(`/parent/students/${studentId}`);
        return response.data;
    },

    getStudentAttendance: async (studentId, params = {}) => {
        const response = await apiClient.get(`/parent/students/${studentId}/attendance`, { params });
        return response.data;
    },

    getStudentResults: async (studentId, params = {}) => {
        const response = await apiClient.get(`/parent/students/${studentId}/results`, { params });
        return response.data;
    },

    getStudentTimetable: async (studentId, params = {}) => {
        const response = await apiClient.get(`/parent/students/${studentId}/timetable`, { params });
        return response.data;
    },

    getNotices: async (params = {}) => {
        const response = await apiClient.get('/parent/notices', { params });
        return response.data;
    },

    getNoticeById: async (noticeId) => {
        const response = await apiClient.get(`/parent/notices/${noticeId}`);
        return response.data;
    },
};

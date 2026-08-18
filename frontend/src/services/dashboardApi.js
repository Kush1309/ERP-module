import apiClient from './api';

export const getAdminDashboardStats = async (params = {}) => {
    // Expected params: { class: string, section: string }
    const response = await apiClient.get('/dashboard/admin', {
        params
    });

    return response.data?.data;
};

export const getStudentDashboardStats = async () => {
    try {
        const response = await apiClient.get('/dashboard/student');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching student dashboard stats:', error);
        throw error;
    }
};

export const getTeacherDashboardStats = async () => {
    try {
        const response = await apiClient.get('/dashboard/teacher');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching teacher dashboard stats:', error);
        throw error;
    }
};

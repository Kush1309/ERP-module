import apiClient from './api';

export const getAdminDashboardStats = async (params = {}) => {
    // Expected params: { class: string, section: string }
    const response = await apiClient.get('/dashboard/admin', {
        params
    });

    return response.data?.data;
};

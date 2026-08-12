import apiClient from './api';

export const getStudents = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/students', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data?.data;
};

export const createStudent = async (studentData) => {
    const response = await apiClient.post('/students', studentData);
    return response.data;
};

export const getStudentById = async (id) => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data?.data;
};

export const updateStudent = async (id, studentData) => {
    const response = await apiClient.put(`/students/${id}`, studentData);
    return response.data;
};

export const activateStudent = async (id) => {
    const response = await apiClient.patch(`/students/${id}/activate`);
    return response.data;
};

export const deactivateStudent = async (id) => {
    const response = await apiClient.patch(`/students/${id}/deactivate`);
    return response.data;
};

export const bulkUpdateStudentStatus = async (studentIds, status) => {
    const endpoint = status === 'ACTIVE' ? '/students/bulk/activate' : '/students/bulk/deactivate';
    const response = await apiClient.patch(endpoint, { studentIds });
    return response.data;
};

export const getCurrentStudent = async () => {
    const response = await apiClient.get('/students/me');
    return response.data?.data;
};

export const exportAdminStudents = async (params = {}) => {
    const { search, class: className, section, status } = params;
    const response = await apiClient.get('/students/admin/export', {
        params: { search, class: className, section, status },
        responseType: 'blob'
    });
    return response.data;
};

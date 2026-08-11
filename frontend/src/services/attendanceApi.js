import apiClient from './api';

export const getAttendances = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/attendance', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data;
};

export const getMyAttendance = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/attendance/me', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data;
};

export const createAttendance = async (attendanceData) => {
    const response = await apiClient.post('/attendance', attendanceData);
    return response.data;
};

export const getAttendanceById = async (id) => {
    const response = await apiClient.get(`/attendance/${id}`);
    return response.data?.data;
};

export const updateAttendance = async (id, attendanceData) => {
    const response = await apiClient.patch(`/attendance/${id}`, attendanceData);
    return response.data;
};

export const getTeacherRoster = async () => {
    const response = await apiClient.get('/attendance/roster');
    return response.data?.data;
};

export const createBulkAttendance = async (bulkData) => {
    const response = await apiClient.post('/attendance/bulk', bulkData);
    return response.data;
};

export const getTeacherHistory = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/attendance/teacher/history', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data;
};

export const updateTeacherAttendance = async (id, status) => {
    const response = await apiClient.patch(`/attendance/teacher/${id}`, { status });
    return response.data;
};

export const getTeacherAttendanceReport = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/attendance/teacher/report', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data;
};

export const getMyAttendanceHistory = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/attendance/me/history', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data;
};

export const getAdminAttendanceReport = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;

    const response = await apiClient.get('/attendance/admin/report', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });

    return response.data;
};

export const getAdminAttendanceRecords = async (params = {}) => {
    const { page = 1, limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/attendance/admin/records', {
        params: {
            page,
            limit,
            ...otherParams
        },
    });
    return response.data;
};

export const getAdminAttendanceById = async (id) => {
    const response = await apiClient.get(`/attendance/admin/records/${id}`);
    return response.data?.data;
};

export const updateAdminAttendance = async (id, status) => {
    const response = await apiClient.patch(`/attendance/admin/records/${id}`, { status });
    return response.data;
};

export const deleteAdminAttendance = async (id) => {
    const response = await apiClient.delete(`/attendance/admin/records/${id}`);
    return response.data;
};

export const getAdminAttendanceAnalytics = async (params = {}) => {
    const response = await apiClient.get('/attendance/admin/analytics', { params });
    return response.data;
};

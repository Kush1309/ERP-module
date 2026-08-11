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

import apiClient from './api';

export const listFeeStructures = async (params = {}) => {
    // Whitelist query parameters
    const { page, limit, search, academicYear, status, ...otherParams } = params;
    const response = await apiClient.get('/fees/structures', {
        params: {
            page: page || 1,
            limit: limit || 10,
            ...(search && { search }),
            ...(academicYear && { academicYear }),
            ...(status && { status })
        }
    });
    return response.data;
};

export const getFeeStructure = async (id) => {
    const response = await apiClient.get(`/fees/structures/${id}`);
    return response.data?.data;
};

export const createFeeStructure = async (data) => {
    const response = await apiClient.post('/fees/structures', data);
    return response.data?.data;
};

export const updateFeeStructure = async (id, data) => {
    const response = await apiClient.put(`/fees/structures/${id}`, data);
    return response.data?.data;
};

export const deleteFeeStructure = async (id) => {
    const response = await apiClient.delete(`/fees/structures/${id}`);
    return response.data;
};

export const listFeeRecords = async (params = {}) => {
    // Whitelist query parameters
    const { page, limit, studentId, feeStructureId, status, ...otherParams } = params;
    const response = await apiClient.get('/fees/records', {
        params: {
            page: page || 1,
            limit: limit || 10,
            ...(studentId && { studentId }),
            ...(feeStructureId && { feeStructureId }),
            ...(status && { status })
        }
    });
    return response.data;
};

export const getFeeRecord = async (id) => {
    const response = await apiClient.get(`/fees/records/${id}`);
    return response.data?.data;
};

export const createFeeRecord = async (data) => {
    const response = await apiClient.post('/fees/records', data);
    return response.data?.data;
};

export const payFeeRecord = async (id, data) => {
    const response = await apiClient.patch(`/fees/records/${id}/pay`, data);
    return response.data?.data;
};

import apiClient from './api';

const validateId = (id) => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid ID provided');
    }
    return encodeURIComponent(id.trim());
};

const filterBody = (data, allowedFields) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }
    const filtered = {};
    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            filtered[field] = data[field];
        }
    });
    return filtered;
};

// Route APIs
export const getTransportRoutes = async (params = {}) => {
    const { page, limit, search, status } = params;

    const queryParams = {};
    if (page) queryParams.page = Number(page);
    if (limit) queryParams.limit = Number(limit);
    if (search && typeof search === 'string') queryParams.search = search;
    if (status && typeof status === 'string') queryParams.status = status;

    const response = await apiClient.get('/transport/routes', {
        params: queryParams,
    });

    return response.data;
};

export const createTransportRoute = async (data) => {
    const allowedFields = ['name', 'vehicleNumber', 'driverName', 'capacity', 'stops'];
    const filteredData = filterBody(data, allowedFields);

    const response = await apiClient.post('/transport/routes', filteredData);
    return response.data;
};

export const updateTransportRoute = async (id, data) => {
    const validId = validateId(id);
    const allowedFields = ['name', 'vehicleNumber', 'driverName', 'capacity', 'stops'];
    const filteredData = filterBody(data, allowedFields);

    const response = await apiClient.put(`/transport/routes/${validId}`, filteredData);
    return response.data;
};

export const deleteTransportRoute = async (id) => {
    const validId = validateId(id);
    const response = await apiClient.delete(`/transport/routes/${validId}`);
    return response.data;
};

// Allocation APIs
export const getTransportAllocations = async (params = {}) => {
    const { page, limit, studentId, routeId, status } = params;

    const queryParams = {};
    if (page) queryParams.page = Number(page);
    if (limit) queryParams.limit = Number(limit);
    if (studentId && typeof studentId === 'string') queryParams.studentId = studentId;
    if (routeId && typeof routeId === 'string') queryParams.routeId = routeId;
    if (status && typeof status === 'string') queryParams.status = status;

    const response = await apiClient.get('/transport/allocations', {
        params: queryParams,
    });

    return response.data;
};

export const createTransportAllocation = async (data) => {
    const allowedFields = ['studentId', 'routeId', 'pickupStop', 'dropStop', 'status'];
    const filteredData = filterBody(data, allowedFields);

    const response = await apiClient.post('/transport/allocations', filteredData);
    return response.data;
};

export const updateTransportAllocation = async (id, data) => {
    const validId = validateId(id);
    const allowedFields = ['studentId', 'routeId', 'pickupStop', 'dropStop', 'status'];
    const filteredData = filterBody(data, allowedFields);

    const response = await apiClient.put(`/transport/allocations/${validId}`, filteredData);
    return response.data;
};

export const deleteTransportAllocation = async (id) => {
    const validId = validateId(id);
    const response = await apiClient.delete(`/transport/allocations/${validId}`);
    return response.data;
};

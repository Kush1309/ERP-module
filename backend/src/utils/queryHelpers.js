const mongoose = require('mongoose');
const AppError = require('./AppError');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPagination = (query = {}, defaultLimit = 10) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

const buildPagination = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });

const assertObjectId = (id, label = 'ID') => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(`Invalid ${label}`, 400);
    }
};

// Copies only whitelisted keys that are present on `data`
const pick = (data = {}, fields = []) => fields.reduce((acc, field) => {
    if (data[field] !== undefined) acc[field] = data[field];
    return acc;
}, {});

// Sort parameter "field" or "-field" restricted to an allow-list
const getSort = (sortParam, allowed, fallback) => {
    if (!sortParam) return fallback;
    const desc = String(sortParam).startsWith('-');
    const field = String(sortParam).replace(/^-/, '');
    return allowed.includes(field) ? { [field]: desc ? -1 : 1 } : fallback;
};

const startOfUtcDay = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new AppError('Invalid date', 400);
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

module.exports = { escapeRegex, getPagination, buildPagination, assertObjectId, pick, getSort, startOfUtcDay };

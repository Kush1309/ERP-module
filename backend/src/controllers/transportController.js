const transportService = require('../services/transportService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Strict parameter whitelisting enforcing prompt instructions preventing NoSQL injections
const extractQuery = (req, allowedKeys) => {
    const query = {};
    for (const key of allowedKeys) {
        if (req.query[key] !== undefined && typeof req.query[key] === 'string') {
            query[key] = req.query[key];
        }
    }
    return query;
};

const extractBody = (req, allowedKeys) => {
    const data = {};
    for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
            data[key] = req.body[key];
        }
    }
    return data;
};

// =======================
// Route Controllers
// =======================

exports.getRoutes = asyncHandler(async (req, res) => {
    const safeQuery = extractQuery(req, ['page', 'limit', 'search']);
    const result = await transportService.getRoutes(safeQuery);
    res.status(200).json({ status: 'success', data: result });
});

exports.createRoute = asyncHandler(async (req, res) => {
    const safeData = extractBody(req, ['name', 'vehicleNumber', 'driverName', 'capacity', 'stops']);
    const route = await transportService.createRoute(safeData);
    res.status(201).json({ status: 'success', data: { route } });
});

exports.updateRoute = asyncHandler(async (req, res) => {
    const safeData = extractBody(req, ['name', 'vehicleNumber', 'driverName', 'capacity', 'stops']);
    const route = await transportService.updateRoute(req.params.id, safeData);
    res.status(200).json({ status: 'success', data: { route } });
});

exports.deleteRoute = asyncHandler(async (req, res) => {
    const route = await transportService.deleteRoute(req.params.id);
    res.status(200).json({ status: 'success', data: null, message: 'Transport route deleted successfully' });
});

// =======================
// Allocation Controllers
// =======================

exports.getAllocations = asyncHandler(async (req, res) => {
    const safeQuery = extractQuery(req, ['page', 'limit', 'studentId', 'routeId', 'status']);
    const result = await transportService.getAllocations(safeQuery, req.user);
    res.status(200).json({ status: 'success', data: result });
});

exports.createAllocation = asyncHandler(async (req, res) => {
    const safeData = extractBody(req, ['studentId', 'routeId', 'pickupStop', 'dropStop']);
    const allocation = await transportService.createAllocation(safeData, req.user);
    res.status(201).json({ status: 'success', data: { allocation } });
});

exports.updateAllocation = asyncHandler(async (req, res) => {
    const safeData = extractBody(req, ['routeId', 'pickupStop', 'dropStop', 'status']);
    const allocation = await transportService.updateAllocation(req.params.id, safeData, req.user);
    res.status(200).json({ status: 'success', data: { allocation } });
});

exports.deleteAllocation = asyncHandler(async (req, res) => {
    await transportService.deleteAllocation(req.params.id, req.user);
    res.status(200).json({ status: 'success', data: null, message: 'Transport allocation deleted/inactivated successfully' });
});

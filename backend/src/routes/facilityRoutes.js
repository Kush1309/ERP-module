const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const hostel = require('../services/hostelService');
const inventory = require('../services/inventoryService');
const Student = require('../models/Student');
const ParentProfile = require('../models/ParentProfile');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const send = (res, data, status = 200, message) => res.status(status).json({ success: true, ...(message && { message }), data });
const admin = [authenticateUser, authorizeRoles(ROLES.ADMIN)];

// Hostel — mounted at /api/hostel
const hostelRouter = express.Router();
hostelRouter.get('/my', authenticateUser, authorizeRoles(ROLES.STUDENT, ROLES.PARENT), asyncHandler(async (req, res) => {
    let studentIds = [];
    if (req.user.role === ROLES.STUDENT) studentIds = await Student.find({ user: req.user._id }).distinct('_id');
    else studentIds = (await ParentProfile.findOne({ user: req.user._id }).lean())?.students || [];
    send(res, await hostel.getMyAllocation(studentIds));
}));
hostelRouter.get('/rooms', ...admin, asyncHandler(async (req, res) => send(res, await hostel.listRooms(req.query))));
hostelRouter.post('/rooms', ...admin, asyncHandler(async (req, res) => send(res, await hostel.createRoom(req.body), 201, 'Room added')));
hostelRouter.put('/rooms/:id', ...admin, asyncHandler(async (req, res) => send(res, await hostel.updateRoom(req.params.id, req.body), 200, 'Room updated')));
hostelRouter.delete('/rooms/:id', ...admin, asyncHandler(async (req, res) => send(res, await hostel.deleteRoom(req.params.id), 200, 'Room deleted')));
hostelRouter.get('/allocations', ...admin, asyncHandler(async (req, res) => send(res, await hostel.listAllocations(req.query))));
hostelRouter.post('/allocations', ...admin, asyncHandler(async (req, res) => send(res, await hostel.allocate(req.body), 201, 'Bed allocated')));
hostelRouter.patch('/allocations/:id/vacate', ...admin, asyncHandler(async (req, res) => send(res, await hostel.vacate(req.params.id), 200, 'Bed vacated')));
hostelRouter.get('/report', ...admin, asyncHandler(async (req, res) => send(res, await hostel.occupancyReport())));

// Inventory — mounted at /api/inventory
const inventoryRouter = express.Router();
inventoryRouter.use(...admin);
inventoryRouter.get('/items', asyncHandler(async (req, res) => send(res, await inventory.listItems(req.query))));
inventoryRouter.post('/items', asyncHandler(async (req, res) => send(res, await inventory.createItem(req.body, req.user._id), 201, 'Item added')));
inventoryRouter.put('/items/:id', asyncHandler(async (req, res) => send(res, await inventory.updateItem(req.params.id, req.body), 200, 'Item updated')));
inventoryRouter.delete('/items/:id', asyncHandler(async (req, res) => send(res, await inventory.deleteItem(req.params.id), 200, 'Item deleted')));
inventoryRouter.post('/items/:id/transactions', asyncHandler(async (req, res) => send(res, await inventory.recordTransaction(req.params.id, req.body, req.user._id), 201, 'Stock updated')));
inventoryRouter.get('/transactions', asyncHandler(async (req, res) => send(res, await inventory.listTransactions(req.query))));

module.exports = { hostelRouter, inventoryRouter };

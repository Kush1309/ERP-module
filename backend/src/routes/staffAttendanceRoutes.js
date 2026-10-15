const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/staffAttendanceService');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES, STAFF_ROLES } = require('../constants/roles');

const router = express.Router();
router.use(authenticateUser);

// Staff view their own attendance
router.get('/me', authorizeRoles(ROLES.TEACHER, ...STAFF_ROLES), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await service.getMyAttendance(req.user._id, req.query.month) });
}));

// Administration marks and reviews staff attendance
router.get('/roster', authorizeRoles(ROLES.ADMIN), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await service.getRoster(req.query.date) });
}));
router.post('/', authorizeRoles(ROLES.ADMIN), asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Staff attendance saved', data: await service.saveAttendance(req.user._id, req.body) });
}));
router.get('/summary', authorizeRoles(ROLES.ADMIN), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await service.getMonthlySummary(req.query.month) });
}));

module.exports = router;

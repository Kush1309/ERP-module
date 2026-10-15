const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { getOverview } = require('../services/reportService');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/overview', authenticateUser, authorizeRoles(ROLES.ADMIN), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getOverview(req.user, { startDate: req.query.startDate, endDate: req.query.endDate }) });
}));

module.exports = router;

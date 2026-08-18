const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const dashboardService = require('../services/dashboardService');

/**
 * @desc    Get dashboard metrics for admin
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
const getAdminDashboardMetrics = asyncHandler(async (req, res) => {
    // Whitelist and sanitize filters to prevent NoSQL injection
    const filters = {};
    if (req.query.class && typeof req.query.class === 'string') {
        filters.class = req.query.class.trim();
    }

    if (req.query.section && typeof req.query.section === 'string') {
        filters.section = req.query.section.trim();
    }

    const metrics = await dashboardService.getAdminMetrics(filters);

    res.status(200).json({
        success: true,
        message: 'Dashboard metrics retrieved successfully',
        data: metrics
    });
});

/**
 * @desc    Get dashboard metrics for student
 * @route   GET /api/dashboard/student
 * @access  Private/Student
 */
const getStudentDashboardMetrics = asyncHandler(async (req, res) => {
    // Rely solely on authenticated user identity
    const userId = req.user._id;

    const metrics = await dashboardService.getStudentMetrics(userId);

    res.status(200).json({
        success: true,
        message: 'Student dashboard metrics retrieved successfully',
        data: metrics
    });
});


module.exports = {
    getAdminDashboardMetrics,
    getStudentDashboardMetrics
};

const attendanceService = require('../services/attendanceService');
const asyncHandler = require('../utils/asyncHandler');

const createAttendance = asyncHandler(async (req, res) => {
    // Only extract whitelisted fields
    const { student, date, status, remarks } = req.body;
    const userId = req.user.id;

    const attendance = await attendanceService.createAttendance(userId, {
        student,
        date,
        status,
        remarks
    });

    res.status(201).json({
        success: true,
        message: 'Attendance record created successfully',
        data: attendance
    });
});

const getAttendances = asyncHandler(async (req, res) => {
    // Whitelist supported query parameters
    const { page, limit, student, date, status } = req.query;

    const result = await attendanceService.getAttendances({ page, limit, student, date, status });

    res.status(200).json({
        success: true,
        data: result.attendances,
        pagination: result.pagination
    });
});

const getMyAttendance = asyncHandler(async (req, res) => {
    // Determine student ID exclusively through the authenticated User token
    const userId = req.user.id;
    const { page, limit, date, status } = req.query; // Ignore explicit `student` id in query

    const result = await attendanceService.getMyAttendance(userId, { page, limit, date, status });

    res.status(200).json({
        success: true,
        data: result.attendances,
        pagination: result.pagination
    });
});

const getMyAttendanceHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate, status, page, limit } = req.query;

    const result = await attendanceService.getMyAttendanceHistory(userId, {
        startDate, endDate, status, page, limit
    });

    res.status(200).json({
        success: true,
        data: result.data,
        summary: result.summary,
        pagination: result.pagination
    });
});

const getAdminAttendanceReport = asyncHandler(async (req, res) => {
    // Explicit extraction over passing req.query to prevent injection
    const { startDate, endDate, status, search, page, limit } = req.query;
    const classFilter = req.query.class;
    const sectionFilter = req.query.section;

    const result = await attendanceService.getAdminAttendanceReport({
        startDate, endDate, status, search, page, limit, class: classFilter, section: sectionFilter
    });

    res.status(200).json({
        success: true,
        data: result.data,
        summary: result.summary,
        pagination: result.pagination
    });
});

const getAttendanceById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const attendance = await attendanceService.getAttendanceById(id);

    res.status(200).json({
        success: true,
        data: attendance
    });
});

const updateAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Whitelist fields
    const { status, remarks, date } = req.body;
    const userId = req.user.id;

    const updated = await attendanceService.updateAttendance(userId, id, { status, remarks, date });

    res.status(200).json({
        success: true,
        message: 'Attendance record updated successfully',
        data: updated
    });
});

const getTeacherRoster = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const roster = await attendanceService.getTeacherRoster(userId);

    res.status(200).json({
        success: true,
        data: roster
    });
});

const createBulkAttendance = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { date, attendance } = req.body;

    // Use Teacher assignment contexts directly via service boundaries
    const inserted = await attendanceService.createBulkAttendance(userId, { date, attendance });

    res.status(201).json({
        success: true,
        message: 'Bulk attendance recorded successfully',
        data: inserted
    });
});

const getTeacherAttendanceHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, date, student, status } = req.query;

    const result = await attendanceService.getTeacherAttendanceHistory(userId, { page, limit, date, student, status });

    res.status(200).json({
        success: true,
        data: result.attendances,
        summary: result.summary,
        pagination: result.pagination
    });
});

const updateTeacherAttendance = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const attendanceId = req.params.id;
    const { status } = req.body;

    const data = await attendanceService.updateTeacherAttendance(userId, attendanceId, status);

    res.status(200).json({
        success: true,
        data
    });
});

const getTeacherAttendanceReport = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate, search, status, page, limit } = req.query;

    const result = await attendanceService.getTeacherAttendanceReport(userId, {
        startDate, endDate, search, status, page, limit
    });

    res.status(200).json({
        success: true,
        data: result.data,
        summary: result.summary,
        pagination: result.pagination
    });
});

const getAdminAttendanceRecords = asyncHandler(async (req, res) => {
    const { startDate, endDate, date, status, search, page, limit } = req.query;
    const classFilter = req.query.class;
    const sectionFilter = req.query.section;

    const result = await attendanceService.getAdminAttendanceRecords({
        startDate, endDate, date, status, search, page, limit, class: classFilter, section: sectionFilter
    });

    res.status(200).json({
        success: true,
        data: result.records,
        pagination: result.pagination
    });
});

const getAdminAttendanceById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const attendance = await attendanceService.getAdminAttendanceById(id);
    res.status(200).json({ success: true, data: attendance });
});

const updateAdminAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const updated = await attendanceService.updateAdminAttendance(userId, id, status);
    res.status(200).json({ success: true, data: updated, message: 'Attendance record updated successfully' });
});

const deleteAdminAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await attendanceService.deleteAdminAttendance(userId, id);
    res.status(200).json({ success: true, message: 'Attendance record deleted successfully' });
});

const getAdminAttendanceAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const classFilter = req.query.class;
    const sectionFilter = req.query.section;

    const analytics = await attendanceService.getAdminAttendanceAnalytics({
        startDate, endDate, class: classFilter, section: sectionFilter
    });

    res.status(200).json({
        success: true,
        data: analytics
    });
});

const exportAdminAttendance = asyncHandler(async (req, res) => {
    const { startDate, endDate, status, search } = req.query;
    const classFilter = req.query.class;
    const sectionFilter = req.query.section;

    const csvData = await attendanceService.exportAdminAttendance({
        startDate, endDate, status, search, class: classFilter, section: sectionFilter
    });

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-export-${dateStr}.csv"`);
    res.status(200).send(csvData);
});

const getAttendanceAuditLogs = asyncHandler(async (req, res) => {
    const { page, limit, startDate, endDate, action, status, search } = req.query;

    const result = await attendanceService.getAttendanceAuditLogs({
        page, limit, startDate, endDate, action, status, search
    });

    res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination
    });
});

module.exports = {
    createAttendance,
    getAttendances,
    getMyAttendance,
    getAttendanceById,
    updateAttendance,
    getTeacherRoster,
    createBulkAttendance,
    getTeacherAttendanceHistory,
    updateTeacherAttendance,
    getTeacherAttendanceReport,
    getMyAttendanceHistory,
    getAdminAttendanceReport,
    getAdminAttendanceRecords,
    getAdminAttendanceById,
    updateAdminAttendance,
    deleteAdminAttendance,
    getAdminAttendanceAnalytics,
    exportAdminAttendance,
    getAttendanceAuditLogs
};

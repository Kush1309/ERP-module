const asyncHandler = require('../utils/asyncHandler');
const academicService = require('../services/academicService');
const settingsService = require('../services/settingsService');
const staffService = require('../services/staffService');
const notificationService = require('../services/notificationService');
const AuditLog = require('../models/AuditLog');
const { escapeRegex, getPagination, buildPagination } = require('../utils/queryHelpers');

const ok = (res, data, status = 200, message) => res.status(status).json({ success: true, ...(message && { message }), data });

// Academic years
exports.listAcademicYears = asyncHandler(async (req, res) => ok(res, await academicService.listAcademicYears()));
exports.createAcademicYear = asyncHandler(async (req, res) => ok(res, await academicService.createAcademicYear(req.body), 201, 'Academic year created'));
exports.updateAcademicYear = asyncHandler(async (req, res) => ok(res, await academicService.updateAcademicYear(req.params.id, req.body), 200, 'Academic year updated'));
exports.setCurrentAcademicYear = asyncHandler(async (req, res) => ok(res, await academicService.setCurrentAcademicYear(req.params.id), 200, 'Current academic year updated'));
exports.deleteAcademicYear = asyncHandler(async (req, res) => ok(res, await academicService.deleteAcademicYear(req.params.id), 200, 'Academic year deleted'));

// Classes & sections
exports.listClassSections = asyncHandler(async (req, res) => ok(res, await academicService.listClassSections(req.query)));
exports.createClassSection = asyncHandler(async (req, res) => ok(res, await academicService.createClassSection(req.body), 201, 'Class section created'));
exports.updateClassSection = asyncHandler(async (req, res) => ok(res, await academicService.updateClassSection(req.params.id, req.body), 200, 'Class section updated'));
exports.deleteClassSection = asyncHandler(async (req, res) => ok(res, await academicService.deleteClassSection(req.params.id), 200, 'Class section deleted'));
exports.importClassSections = asyncHandler(async (req, res) => ok(res, await academicService.importExistingClassSections(), 200, 'Class sections imported from student records'));

// Settings
exports.getSettings = asyncHandler(async (req, res) => ok(res, await settingsService.getSettings()));
exports.updateSettings = asyncHandler(async (req, res) => ok(res, await settingsService.updateSettings(req.body), 200, 'Settings saved'));

// Audit log (read-only)
exports.listAuditLogs = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 25);
    const filter = {};
    if (req.query.module) filter.module = String(req.query.module);
    if (req.query.method) filter.method = String(req.query.method).toUpperCase();
    if (req.query.search) {
        const regex = { $regex: escapeRegex(req.query.search), $options: 'i' };
        filter.$or = [{ actorLoginId: regex }, { path: regex }];
    }
    if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
        if (req.query.endDate) {
            const end = new Date(req.query.endDate);
            end.setUTCHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
        }
    }
    const [logs, total, modules] = await Promise.all([
        AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(filter),
        AuditLog.distinct('module'),
    ]);
    ok(res, { logs, modules: modules.sort(), pagination: buildPagination(page, limit, total) });
});

// Staff accounts (accountant, librarian)
exports.listStaff = asyncHandler(async (req, res) => ok(res, await staffService.listStaff(req.query)));
exports.createStaff = asyncHandler(async (req, res) => ok(res, await staffService.createStaffAccount(req.body), 201, 'Staff account created'));
exports.updateStaff = asyncHandler(async (req, res) => ok(res, { staff: await staffService.updateStaff(req.params.id, req.body) }, 200, 'Staff member updated'));
exports.activateStaff = asyncHandler(async (req, res) => ok(res, { staff: await staffService.setStaffActive(req.params.id, true) }, 200, 'Staff account activated'));
exports.deactivateStaff = asyncHandler(async (req, res) => ok(res, { staff: await staffService.setStaffActive(req.params.id, false) }, 200, 'Staff account deactivated'));

// Notifications (current user)
exports.listNotifications = asyncHandler(async (req, res) => ok(res, await notificationService.listForUser(req.user._id, req.query)));
exports.markNotificationRead = asyncHandler(async (req, res) => ok(res, await notificationService.markRead(req.user._id, req.params.id)));
exports.markAllNotificationsRead = asyncHandler(async (req, res) => ok(res, await notificationService.markAllRead(req.user._id)));

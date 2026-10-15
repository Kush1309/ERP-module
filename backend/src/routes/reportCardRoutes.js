const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const reportCardService = require('../services/reportCardService');

// Auth is applied per route (this router is mounted at the API root)
const router = express.Router();

// GET /api/report-cards/:examId/:studentId — access checked per role in the service
router.get('/report-cards/:examId/:studentId', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await reportCardService.buildReportCard(req.user, req.params.examId, req.params.studentId) });
}));

// GET /api/exam-analytics/:examId — admin sees everything, teachers only their class/section
router.get('/exam-analytics/:examId', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), asyncHandler(async (req, res) => {
    let scope = {};
    if (req.user.role === ROLES.TEACHER) {
        const teacher = await Teacher.findOne({ user: req.user._id }).lean();
        const exam = await Exam.findById(req.params.examId).select('class section').lean();
        if (!teacher || !exam || exam.class !== teacher.assignedClass || (exam.section && exam.section !== teacher.assignedSection)) {
            throw new AppError('You can only view analytics for examinations of your class', 403);
        }
        scope = { className: teacher.assignedClass, section: teacher.assignedSection };
    } else if (req.query.class) {
        scope = { className: String(req.query.class), section: req.query.section ? String(req.query.section) : undefined };
    }
    res.json({ success: true, data: await reportCardService.buildExamAnalytics(req.params.examId, scope) });
}));

module.exports = router;

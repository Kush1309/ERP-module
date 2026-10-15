const express = require('express');
const {
    createHomework,
    getHomeworks,
    getHomeworkById,
    updateHomework,
    deleteHomework
} = require('../controllers/homeworkController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticateUser);

// All authenticated roles can access LIST and GET BY ID endpoints
router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT), getHomeworks);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT), getHomeworkById);

// Submissions
const asyncHandler = require('../utils/asyncHandler');
const submissionService = require('../services/homeworkSubmissionService');
router.patch('/submissions/:submissionId/grade', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), asyncHandler(async (req, res) => {
    const data = await submissionService.gradeSubmission(req.user, req.params.submissionId, req.body);
    res.json({ success: true, message: 'Feedback saved', data });
}));
router.get('/:id/submissions', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await submissionService.listSubmissions(req.user, req.params.id) });
}));
router.get('/:id/my-submission', authorizeRoles(ROLES.STUDENT, ROLES.PARENT), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await submissionService.getSubmissionFor(req.user, req.params.id, req.query.student) });
}));
router.post('/:id/submissions', authorizeRoles(ROLES.STUDENT), asyncHandler(async (req, res) => {
    const data = await submissionService.submit(req.user._id, req.params.id, { content: req.body.content, attachmentUrl: req.body.attachmentUrl });
    res.status(201).json({ success: true, message: 'Homework submitted', data });
}));

// Only ADMIN and TEACHER can mutate homework
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), createHomework);
router.put('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), updateHomework);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), deleteHomework);

module.exports = router;

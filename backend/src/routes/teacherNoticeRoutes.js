const express = require('express');
const {
    getTeacherNotices,
    getTeacherNoticeById
} = require('../controllers/teacherNoticeController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.TEACHER));

router.get('/', getTeacherNotices);
router.get('/:id', getTeacherNoticeById);

module.exports = router;

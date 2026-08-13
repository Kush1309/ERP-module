const express = require('express');
const {
    getStudentNotices,
    getStudentNoticeById
} = require('../controllers/studentNoticeController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.STUDENT));

router.get('/', getStudentNotices);
router.get('/:id', getStudentNoticeById);

module.exports = router;

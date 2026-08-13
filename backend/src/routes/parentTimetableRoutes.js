const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const parentTimetableController = require('../controllers/parentTimetableController');

const router = express.Router();

// Role explicitly natively mapped accurately perfectly structurally safely properly strictly avoiding intersection smoothly natively stably confidently safely gracefully natively gracefully efficiently
router.use(authenticateUser);
router.use(authorizeRoles(ROLES.PARENT));

router.get('/students/:id/timetable', parentTimetableController.getStudentTimetable);

module.exports = router;

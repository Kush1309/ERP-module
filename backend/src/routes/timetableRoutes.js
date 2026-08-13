const express = require('express');
const {
    createTimetable,
    getTimetables,
    getTimetableById,
    updateTimetable,
    deleteTimetable
} = require('../controllers/timetableController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.post('/', authenticateUser, authorizeRoles(ROLES.ADMIN), createTimetable);
router.get('/', authenticateUser, authorizeRoles(ROLES.ADMIN), getTimetables);
router.get('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), getTimetableById);
router.put('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), updateTimetable);
router.delete('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), deleteTimetable);

module.exports = router;

const express = require('express');
const c = require('../controllers/adminConfigController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const admin = authorizeRoles(ROLES.ADMIN);

// Mounted at /api
const router = express.Router();

// Academic years & class sections: readable by every signed-in user (dropdowns), editable by admin
router.get('/academic-years', authenticateUser, c.listAcademicYears);
router.post('/academic-years', authenticateUser, admin, c.createAcademicYear);
router.put('/academic-years/:id', authenticateUser, admin, c.updateAcademicYear);
router.patch('/academic-years/:id/current', authenticateUser, admin, c.setCurrentAcademicYear);
router.delete('/academic-years/:id', authenticateUser, admin, c.deleteAcademicYear);

router.get('/class-sections', authenticateUser, c.listClassSections);
router.post('/class-sections/import', authenticateUser, admin, c.importClassSections);
router.post('/class-sections', authenticateUser, admin, c.createClassSection);
router.put('/class-sections/:id', authenticateUser, admin, c.updateClassSection);
router.delete('/class-sections/:id', authenticateUser, admin, c.deleteClassSection);

router.get('/settings', authenticateUser, c.getSettings);
router.put('/settings', authenticateUser, admin, c.updateSettings);

router.get('/audit-logs', authenticateUser, admin, c.listAuditLogs);

router.get('/staff', authenticateUser, admin, c.listStaff);
router.post('/staff', authenticateUser, admin, c.createStaff);
router.put('/staff/:id', authenticateUser, admin, c.updateStaff);
router.patch('/staff/:id/activate', authenticateUser, admin, c.activateStaff);
router.patch('/staff/:id/deactivate', authenticateUser, admin, c.deactivateStaff);

router.get('/notifications', authenticateUser, c.listNotifications);
router.patch('/notifications/read-all', authenticateUser, c.markAllNotificationsRead);
router.patch('/notifications/:id/read', authenticateUser, c.markNotificationRead);

module.exports = router;

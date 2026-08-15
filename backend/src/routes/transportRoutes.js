const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticateUser);

// =======================
// Route Endpoints
// =======================

router.get(
    '/routes',
    authorizeRoles(ROLES.ADMIN, ROLES.STUDENT, ROLES.PARENT, ROLES.TEACHER),
    transportController.getRoutes
);

router.post(
    '/routes',
    authorizeRoles(ROLES.ADMIN),
    transportController.createRoute
);

router.put(
    '/routes/:id',
    authorizeRoles(ROLES.ADMIN),
    transportController.updateRoute
);

router.delete(
    '/routes/:id',
    authorizeRoles(ROLES.ADMIN),
    transportController.deleteRoute
);

// =======================
// Allocation Endpoints
// =======================

router.get(
    '/allocations',
    authorizeRoles(ROLES.ADMIN, ROLES.STUDENT, ROLES.PARENT),
    transportController.getAllocations
);

router.post(
    '/allocations',
    authorizeRoles(ROLES.ADMIN),
    transportController.createAllocation
);

router.put(
    '/allocations/:id',
    authorizeRoles(ROLES.ADMIN),
    transportController.updateAllocation
);

router.delete(
    '/allocations/:id',
    authorizeRoles(ROLES.ADMIN),
    transportController.deleteAllocation
);

module.exports = router;

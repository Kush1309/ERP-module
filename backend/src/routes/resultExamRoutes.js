const express = require('express');
const router = express.Router({ mergeParams: true });
const resultController = require('../controllers/resultController');

// The auth middleware gets loaded in the parent router, but we can verify it here if we want.
// We'll let examRoutes and index handle the RBAC appropriately since this is a nested pattern.

router
    .route('/')
    .get(resultController.getResults)
    .post(resultController.createResult);

module.exports = router;

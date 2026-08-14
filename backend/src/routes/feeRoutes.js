const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// ==========================================
// FEE STRUCTURES (Templates)
// ==========================================

// Setup routes for structures, protected by Admin authorization
router.post('/structures', authorizeRoles('ADMIN'), feeController.createFeeStructure);
router.get('/structures', authorizeRoles('ADMIN', 'TEACHER'), feeController.getFeeStructures);
router.get('/structures/:id', authorizeRoles('ADMIN', 'TEACHER'), feeController.getFeeStructureById);
router.put('/structures/:id', authorizeRoles('ADMIN'), feeController.updateFeeStructure);
router.delete('/structures/:id', authorizeRoles('ADMIN'), feeController.deleteFeeStructure);

// ==========================================
// FEE RECORDS (Student assignments)
// ==========================================

router.post('/records', authorizeRoles('ADMIN'), feeController.createFeeRecord);
router.get('/records', feeController.getFeeRecords);
router.get('/records/:id', feeController.getFeeRecordById);
router.post('/records/:id/pay', authorizeRoles('ADMIN'), feeController.recordPayment);

module.exports = router;

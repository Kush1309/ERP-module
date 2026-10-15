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
router.post('/structures', authorizeRoles('ADMIN', 'ACCOUNTANT'), feeController.createFeeStructure);
router.get('/structures', authorizeRoles('ADMIN', 'ACCOUNTANT', 'TEACHER'), feeController.getFeeStructures);
router.get('/structures/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'TEACHER'), feeController.getFeeStructureById);
router.put('/structures/:id', authorizeRoles('ADMIN', 'ACCOUNTANT'), feeController.updateFeeStructure);
router.delete('/structures/:id', authorizeRoles('ADMIN', 'ACCOUNTANT'), feeController.deleteFeeStructure);

// ==========================================
// FEE RECORDS (Student assignments)
// ==========================================

router.get('/summary', authorizeRoles('ADMIN', 'ACCOUNTANT'), feeController.getFinanceSummary);
router.patch('/records/:id/discount', authorizeRoles('ADMIN'), feeController.applyDiscount);
router.get('/records/:id/receipts/:receiptNumber', feeController.getReceipt);
router.post('/records', authorizeRoles('ADMIN', 'ACCOUNTANT'), feeController.createFeeRecord);
router.get('/records', feeController.getFeeRecords);
router.get('/records/:id', feeController.getFeeRecordById);
// The frontend uses PATCH; POST is kept for backwards compatibility with existing clients
router.patch('/records/:id/pay', authorizeRoles('ADMIN', 'ACCOUNTANT'), feeController.recordPayment);
router.post('/records/:id/pay', authorizeRoles('ADMIN', 'ACCOUNTANT'), feeController.recordPayment);

module.exports = router;

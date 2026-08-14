const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { protect, authorize } = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(protect);

// ==========================================
// FEE STRUCTURES (Templates)
// ==========================================

// Setup routes for structures, protected by Admin authorization
router.post('/structures', authorize('ADMIN'), feeController.createFeeStructure);
router.get('/structures', authorize('ADMIN', 'TEACHER'), feeController.getFeeStructures);
router.get('/structures/:id', authorize('ADMIN', 'TEACHER'), feeController.getFeeStructureById);
router.put('/structures/:id', authorize('ADMIN'), feeController.updateFeeStructure);
router.delete('/structures/:id', authorize('ADMIN'), feeController.deleteFeeStructure);

// ==========================================
// FEE RECORDS (Student assignments)
// ==========================================

router.post('/records', authorize('ADMIN'), feeController.createFeeRecord);
router.get('/records', feeController.getFeeRecords);
router.get('/records/:id', feeController.getFeeRecordById);
router.post('/records/:id/pay', authorize('ADMIN'), feeController.recordPayment);

module.exports = router;

const feeService = require('../services/feeService');

// ==========================================
// FEE STRUCTURES
// ==========================================

exports.createFeeStructure = async (req, res, next) => {
    try {
        const structure = await feeService.createFeeStructure(req.user, req.body);
        res.status(201).json({
            success: true,
            data: structure
        });
    } catch (error) {
        next(error);
    }
};

exports.getFeeStructures = async (req, res, next) => {
    try {
        const result = await feeService.getFeeStructures(req.user, req.query);
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.getFeeStructureById = async (req, res, next) => {
    try {
        const structure = await feeService.getFeeStructureById(req.user, req.params.id);
        res.status(200).json({
            success: true,
            data: structure
        });
    } catch (error) {
        next(error);
    }
};

exports.updateFeeStructure = async (req, res, next) => {
    try {
        const structure = await feeService.updateFeeStructure(req.user, req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: structure
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteFeeStructure = async (req, res, next) => {
    try {
        await feeService.deleteFeeStructure(req.user, req.params.id);
        res.status(200).json({
            success: true,
            message: 'Fee structure deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// FEE RECORDS
// ==========================================

exports.createFeeRecord = async (req, res, next) => {
    try {
        const record = await feeService.createFeeRecord(req.user, req.body);
        res.status(201).json({
            success: true,
            data: record
        });
    } catch (error) {
        next(error);
    }
};

exports.getFeeRecords = async (req, res, next) => {
    try {
        const result = await feeService.getFeeRecords(req.user, req.query);
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.getFeeRecordById = async (req, res, next) => {
    try {
        const record = await feeService.getFeeRecordById(req.user, req.params.id);
        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        next(error);
    }
};

exports.recordPayment = async (req, res, next) => {
    try {
        const { paymentAmount } = req.body;
        const record = await feeService.recordPayment(req.user, req.params.id, paymentAmount);
        res.status(200).json({
            success: true,
            message: 'Payment recorded successfully',
            data: record
        });
    } catch (error) {
        next(error);
    }
};

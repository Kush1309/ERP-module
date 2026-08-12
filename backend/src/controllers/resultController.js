const resultService = require('../services/resultService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

exports.createResult = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.examId)) {
        throw new AppError('Invalid Exam ID', 400);
    }
    const result = await resultService.createResult(req.params.examId, req.body, req.user.id);
    res.status(201).json({
        status: 'success',
        data: { result }
    });
});

exports.getResults = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.examId)) {
        throw new AppError('Invalid Exam ID', 400);
    }
    const { results, total, page, limit } = await resultService.getResults(req.params.examId, req.query);
    res.status(200).json({
        status: 'success',
        results: results.length,
        total,
        page,
        limit,
        data: { results }
    });
});

exports.getResultById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Result ID', 400);
    }
    const result = await resultService.getResultById(req.params.id);
    res.status(200).json({
        status: 'success',
        data: { result }
    });
});

exports.updateResult = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Result ID', 400);
    }
    const result = await resultService.updateResult(req.params.id, req.body);
    res.status(200).json({
        status: 'success',
        data: { result }
    });
});

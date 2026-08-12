const examService = require('../services/examService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

exports.createExam = asyncHandler(async (req, res) => {
    const exam = await examService.createExam(req.body, req.user.id);
    res.status(201).json({
        status: 'success',
        data: { exam }
    });
});

exports.getExams = asyncHandler(async (req, res) => {
    const { exams, total, page, limit } = await examService.getExams(req.query);
    res.status(200).json({
        status: 'success',
        results: exams.length,
        total,
        page,
        limit,
        data: { exams }
    });
});

exports.getExamById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Exam ID', 400);
    }
    const exam = await examService.getExamById(req.params.id);
    res.status(200).json({
        status: 'success',
        data: { exam }
    });
});

exports.updateExam = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Exam ID', 400);
    }
    const exam = await examService.updateExam(req.params.id, req.body);
    res.status(200).json({
        status: 'success',
        data: { exam }
    });
});

exports.deleteExam = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Exam ID', 400);
    }
    await examService.deleteExam(req.params.id);
    res.status(200).json({
        status: 'success',
        message: 'Exam deleted successfully'
    });
});

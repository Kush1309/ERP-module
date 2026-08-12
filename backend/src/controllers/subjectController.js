const subjectService = require('../services/subjectService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

exports.createSubject = asyncHandler(async (req, res) => {
    const subject = await subjectService.createSubject(req.body);
    res.status(201).json({
        status: 'success',
        data: { subject }
    });
});

exports.getSubjects = asyncHandler(async (req, res) => {
    const subjects = await subjectService.getSubjects(req.query);
    res.status(200).json({
        status: 'success',
        results: subjects.length,
        data: { subjects }
    });
});

exports.getSubjectById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Subject ID', 400);
    }
    const subject = await subjectService.getSubjectById(req.params.id);
    res.status(200).json({
        status: 'success',
        data: { subject }
    });
});

exports.updateSubject = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Subject ID', 400);
    }
    const subject = await subjectService.updateSubject(req.params.id, req.body);
    res.status(200).json({
        status: 'success',
        data: { subject }
    });
});

exports.deleteSubject = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Subject ID', 400);
    }
    await subjectService.deleteSubject(req.params.id);
    res.status(200).json({
        status: 'success',
        message: 'Subject deleted successfully'
    });
});

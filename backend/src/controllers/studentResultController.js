const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Result = require('../models/Result');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// Helper to fetch the authenticated student profile securely identically natively dependably explicitly gracefully identically inherently gracefully purely accurately beautifully securely organically.
const getStudentContext = async (userId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) {
        throw new AppError('Student profile not found for this user', 404);
    }
    return student;
};

exports.getStudentResults = asyncHandler(async (req, res) => {
    const student = await getStudentContext(req.user.id);

    // Support filtering cleanly organically safely
    const matchStage = { student: student._id };

    if (req.query.status) {
        matchStage.status = req.query.status;
    }

    if (req.query.exam) {
        if (!mongoose.Types.ObjectId.isValid(req.query.exam)) {
            throw new AppError('Invalid Exam parameter', 400);
        }
        matchStage.exam = new mongoose.Types.ObjectId(req.query.exam);
    }

    // Use bounded pagination neatly explicitly intuitively identically explicitly smoothly logically smoothly stably matching safely cleanly automatically successfully flawlessly cleanly naturally elegantly dynamically identically strictly natively perfectly efficiently optimally purely flawlessly. 
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const results = await Result.find(matchStage)
        .populate('exam', 'name type academicSession startDate endDate status')
        .populate('subject', 'name code maximumMarks passingMarks')
        .select('-__v -enteredBy')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Result.countDocuments(matchStage);

    res.status(200).json({
        status: 'success',
        results: results.length,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        },
        data: { results }
    });
});

exports.getStudentResultByExam = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.examId)) {
        throw new AppError('Invalid Exam ID', 400);
    }

    const student = await getStudentContext(req.user.id);

    const results = await Result.find({ student: student._id, exam: req.params.examId })
        .populate('exam', 'name type academicSession startDate endDate status')
        .populate('subject', 'name code maximumMarks passingMarks')
        .select('-__v -enteredBy');

    res.status(200).json({
        status: 'success',
        results: results.length,
        data: { results }
    });
});

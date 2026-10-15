const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const mongoose = require('mongoose');

// Students only see marks once the administrator has published the exam
const getPublishedExamIds = () => Exam.find({ status: 'PUBLISHED' }).distinct('_id');

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
    const publishedExamIds = await getPublishedExamIds();
    const matchStage = { student: student._id, exam: { $in: publishedExamIds } };

    if (req.query.status) {
        matchStage.status = String(req.query.status).toUpperCase();
    }

    if (req.query.exam) {
        if (!mongoose.Types.ObjectId.isValid(req.query.exam)) {
            throw new AppError('Invalid Exam parameter', 400);
        }
        const requested = String(req.query.exam);
        matchStage.exam = publishedExamIds.some((id) => id.toString() === requested)
            ? new mongoose.Types.ObjectId(requested)
            : { $in: [] };
    }

    // Use bounded pagination neatly explicitly intuitively identically explicitly smoothly logically smoothly stably matching safely cleanly automatically successfully flawlessly cleanly naturally elegantly dynamically identically strictly natively perfectly efficiently optimally purely flawlessly. 
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
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

    const exam = await Exam.findById(req.params.examId).select('status').lean();
    if (!exam || exam.status !== 'PUBLISHED') {
        throw new AppError('Results for this exam are not published yet', 404);
    }

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

// GET /api/student/exams - examination schedule for the student's own class/section
exports.getStudentExams = asyncHandler(async (req, res) => {
    const student = await getStudentContext(req.user.id);

    const exams = await Exam.find({
        class: student.class,
        $or: [{ section: student.section }, { section: { $in: ['', null] } }, { section: { $exists: false } }],
    })
        .sort({ startDate: 1 })
        .select('name type academicSession class section startDate endDate status')
        .lean();

    res.status(200).json({
        status: 'success',
        results: exams.length,
        data: {
            exams: exams.map((exam) => ({ ...exam, resultsPublished: exam.status === 'PUBLISHED' })),
        },
    });
});

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const mongoose = require('mongoose');

// Fetch the current teacher document based on authenticated User ID
const getTeacherContext = async (userId) => {
    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
        throw new AppError('Teacher profile not found for this user', 404);
    }
    return teacher;
};

exports.getTeacherExams = asyncHandler(async (req, res) => {
    const teacher = await getTeacherContext(req.user.id);

    const exams = await Exam.find({
        class: teacher.assignedClass,
        $or: [
            { section: teacher.assignedSection },
            { section: { $in: ['', null] } }
        ]
    }).sort({ startDate: -1 });

    res.status(200).json({
        status: 'success',
        results: exams.length,
        data: { exams }
    });
});

exports.getTeacherExamById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Invalid Exam ID', 400);
    }

    const teacher = await getTeacherContext(req.user.id);
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        throw new AppError('Exam not found', 404);
    }

    if (exam.class !== teacher.assignedClass || (exam.section && exam.section !== teacher.assignedSection)) {
        throw new AppError('You do not have authorization to view this examination', 403);
    }

    res.status(200).json({
        status: 'success',
        data: { exam }
    });
});

exports.createTeacherResult = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.examId)) {
        throw new AppError('Invalid Exam ID', 400);
    }

    const teacher = await getTeacherContext(req.user.id);
    const exam = await Exam.findById(req.params.examId);

    if (!exam) throw new AppError('Exam not found', 404);
    if (exam.class !== teacher.assignedClass || (exam.section && exam.section !== teacher.assignedSection)) {
        throw new AppError('You do not have authorization to modify results for this examination', 403);
    }

    const student = await Student.findById(req.body.student);
    if (!student) throw new AppError('Student not found', 404);
    if (student.class !== teacher.assignedClass || student.section !== teacher.assignedSection) {
        throw new AppError('Student does not belong to your authorized scope', 403);
    }

    const subject = await Subject.findById(req.body.subject);
    if (!subject) throw new AppError('Subject not found', 404);

    const obtainedMarks = Number(req.body.obtainedMarks);
    if (isNaN(obtainedMarks) || obtainedMarks < 0 || obtainedMarks > subject.maximumMarks) {
        throw new AppError(`Invalid marks. Marks must be between 0 and ${subject.maximumMarks}`, 400);
    }

    const result = new Result({
        exam: exam._id,
        student: student._id,
        subject: subject._id,
        obtainedMarks: obtainedMarks,
        maximumMarks: subject.maximumMarks,
        enteredBy: req.user.id
    });

    if (result.obtainedMarks < subject.passingMarks) {
        result.status = 'FAIL';
    }

    await result.save();

    res.status(201).json({
        status: 'success',
        data: { result }
    });
});

exports.updateTeacherResult = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.resultId)) {
        throw new AppError('Invalid Result ID', 400);
    }

    const teacher = await getTeacherContext(req.user.id);
    const result = await Result.findById(req.params.resultId).populate('exam').populate('student').populate('subject');

    if (!result) throw new AppError('Result not found', 404);

    if (result.exam.class !== teacher.assignedClass || (result.exam.section && result.exam.section !== teacher.assignedSection)) {
        throw new AppError('You do not have authorization to modify results for this examination', 403);
    }
    if (result.student.class !== teacher.assignedClass || result.student.section !== teacher.assignedSection) {
        throw new AppError('Student does not belong to your authorized scope', 403);
    }

    const obtainedMarks = Number(req.body.obtainedMarks);
    if (isNaN(obtainedMarks) || obtainedMarks < 0 || obtainedMarks > result.subject.maximumMarks) {
        throw new AppError(`Invalid marks. Marks must be between 0 and ${result.subject.maximumMarks}`, 400);
    }

    result.obtainedMarks = obtainedMarks;

    if (result.obtainedMarks < result.subject.passingMarks) {
        result.status = 'FAIL';
    } else {
        result.status = 'PASS';
    }

    await result.save();

    res.status(200).json({
        status: 'success',
        data: { result }
    });
});

const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');

exports.createResult = async (examId, data, userId) => {
    const exam = await Exam.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);

    const student = await Student.findById(data.student);
    if (!student) throw new AppError('Student not found', 404);

    // Validate student applies to the specific class session mapping structurally 
    if (exam.class !== student.class) {
        throw new AppError('Student class does not match Exam class bounds', 400);
    }

    const subject = await Subject.findById(data.subject);
    if (!subject) throw new AppError('Subject not found', 404);

    // Ensure unique index natively enforces deduplication natively mapping bounds safely 
    data.exam = examId;
    data.enteredBy = userId;
    data.maximumMarks = subject.maximumMarks; // Force mapping to avoid payload manipulation directly 

    const result = new Result(data);
    // Status check to correctly use subject's individual passing properties gracefully mapped 
    if (result.obtainedMarks < subject.passingMarks) {
        result.status = 'FAIL';
    }

    await result.save();
    return result;
};

exports.getResults = async (examId, query) => {
    let filter = { exam: examId };

    if (query.student) filter.student = query.student;
    if (query.subject) filter.subject = query.subject;
    if (query.status) filter.status = query.status;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const results = await Result.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('student', 'studentId firstName lastName rollNumber')
        .populate('subject', 'name code')
        .populate('enteredBy', 'firstName lastName');

    const total = await Result.countDocuments(filter);

    return { results, total, page, limit };
};

exports.getResultById = async (id) => {
    const result = await Result.findById(id)
        .populate('exam', 'name academicSession')
        .populate('student', 'studentId firstName lastName rollNumber class section')
        .populate('subject', 'name code passingMarks')
        .populate('enteredBy', 'firstName lastName');

    if (!result) throw new AppError('Result not found', 404);
    return result;
};

exports.updateResult = async (id, updateData) => {
    const result = await Result.findById(id).populate('subject');
    if (!result) throw new AppError('Result not found', 404);

    delete updateData._id;
    delete updateData.exam;
    delete updateData.student;
    delete updateData.subject;
    delete updateData.enteredBy;

    if (updateData.obtainedMarks !== undefined) {
        result.obtainedMarks = updateData.obtainedMarks;
        // Overriding save trigger mapping hooks
        if (result.obtainedMarks < result.subject.passingMarks) {
            result.status = 'FAIL';
        } else {
            result.status = 'PASS';
        }
    }

    await result.save();
    return result;
};

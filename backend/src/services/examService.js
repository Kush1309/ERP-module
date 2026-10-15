const Exam = require('../models/Exam');
const Result = require('../models/Result');
const { notifyUsers, userIdsForClass } = require('./notificationService');
const AppError = require('../utils/AppError');

const EXAM_FIELDS = ['name', 'type', 'academicSession', 'class', 'section', 'startDate', 'endDate', 'status'];

const pickExamFields = (data = {}) => {
    const clean = {};
    EXAM_FIELDS.forEach((field) => {
        if (data[field] !== undefined) clean[field] = data[field];
    });
    return clean;
};

exports.createExam = async (examData, userId) => {
    const exam = new Exam({ ...pickExamFields(examData), createdBy: userId });
    await exam.save();
    return exam;
};

exports.getExams = async (query = {}) => {
    let filter = {};

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }
    if (query.class) {
        filter.class = query.class;
    }
    if (query.section) {
        filter.section = query.section;
    }
    if (query.status) {
        filter.status = query.status;
    }

    if (query.search) {
        const safeSearch = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.name = { $regex: safeSearch, $options: 'i' };
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const exams = await Exam.find(filter)
        .sort({ startDate: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email');

    const total = await Exam.countDocuments(filter);

    return { exams, total, page, limit };
};

exports.getExamById = async (id) => {
    const exam = await Exam.findById(id).populate('createdBy', 'firstName lastName email');
    if (!exam) throw new AppError('Exam not found', 404);
    return exam;
};

exports.updateExam = async (id, updateData) => {
    const exam = await Exam.findById(id);
    if (!exam) throw new AppError('Exam not found', 404);

    const wasPublished = exam.status === 'PUBLISHED';
    // Only whitelisted fields can be changed (protects _id, createdBy, timestamps)
    Object.assign(exam, pickExamFields(updateData));
    await exam.save();

    if (!wasPublished && exam.status === 'PUBLISHED') {
        const recipients = await userIdsForClass(exam.class, exam.section || null);
        await notifyUsers(recipients, {
            type: 'RESULT',
            title: `Results published: ${exam.name}`,
            message: `Results for ${exam.name} (${exam.academicSession}) are now available.`,
            link: '/student/results',
        });
    }
    return exam;
};

exports.deleteExam = async (id) => {
    const exam = await Exam.findById(id);
    if (!exam) throw new AppError('Exam not found', 404);

    // Deleting an exam with recorded marks would orphan those results
    const resultCount = await Result.countDocuments({ exam: exam._id });
    if (resultCount > 0) {
        throw new AppError(`Cannot delete this exam because ${resultCount} result(s) have been recorded for it`, 409);
    }

    await exam.deleteOne();
    return { message: 'Exam deleted successfully' };
};

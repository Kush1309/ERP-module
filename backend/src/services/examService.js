const Exam = require('../models/Exam');
const AppError = require('../utils/AppError');

exports.createExam = async (examData, userId) => {
    examData.createdBy = userId;
    const exam = new Exam(examData);
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
        const safeSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    // Protected fields
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    Object.assign(exam, updateData);
    await exam.save();
    return exam;
};

exports.deleteExam = async (id) => {
    const exam = await Exam.findById(id);
    if (!exam) throw new AppError('Exam not found', 404);

    // TODO Future: Verify if results exist before permitting delete

    await exam.deleteOne();
    return { message: 'Exam deleted successfully' };
};

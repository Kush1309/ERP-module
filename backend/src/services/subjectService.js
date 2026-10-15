const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');

const SUBJECT_FIELDS = ['name', 'code', 'maximumMarks', 'passingMarks'];

const pickSubjectFields = (data = {}) => {
    const clean = {};
    SUBJECT_FIELDS.forEach((field) => {
        if (data[field] !== undefined) clean[field] = data[field];
    });
    return clean;
};

exports.createSubject = async (rawSubjectData) => {
    const subjectData = pickSubjectFields(rawSubjectData);
    if (typeof subjectData.code !== 'string' || !subjectData.code.trim()) {
        throw new AppError('Subject code is required', 400);
    }

    const existingCode = await Subject.findOne({ code: subjectData.code.trim().toUpperCase() });
    if (existingCode) {
        throw new AppError('Subject with this code already exists', 409);
    }

    const subject = new Subject(subjectData);
    await subject.save();
    return subject;
};

exports.getSubjects = async (query = {}) => {
    let filter = {};
    if (query.search) {
        const safeSearch = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
            { name: { $regex: safeSearch, $options: 'i' } },
            { code: { $regex: safeSearch, $options: 'i' } }
        ];
    }

    const subjects = await Subject.find(filter).sort({ name: 1 });
    return subjects;
};

exports.getSubjectById = async (id) => {
    const subject = await Subject.findById(id);
    if (!subject) throw new AppError('Subject not found', 404);
    return subject;
};

exports.updateSubject = async (id, updateData) => {
    const subject = await Subject.findById(id);
    if (!subject) throw new AppError('Subject not found', 404);

    const updates = pickSubjectFields(updateData);

    if (typeof updates.code === 'string' && updates.code.trim().toUpperCase() !== subject.code) {
        const existingCode = await Subject.findOne({ code: updates.code.trim().toUpperCase() });
        if (existingCode) throw new AppError('Subject with this code already exists', 409);
    }

    Object.assign(subject, updates);
    await subject.save();
    return subject;
};

exports.deleteSubject = async (id) => {
    const subject = await Subject.findById(id);
    if (!subject) throw new AppError('Subject not found', 404);

    // Do not allow deletion while results or timetable slots still reference the subject
    const Result = require('../models/Result');
    const Timetable = require('../models/Timetable');
    const [resultCount, timetableCount] = await Promise.all([
        Result.countDocuments({ subject: subject._id }),
        Timetable.countDocuments({ subject: subject._id }),
    ]);
    if (resultCount > 0 || timetableCount > 0) {
        throw new AppError(`Cannot delete this subject: it is used by ${resultCount} result(s) and ${timetableCount} timetable slot(s)`, 409);
    }

    await subject.deleteOne();
    return { message: 'Subject deleted successfully' };
};

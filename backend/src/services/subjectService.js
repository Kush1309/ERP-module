const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');

exports.createSubject = async (subjectData) => {
    const existingCode = await Subject.findOne({ code: subjectData.code.trim().toUpperCase() });
    if (existingCode) {
        throw new AppError('Subject with this code already exists', 400);
    }

    const subject = new Subject(subjectData);
    await subject.save();
    return subject;
};

exports.getSubjects = async (query = {}) => {
    let filter = {};
    if (query.search) {
        const safeSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    if (updateData.code && updateData.code.trim().toUpperCase() !== subject.code) {
        const existingCode = await Subject.findOne({ code: updateData.code.trim().toUpperCase() });
        if (existingCode) throw new AppError('Subject with this code already exists', 400);
    }

    delete updateData._id; // Ensure _id is protected

    Object.assign(subject, updateData);
    await subject.save();
    return subject;
};

exports.deleteSubject = async (id) => {
    const subject = await Subject.findById(id);
    if (!subject) throw new AppError('Subject not found', 404);

    // Future Check: Wait on exam results if dependent before deletion 
    // (Module states: Do not allow deletion when dependent exam/result records require the subject. But exams/results don't yet hook to subject directly in these models, we'd add that check when fully fleshing exams.)

    await subject.deleteOne();
    return { message: 'Subject deleted successfully' };
};

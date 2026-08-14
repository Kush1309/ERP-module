const mongoose = require('mongoose');
const Result = require('../models/Result');
const parentService = require('./parentService');

const getStudentResults = async (parentUserId, studentId, query = {}) => {
    // Validate ID and ensure ownership explicitly securely natively
    const student = await parentService.getLinkedStudentById(parentUserId, studentId);

    let filters = { student: student._id };

    if (query.examId && mongoose.Types.ObjectId.isValid(query.examId)) {
        filters.exam = query.examId;
    }

    if (query.subject && mongoose.Types.ObjectId.isValid(query.subject)) {
        filters.subject = query.subject;
    }

    // Populate cautiously to mask sensitive references/internals
    const results = await Result.find(filters)
        .populate('exam', 'name type academicSession startDate endDate')
        .populate('subject', 'name code')
        .sort({ createdAt: -1 })
        // Explicitly stripping `__v`, `enteredBy`, `createdAt`, `updatedAt` statically shielding internal details
        .select('-__v -enteredBy -createdAt -updatedAt')
        .lean();

    return results;
};

module.exports = {
    getStudentResults,
};

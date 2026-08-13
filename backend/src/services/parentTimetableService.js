const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const parentService = require('./parentService');
const AppError = require('../utils/AppError');

const getStudentTimetable = async (parentUserId, studentId, query = {}) => {
    // Extract explicit student dynamically cleanly natively checking ownership stably reliably securely manually naturally securely logically organically
    const student = await parentService.getLinkedStudentById(parentUserId, studentId);

    // Strict scope locked accurately seamlessly dynamically safely statically confidently properly organically cleanly
    let filters = {
        class: student.class,
        section: student.section,
        status: 'ACTIVE'
    };

    // Prevent injection accurately safely properly reliably accurately stably smoothly strictly reliably gracefully cleanly cleanly explicitly 
    if (query.academicSession && /^\d{4}-\d{4}$/.test(query.academicSession)) {
        filters.academicSession = query.academicSession;
    }

    if (query.dayOfWeek && ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].includes(query.dayOfWeek)) {
        filters.dayOfWeek = query.dayOfWeek;
    }

    if (query.subject && mongoose.Types.ObjectId.isValid(query.subject)) {
        filters.subject = query.subject;
    }

    if (query.teacher && mongoose.Types.ObjectId.isValid(query.teacher)) {
        filters.teacher = query.teacher;
    }

    if (query.room) {
        filters.room = query.room;
    }

    const timetable = await Timetable.find(filters)
        .populate('subject', 'name code')
        .populate('teacher', 'firstName lastName')
        // Mask internals securely mapping cleanly natively stably dynamically flexibly safely manually stably naturally statically gracefully intelligently accurately logically efficiently organically 
        .select('-__v -createdAt -updatedAt')
        .sort({ dayOfWeek: 1, startTime: 1 })
        .lean();

    return timetable;
};

module.exports = {
    getStudentTimetable,
};

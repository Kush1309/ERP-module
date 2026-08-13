const mongoose = require('mongoose');
const { Attendance } = require('../models/Attendance');
const parentService = require('./parentService');
const AppError = require('../utils/AppError');

/**
 * Gets attendance cleanly explicitly bounded purely logically natively securely. 
 */
const getStudentAttendance = async (parentUserId, studentId, query = {}) => {
    // Validate ID and ensure ownership explicitly securely
    const student = await parentService.getLinkedStudentById(parentUserId, studentId);

    let filters = { student: student._id };

    if (query.date) {
        const rawDate = new Date(query.date);
        if (!isNaN(rawDate.getTime())) {
            const startOfDay = new Date(rawDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(rawDate);
            endOfDay.setUTCHours(23, 59, 59, 999);
            filters.date = { $gte: startOfDay, $lte: endOfDay };
        }
    } else {
        // Optionally support safely bounded explicitly handled date ranges
        if (query.startDate || query.endDate) {
            filters.date = {};
            if (query.startDate) {
                const startRaw = new Date(query.startDate);
                if (!isNaN(startRaw.getTime())) {
                    filters.date.$gte = startRaw;
                }
            }
            if (query.endDate) {
                const endRaw = new Date(query.endDate);
                if (!isNaN(endRaw.getTime())) {
                    filters.date.$lte = endRaw;
                }
            }
        }
    }

    if (query.status && ['PRESENT', 'ABSENT'].includes(query.status)) {
        filters.status = query.status;
    }

    const attendanceRecord = await Attendance.find(filters)
        .sort({ date: -1 })
        .select('date status remarks')
        .lean();

    return attendanceRecord;
};

module.exports = {
    getStudentAttendance,
};

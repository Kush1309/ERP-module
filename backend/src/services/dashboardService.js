const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { Attendance } = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const FeeRecord = require('../models/FeeRecord');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Homework = require('../models/Homework');
const TransportRoute = require('../models/TransportRoute');
const TransportAllocation = require('../models/TransportAllocation');
const Notice = require('../models/Notice');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Timetable = require('../models/Timetable');

const getAdminMetrics = async (filters = {}) => {
    let { class: className, section } = filters;

    const studentQuery = {};
    if (className) studentQuery.class = className;
    if (section) studentQuery.section = section;

    let matchingStudentIds = null;
    if (className || section) {
        const students = await Student.find(studentQuery).select('_id').lean();
        matchingStudentIds = students.map(s => s._id);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const promises = [];

    // 1. Students
    promises.push(
        Student.countDocuments(studentQuery),
        Student.countDocuments({ ...studentQuery, status: 'ACTIVE' }),
        Student.countDocuments({ ...studentQuery, status: 'INACTIVE' })
    );

    // 2. Teachers
    promises.push(
        Teacher.countDocuments(),
        // Active teachers count by joining User
        Teacher.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { $unwind: '$userData' },
            { $match: { 'userData.isActive': true } },
            { $count: 'active' }
        ]).then(res => res[0]?.active || 0)
    );

    // 3. Attendance (Today)
    const attendanceQuery = { date: { $gte: today } };
    if (matchingStudentIds !== null) {
        attendanceQuery.student = { $in: matchingStudentIds };
    }
    promises.push(
        Attendance.countDocuments({ ...attendanceQuery, status: 'PRESENT' }),
        Attendance.countDocuments({ ...attendanceQuery, status: 'ABSENT' })
    );

    // 4. Leave
    promises.push(
        LeaveRequest.countDocuments({ status: 'PENDING' }),
        LeaveRequest.countDocuments({ status: 'APPROVED' }),
        LeaveRequest.countDocuments({ status: 'REJECTED' })
    );

    // 5. Fees
    const feeMatch = {};
    if (matchingStudentIds !== null) {
        feeMatch.studentId = { $in: matchingStudentIds };
    }
    promises.push(
        FeeRecord.aggregate([
            { $match: feeMatch },
            {
                $group: {
                    _id: null,
                    totalDue: { $sum: '$amountDue' },
                    totalPaid: { $sum: '$amountPaid' },
                    paidRecords: {
                        $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
                    },
                    pendingRecords: {
                        $sum: { $cond: [{ $in: ['$status', ['PENDING', 'PARTIAL', 'OVERDUE']] }, 1, 0] }
                    }
                }
            }
        ]).then(res => res[0] || { totalDue: 0, totalPaid: 0, paidRecords: 0, pendingRecords: 0 })
    );

    // 6. Library
    promises.push(
        Book.aggregate([
            {
                $group: {
                    _id: null,
                    totalBooks: { $sum: '$totalCopies' },
                    available: { $sum: '$availableCopies' }
                }
            }
        ]).then(res => res[0] || { totalBooks: 0, available: 0 }),
        BookIssue.countDocuments({ status: 'ISSUED' })
    );

    // 7. Homework
    const hwQuery = {};
    if (className) hwQuery.class = className;
    if (section) hwQuery.section = section;
    promises.push(
        Homework.countDocuments(hwQuery),
        Homework.countDocuments({ ...hwQuery, status: 'PUBLISHED' })
    );

    // 8. Transport
    promises.push(
        TransportRoute.countDocuments(),
        TransportAllocation.countDocuments({ status: 'ACTIVE' }),
        TransportAllocation.countDocuments()
    );

    // 9. Notices
    promises.push(
        Notice.find().sort({ createdAt: -1 }).limit(3).lean()
    );

    // 10. Filters metadata (unique classes and sections from students)
    promises.push(
        Student.distinct('class'),
        Student.distinct('section')
    );

    const [
        totalStudents, activeStudents, inactiveStudents,
        totalTeachers, activeTeachers,
        presentCount, absentCount,
        pendingLeaves, approvedLeaves, rejectedLeaves,
        feeData,
        libraryData, issuedBooks,
        totalHomework, activeHomework,
        totalRoutes, activeAllocations, totalAllocations,
        recentNotices,
        classes, sections
    ] = await Promise.all(promises);

    const totalAttendanceExpected = presentCount + absentCount;
    const attendancePercentage = totalAttendanceExpected > 0 ? Math.round((presentCount / totalAttendanceExpected) * 100) : null;

    return {
        students: {
            total: totalStudents,
            active: activeStudents,
            inactive: inactiveStudents
        },
        teachers: {
            total: totalTeachers,
            active: activeTeachers,
            inactive: totalTeachers - activeTeachers
        },
        attendance: {
            percentage: attendancePercentage,
            present: presentCount,
            absent: absentCount,
            recorded: totalAttendanceExpected > 0
        },
        leaves: {
            pending: pendingLeaves,
            approved: approvedLeaves,
            rejected: rejectedLeaves
        },
        fees: {
            totalDue: feeData.totalDue,
            totalPaid: feeData.totalPaid,
            pendingAmount: feeData.totalDue - feeData.totalPaid,
            paidRecords: feeData.paidRecords,
            pendingRecords: feeData.pendingRecords
        },
        library: {
            totalBooks: libraryData.totalBooks,
            available: libraryData.available,
            issued: issuedBooks
        },
        homework: {
            total: totalHomework,
            active: activeHomework
        },
        transport: {
            routes: totalRoutes,
            activeAllocations: activeAllocations,
            totalAllocations: totalAllocations
        },
        notices: recentNotices,
        meta: {
            classes: classes.sort(),
            sections: sections.sort()
        }
    };
};

const getStudentMetrics = async (userId) => {
    const student = await Student.findOne({ user: userId }).lean();
    if (!student) {
        throw new Error('Student record not found for this user');
    }

    const { _id: studentId, class: className, section } = student;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const promises = [];

    // 1. Attendance
    promises.push(
        Attendance.countDocuments({ student: studentId, date: { $gte: today } }),
        Attendance.countDocuments({ student: studentId, status: 'PRESENT' }),
        Attendance.countDocuments({ student: studentId, status: 'ABSENT' })
    );

    // 2. Homework
    promises.push(
        Homework.countDocuments({ class: className, section: section, status: 'PUBLISHED' }),
        Homework.find({ class: className, section: section, status: 'PUBLISHED' })
            .sort({ dueDate: 1 })
            .limit(3)
            .lean()
    );

    // 3. Exams
    promises.push(
        Exam.countDocuments({ class: className, section: section, startDate: { $gt: new Date() }, status: { $in: ['PUBLISHED', 'UPCOMING'] } }),
        Exam.findOne({ class: className, section: section, startDate: { $gt: new Date() }, status: { $in: ['PUBLISHED', 'UPCOMING'] } })
            .sort({ startDate: 1 })
            .lean()
    );

    // 4. Results
    promises.push(
        Result.find({ student: studentId }).sort({ createdAt: -1 }).limit(3).populate('exam', 'name').lean()
    );

    // 5. Timetable (Today)
    const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
    promises.push(
        Timetable.find({ class: className, section: section, dayOfWeek })
            .populate('subject', 'name')
            .populate('teacher', 'firstName lastName')
            .sort({ startTime: 1 })
            .lean()
    );

    // 6. Fees
    promises.push(
        FeeRecord.aggregate([
            { $match: { student: studentId } },
            {
                $group: {
                    _id: null,
                    totalPending: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['PENDING', 'PARTIAL', 'OVERDUE']] }, { $subtract: ['$amountDue', '$amountPaid'] }, 0]
                        }
                    }
                }
            }
        ]).then(res => res[0]?.totalPending || 0)
    );

    // 7. Library
    promises.push(
        BookIssue.countDocuments({ student: studentId, status: 'ISSUED' }),
        BookIssue.findOne({ student: studentId, status: 'ISSUED' })
            .sort({ dueDate: 1 })
            .lean()
    );

    // 8. Leave
    promises.push(
        LeaveRequest.countDocuments({ student: studentId, status: 'PENDING' }),
        LeaveRequest.countDocuments({ student: studentId, status: 'APPROVED' }),
        LeaveRequest.countDocuments({ student: studentId, status: 'REJECTED' })
    );

    // 9. Transport
    promises.push(
        TransportAllocation.findOne({ student: studentId, status: 'ACTIVE' })
            .populate('route', 'name stopName')
            .lean()
    );

    // 10. Notices (For student role / class)
    promises.push(
        Notice.find({
            $or: [
                { targetAudience: 'ALL' },
                { targetAudience: 'STUDENTS' }
            ]
        }).sort({ createdAt: -1 }).limit(3).lean()
    );

    // 11. Messages
    promises.push(
        Conversation.find({ participants: userId }).distinct('_id').then(conversationIds => {
            if (!conversationIds.length) return 0;
            return Message.countDocuments({
                conversation: { $in: conversationIds },
                sender: { $ne: userId },
                readBy: { $ne: userId }
            });
        })
    );

    const [
        attendanceTodayRecord, presentCount, absentCount,
        pendingHomeworkCount, latestHomework,
        upcomingExamsCount, nextExam,
        recentResults,
        todayTimetable,
        feePendingAmount,
        activeBookIssuesCount, nextBookReturn,
        pendingLeaves, approvedLeaves, rejectedLeaves,
        transportAllocation,
        recentNotices,
        unreadMessagesCount
    ] = await Promise.all(promises);

    const totalAttendanceExpected = presentCount + absentCount;
    const attendancePercentage = totalAttendanceExpected > 0 ? Math.round((presentCount / totalAttendanceExpected) * 100) : null;

    return {
        student: {
            firstName: student.firstName,
            lastName: student.lastName,
            studentId: student.studentId,
            class: student.class,
            section: student.section,
        },
        attendance: {
            percentage: attendancePercentage,
            present: presentCount,
            absent: absentCount,
        },
        homework: {
            pending: pendingHomeworkCount,
            latest: latestHomework,
        },
        examinations: {
            upcomingCount: upcomingExamsCount,
            next: nextExam,
        },
        results: recentResults,
        timetable: todayTimetable,
        fees: {
            pendingAmount: feePendingAmount,
            hasPending: feePendingAmount > 0
        },
        library: {
            activeIssues: activeBookIssuesCount,
            nextReturnDate: nextBookReturn ? nextBookReturn.dueDate : null,
        },
        leave: {
            pending: pendingLeaves,
            approved: approvedLeaves,
            rejected: rejectedLeaves,
        },
        transport: transportAllocation,
        notices: recentNotices,
        messages: {
            unreadCount: unreadMessagesCount
        }
    };
};

module.exports = {
    getAdminMetrics,
    getStudentMetrics
};

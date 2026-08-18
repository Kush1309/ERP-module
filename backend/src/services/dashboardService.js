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

const getTeacherMetrics = async (userId) => {
    const teacher = await Teacher.findOne({ user: userId }).lean();
    if (!teacher) {
        throw new Error('Teacher record not found for this user');
    }

    const { _id: teacherId, assignedClass, assignedSection } = teacher;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();

    const promises = [];

    // 1. My Students
    promises.push(
        Student.countDocuments({ class: assignedClass, section: assignedSection }),
        Student.countDocuments({ class: assignedClass, section: assignedSection, status: 'ACTIVE' })
    );

    // 2. Today's Attendance for Teacher's Class
    promises.push(
        Student.find({ class: assignedClass, section: assignedSection }).select('_id').lean().then(students => {
            const studentIds = students.map(s => s._id);
            if (!studentIds.length) return { present: 0, absent: 0 };
            return Promise.all([
                Attendance.countDocuments({ student: { $in: studentIds }, date: { $gte: today }, status: 'PRESENT' }),
                Attendance.countDocuments({ student: { $in: studentIds }, date: { $gte: today }, status: 'ABSENT' })
            ]).then(([present, absent]) => ({ present, absent }));
        })
    );

    // 3. Pending Homework (created by this teacher OR for this class/section)
    promises.push(
        Homework.countDocuments({ class: assignedClass, section: assignedSection, status: 'PUBLISHED' }),
        Homework.find({ class: assignedClass, section: assignedSection, status: 'PUBLISHED' }).sort({ dueDate: 1 }).limit(3).lean()
    );

    // 4. Upcoming Exams
    promises.push(
        Exam.countDocuments({ class: assignedClass, section: assignedSection, startDate: { $gt: new Date() }, status: { $in: ['PUBLISHED', 'UPCOMING'] } }),
        Exam.findOne({ class: assignedClass, section: assignedSection, startDate: { $gt: new Date() }, status: { $in: ['PUBLISHED', 'UPCOMING'] } }).sort({ startDate: 1 }).lean()
    );

    // 5. Today's Timetable
    promises.push(
        Timetable.find({ teacher: teacherId, dayOfWeek })
            .populate('subject', 'name')
            .sort({ startTime: 1 })
            .lean()
    );

    // 6. My Classes
    promises.push(
        Promise.resolve([{
            className: assignedClass,
            section: assignedSection,
            subject: 'Class Teacher',
            studentCount: null
        }])
    );

    // 7. Recent Notices
    promises.push(
        Notice.find({
            $or: [
                { targetAudience: 'ALL' },
                { targetAudience: 'TEACHERS' }
            ]
        }).sort({ createdAt: -1 }).limit(3).lean()
    );

    // 8. Leave Management
    promises.push(
        LeaveRequest.countDocuments({ requesterId: teacherId, requesterModel: 'Teacher', status: 'PENDING' }),
        LeaveRequest.countDocuments({ requesterId: teacherId, requesterModel: 'Teacher', status: 'APPROVED' }),
        LeaveRequest.countDocuments({ requesterId: teacherId, requesterModel: 'Teacher', status: 'REJECTED' })
    );

    // 9. Messages
    promises.push(
        Conversation.find({ participants: userId }).distinct('_id').then(async conversationIds => {
            if (!conversationIds.length) return { unreadCount: 0, recent: [] };
            const unreadCount = await Message.countDocuments({
                conversation: { $in: conversationIds },
                sender: { $ne: userId },
                readBy: { $ne: userId }
            });
            // Fetch recent messages logically (requires grouping by conversation, but we'll approximate)
            // Just return empty recent for now or minimal
            return { unreadCount, recent: [] };
        })
    );

    const [
        totalStudents, activeStudents,
        attendanceToday,
        pendingHomeworkCount, latestHomework,
        upcomingExamsCount, nextExam,
        todayTimetable,
        myClasses,
        recentNotices,
        pendingLeaves, approvedLeaves, rejectedLeaves,
        messagesData
    ] = await Promise.all(promises);

    if (myClasses && myClasses.length > 0) {
        myClasses[0].studentCount = totalStudents;
    }

    const { present, absent } = attendanceToday;
    const totalAttendanceExpected = present + absent;
    const attendancePercentage = totalAttendanceExpected > 0 ? Math.round((present / totalAttendanceExpected) * 100) : null;

    return {
        teacher: {
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            assignedClass,
            assignedSection
        },
        students: {
            total: totalStudents,
            active: activeStudents
        },
        attendance: {
            percentage: attendancePercentage,
            present: present,
            absent: absent,
        },
        homework: {
            pending: pendingHomeworkCount,
            latest: latestHomework,
        },
        examinations: {
            upcomingCount: upcomingExamsCount,
            next: nextExam,
        },
        timetable: todayTimetable,
        classes: myClasses,
        leave: {
            pending: pendingLeaves,
            approved: approvedLeaves,
            rejected: rejectedLeaves,
        },
        notices: recentNotices,
        messages: messagesData,
        library: { hasBooks: false },
        transport: { allocation: null }
    };
};

module.exports = {
    getAdminMetrics,
    getStudentMetrics,
    getTeacherMetrics
};

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
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Timetable = require('../models/Timetable');
const ParentProfile = require('../models/ParentProfile');
const AcademicYear = require('../models/AcademicYear');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Event = require('../models/Event');
const { outstanding: feeOutstanding } = require('../utils/feeMath');
const AppError = require('../utils/AppError');

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

    const { start: today, end: tomorrow } = getUtcDayRange();

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
    const attendanceQuery = { date: { $gte: today, $lt: tomorrow } };
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

// Attendance dates are stored at 00:00 UTC, so "today" must be computed in UTC too
const getUtcDayRange = () => {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
};

const getTodayName = () => new Date().toLocaleString('en-US', { weekday: 'long' }).toUpperCase();

const examScopeFilter = (className, section) => ({
    class: className,
    $or: [{ section }, { section: { $in: ['', null] } }, { section: { $exists: false } }],
});

const publishedNoticeWindow = () => ({
    status: 'PUBLISHED',
    $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
    ],
});

const buildRecentMessages = async (userId) => {
    const conversationIds = await Conversation.find({ participants: userId }).distinct('_id');
    if (!conversationIds.length) {
        return { unreadCount: 0, recent: [] };
    }

    const unreadFilter = {
        conversation: { $in: conversationIds },
        sender: { $ne: userId },
        readBy: { $ne: userId },
    };

    const [unreadCount, unreadMessages] = await Promise.all([
        Message.countDocuments(unreadFilter),
        Message.find(unreadFilter).sort({ createdAt: -1 }).limit(3).lean(),
    ]);

    const senderIds = [...new Set(unreadMessages.map((m) => String(m.sender)))];
    const [users, students, teachers, parents] = await Promise.all([
        User.find({ _id: { $in: senderIds } }).select('role loginId').lean(),
        Student.find({ user: { $in: senderIds } }).select('user firstName lastName').lean(),
        Teacher.find({ user: { $in: senderIds } }).select('user firstName lastName').lean(),
        ParentProfile.find({ user: { $in: senderIds } }).select('user firstName lastName').lean(),
    ]);
    const names = new Map();
    users.forEach((u) => names.set(String(u._id), u.role === 'ADMIN' ? 'Administrator' : u.loginId));
    [...students, ...teachers, ...parents].forEach((p) => {
        const name = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        if (name) names.set(String(p.user), name);
    });

    return {
        unreadCount,
        recent: unreadMessages.map((m) => ({
            _id: m._id,
            conversation: m.conversation,
            sender: names.get(String(m.sender)) || 'Unknown',
            content: m.content,
            createdAt: m.createdAt,
            unread: true,
        })),
    };
};

const buildLibrarySummary = async (requesterId, requesterModel) => {
    const activeFilter = { requesterId, requesterModel, status: { $in: ['ISSUED', 'OVERDUE'] } };
    const [issuedCount, dueCount, nextIssue] = await Promise.all([
        BookIssue.countDocuments(activeFilter),
        BookIssue.countDocuments({ ...activeFilter, dueDate: { $lt: new Date() } }),
        BookIssue.findOne(activeFilter).sort({ dueDate: 1 }).lean(),
    ]);
    return {
        hasBooks: issuedCount > 0,
        issuedCount,
        dueCount,
        // kept for backwards compatibility with older clients
        activeIssues: issuedCount,
        nextReturnDate: nextIssue ? nextIssue.dueDate : null,
    };
};

// ---- Student dashboard ----------------------------------------------------
// Everything is scoped to the student linked to the authenticated user; the
// client never passes a student id.

// Homework is due at the end of its due date (same rule as submissions)
const homeworkDeadline = (dueDate) => {
    if (!dueDate) return null;
    const end = new Date(dueDate);
    end.setUTCHours(23, 59, 59, 999);
    return end;
};

const truncate = (text, max = 160) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

const studentNoticeFilter = (className, section) => ({
    ...publishedNoticeWindow(),
    $and: [{
        $or: [
            { audience: { $in: ['ALL', 'STUDENTS'] } },
            { audience: 'SPECIFIC_CLASS', targetClass: className },
            { audience: 'SPECIFIC_SECTION', targetClass: className, targetSection: section },
        ],
    }],
});

const getStudentMetrics = async (userId) => {
    const student = await Student.findOne({ user: userId }).lean();
    if (!student) {
        throw new AppError('Student record not found for this user', 404);
    }

    const { _id: studentId, class: className, section } = student;
    const { start: todayStart, end: todayEnd } = getUtcDayRange();
    const now = new Date();

    // Same refresh the fee pages run, so overdue status and late charges are current
    await require('./feeService').refreshOverdueStatuses();

    const currentYear = await AcademicYear.findOne({ isCurrent: true }).select('name startDate endDate').lean();

    // Attendance: present / (present + absent) — the rule used by the attendance
    // pages — limited to the current academic year when one is configured.
    const attendanceFilter = { student: studentId };
    if (currentYear) attendanceFilter.date = { $gte: currentYear.startDate, $lte: currentYear.endDate };

    const upcomingExamFilter = {
        ...examScopeFilter(className, section),
        status: { $in: ['UPCOMING', 'ACTIVE'] },
        endDate: { $gte: todayStart },
    };

    const timetableFilter = { class: className, section, dayOfWeek: getTodayName(), status: 'ACTIVE' };
    if (currentYear) timetableFilter.academicSession = currentYear.name;

    const [
        attendanceTodayRecord, presentCount, absentCount,
        homeworkItems,
        upcomingExams,
        todayTimetable,
        openFeeRecords,
        upcomingEvents,
        recentNotices,
    ] = await Promise.all([
        Attendance.findOne({ student: studentId, date: { $gte: todayStart, $lt: todayEnd } }).select('status').lean(),
        Attendance.countDocuments({ ...attendanceFilter, status: 'PRESENT' }),
        Attendance.countDocuments({ ...attendanceFilter, status: 'ABSENT' }),

        Homework.find({ class: className, section, status: 'PUBLISHED' })
            .select('title subject dueDate')
            .sort({ dueDate: 1 })
            .lean(),

        Exam.find(upcomingExamFilter).select('name type startDate endDate status').sort({ startDate: 1 }).lean(),

        Timetable.find(timetableFilter)
            .populate('subject', 'name')
            .populate('teacher', 'firstName lastName')
            .sort({ startTime: 1 })
            .lean(),

        FeeRecord.find({ studentId, status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] } })
            .select('amountDue amountPaid discount lateFee lateFeeWaived dueDate status')
            .lean(),

        Event.find({
            status: 'PUBLISHED',
            targetAudience: { $in: ['ALL', 'STUDENTS'] },
            eventDate: { $gte: todayStart },
        }).select('title eventType eventDate startTime').sort({ eventDate: 1 }).limit(5).lean(),

        Notice.find(studentNoticeFilter(className, section))
            .select('title content category priority publishedAt createdAt')
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(3)
            .lean(),
    ]);

    // Homework: pending = not submitted (or returned for changes) and not past its due date
    const submissions = homeworkItems.length
        ? await HomeworkSubmission.find({ student: studentId, homework: { $in: homeworkItems.map((h) => h._id) } })
            .select('homework status')
            .lean()
        : [];
    const submissionByHomework = new Map(submissions.map((s) => [String(s.homework), s]));

    const actionableHomework = [];
    let overdueHomework = 0;
    homeworkItems.forEach((h) => {
        const submission = submissionByHomework.get(String(h._id));
        const needsWork = !submission || submission.status === 'RETURNED';
        if (!needsWork) return;
        const deadline = homeworkDeadline(h.dueDate);
        if (deadline && deadline < now) {
            overdueHomework += 1;
            return;
        }
        actionableHomework.push({
            _id: h._id,
            title: h.title,
            subject: h.subject || null,
            dueDate: h.dueDate || null,
            status: submission ? 'RETURNED' : 'NOT_SUBMITTED',
        });
    });
    // Items with a due date first (soonest first), undated ones last
    actionableHomework.sort((a, b) => {
        if (!a.dueDate) return b.dueDate ? 1 : 0;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    // Exams: ongoing if already started, otherwise upcoming
    const exams = upcomingExams.map((e) => ({
        _id: e._id,
        name: e.name,
        type: e.type,
        startDate: e.startDate,
        endDate: e.endDate,
        ongoing: e.status === 'ACTIVE' || new Date(e.startDate) < todayStart,
    }));

    // Fees: shared fee arithmetic (concession + late charge − payments recorded by staff)
    const outstandingRecords = openFeeRecords
        .map((r) => ({ ...r, outstanding: feeOutstanding(r) }))
        .filter((r) => r.outstanding > 0);
    const outstandingAmount = Math.round(outstandingRecords.reduce((sum, r) => sum + r.outstanding, 0) * 100) / 100;
    const nextFeeDue = outstandingRecords
        .filter((r) => r.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    // Deadlines: homework, exams and student events — nothing already past
    const deadlines = [
        ...actionableHomework.filter((h) => h.dueDate).map((h) => ({
            kind: 'HOMEWORK',
            _id: h._id,
            title: h.title,
            subtitle: h.subject,
            date: h.dueDate,
            status: h.status,
            link: '/homework',
        })),
        ...exams.map((e) => ({
            kind: 'EXAM',
            _id: e._id,
            title: e.name,
            subtitle: null,
            endDate: e.endDate,
            date: e.startDate,
            status: e.ongoing ? 'ONGOING' : 'UPCOMING',
            link: '/student/exams',
        })),
        ...upcomingEvents.map((ev) => ({
            kind: 'EVENT',
            _id: ev._id,
            title: ev.title,
            subtitle: ev.startTime || null,
            date: ev.eventDate,
            status: 'SCHEDULED',
            link: '/events',
        })),
    ]
        .sort((a, b) => {
            // Ongoing exams first, then by date
            if (a.status === 'ONGOING' && b.status !== 'ONGOING') return -1;
            if (b.status === 'ONGOING' && a.status !== 'ONGOING') return 1;
            return new Date(a.date) - new Date(b.date);
        })
        .slice(0, 5);

    const totalMarked = presentCount + absentCount;

    return {
        student: {
            firstName: student.firstName,
            lastName: student.lastName,
            studentId: student.studentId,
            class: student.class,
            section: student.section,
            rollNumber: student.rollNumber || null,
            academicYear: currentYear ? currentYear.name : null,
        },
        attendance: {
            percentage: totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : null,
            present: presentCount,
            absent: absentCount,
            period: currentYear ? `Academic year ${currentYear.name}` : 'All recorded days',
            today: attendanceTodayRecord ? attendanceTodayRecord.status : null,
        },
        homework: {
            pending: actionableHomework.length,
            overdue: overdueHomework,
            next: actionableHomework[0] || null,
        },
        examinations: {
            upcomingCount: exams.length,
            next: exams[0] || null,
        },
        fees: {
            outstandingAmount,
            hasDues: outstandingAmount > 0,
            // kept for older clients
            pendingAmount: outstandingAmount,
            hasPending: outstandingAmount > 0,
            overdueCount: outstandingRecords.filter((r) => r.status === 'OVERDUE').length,
            nextDueDate: nextFeeDue ? nextFeeDue.dueDate : null,
        },
        timetable: {
            day: getTodayName(),
            classes: todayTimetable.map((t) => ({
                _id: t._id,
                startTime: t.startTime,
                endTime: t.endTime,
                subject: t.subject?.name || null,
                teacher: t.teacher ? `${t.teacher.firstName || ''} ${t.teacher.lastName || ''}`.trim() : null,
                room: t.room || null,
            })),
        },
        deadlines,
        notices: {
            recent: recentNotices.map((n) => ({
                _id: n._id,
                title: n.title,
                category: n.category,
                priority: n.priority,
                date: n.publishedAt || n.createdAt,
                preview: truncate(n.content),
            })),
        },
    };
};

const getTeacherMetrics = async (userId) => {
    const teacher = await Teacher.findOne({ user: userId }).lean();
    if (!teacher) {
        throw new AppError('Teacher record not found for this user', 404);
    }

    const { _id: teacherId, assignedClass, assignedSection } = teacher;
    const { start: today, end: tomorrow } = getUtcDayRange();
    const dayOfWeek = getTodayName();

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
                Attendance.countDocuments({ student: { $in: studentIds }, date: { $gte: today, $lt: tomorrow }, status: 'PRESENT' }),
                Attendance.countDocuments({ student: { $in: studentIds }, date: { $gte: today, $lt: tomorrow }, status: 'ABSENT' })
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
        Exam.countDocuments({ ...examScopeFilter(assignedClass, assignedSection), startDate: { $gt: new Date() }, status: { $in: ['PUBLISHED', 'UPCOMING'] } }),
        Exam.findOne({ ...examScopeFilter(assignedClass, assignedSection), startDate: { $gt: new Date() }, status: { $in: ['PUBLISHED', 'UPCOMING'] } }).sort({ startDate: 1 }).lean()
    );

    // 5. Today's Timetable
    promises.push(
        Timetable.find({ teacher: teacherId, dayOfWeek, status: 'ACTIVE' })
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
            ...publishedNoticeWindow(),
            $and: [{ $or: [{ audience: { $in: ['ALL', 'TEACHERS'] } }] }],
        }).sort({ publishedAt: -1, createdAt: -1 }).limit(3).lean()
    );

    // 8. Leave Management
    promises.push(
        LeaveRequest.countDocuments({ requesterId: teacherId, requesterModel: 'Teacher', status: 'PENDING' }),
        LeaveRequest.countDocuments({ requesterId: teacherId, requesterModel: 'Teacher', status: 'APPROVED' }),
        LeaveRequest.countDocuments({ requesterId: teacherId, requesterModel: 'Teacher', status: 'REJECTED' })
    );

    // 9. Messages
    promises.push(buildRecentMessages(userId));

    // 10. Library (books issued to this teacher)
    promises.push(buildLibrarySummary(teacherId, 'Teacher'));

    const [
        totalStudents, activeStudents,
        attendanceToday,
        pendingHomeworkCount, latestHomework,
        upcomingExamsCount, nextExam,
        todayTimetable,
        myClasses,
        recentNotices,
        pendingLeaves, approvedLeaves, rejectedLeaves,
        messagesData,
        librarySummary
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
        library: librarySummary,
        // Transport allocations are only modelled for students
        transport: { allocation: null }
    };
};

module.exports = {
    getAdminMetrics,
    getStudentMetrics,
    getTeacherMetrics
};

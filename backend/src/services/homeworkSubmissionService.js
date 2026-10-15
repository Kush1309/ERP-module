const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ParentProfile = require('../models/ParentProfile');
const AppError = require('../utils/AppError');
const { assertObjectId } = require('../utils/queryHelpers');
const { notifyUsers } = require('./notificationService');

// Homework is due at the end of its due date
const isPastDue = (dueDate, at = new Date()) => {
    if (!dueDate) return false;
    const end = new Date(dueDate);
    end.setUTCHours(23, 59, 59, 999);
    return at > end;
};

const loadPublishedHomeworkForStudent = async (homeworkId, student) => {
    assertObjectId(homeworkId, 'homework ID');
    const homework = await Homework.findById(homeworkId).lean();
    if (!homework || homework.status !== 'PUBLISHED' || homework.class !== student.class || homework.section !== student.section) {
        throw new AppError('Homework not found', 404);
    }
    return homework;
};

const submit = async (userId, homeworkId, { content = '', attachmentUrl = '' }) => {
    const student = await Student.findOne({ user: userId }).lean();
    if (!student) throw new AppError('Student profile not found', 404);
    const homework = await loadPublishedHomeworkForStudent(homeworkId, student);

    const existing = await HomeworkSubmission.findOne({ homework: homework._id, student: student._id });
    if (existing && existing.status === 'GRADED') {
        throw new AppError('This submission has already been graded and can no longer be changed', 409);
    }

    const submission = existing || new HomeworkSubmission({ homework: homework._id, student: student._id });
    submission.content = String(content || '').trim();
    submission.attachmentUrl = String(attachmentUrl || '').trim();
    submission.submittedAt = new Date();
    submission.isLate = isPastDue(homework.dueDate);
    submission.status = 'SUBMITTED';
    await submission.save();

    const teacher = await Teacher.findById(homework.teacherId).select('user').lean();
    if (teacher) {
        notifyUsers([teacher.user], {
            type: 'HOMEWORK',
            title: `New submission: ${homework.title}`,
            message: `${student.firstName} ${student.lastName} submitted${submission.isLate ? ' (late)' : ''}.`,
            link: '/homework',
        });
    }
    return submission.toObject();
};

// Student sees own submission; parent may ask for a linked child's submission
const getSubmissionFor = async (user, homeworkId, studentIdParam) => {
    let student;
    if (user.role === 'STUDENT') {
        student = await Student.findOne({ user: user._id }).lean();
    } else if (user.role === 'PARENT') {
        assertObjectId(studentIdParam, 'student ID');
        const profile = await ParentProfile.findOne({ user: user._id }).lean();
        if (!profile || !profile.students.some((id) => String(id) === String(studentIdParam))) {
            throw new AppError('You can only view homework of students linked to your account', 403);
        }
        student = await Student.findById(studentIdParam).lean();
    }
    if (!student) throw new AppError('Student profile not found', 404);
    const homework = await loadPublishedHomeworkForStudent(homeworkId, student);
    const submission = await HomeworkSubmission.findOne({ homework: homework._id, student: student._id }).lean();
    return { homework, submission, isPastDue: isPastDue(homework.dueDate) };
};

const assertCanManage = async (user, homework) => {
    if (user.role === 'ADMIN') return;
    if (user.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: user._id }).select('_id').lean();
        if (teacher && String(teacher._id) === String(homework.teacherId)) return;
    }
    throw new AppError('You can only review submissions for your own homework', 403);
};

// Full class tracking: every student of the class with their submission (or missing)
const listSubmissions = async (user, homeworkId) => {
    assertObjectId(homeworkId, 'homework ID');
    const homework = await Homework.findById(homeworkId).lean();
    if (!homework) throw new AppError('Homework not found', 404);
    await assertCanManage(user, homework);

    const [students, submissions] = await Promise.all([
        Student.find({ class: homework.class, section: homework.section, status: 'ACTIVE' })
            .select('studentId firstName lastName rollNumber').lean(),
        HomeworkSubmission.find({ homework: homework._id }).lean(),
    ]);
    const byStudent = new Map(submissions.map((s) => [String(s.student), s]));
    students.sort((a, b) => String(a.rollNumber).localeCompare(String(b.rollNumber), undefined, { numeric: true }));

    const rows = students.map((s) => ({ student: s, submission: byStudent.get(String(s._id)) || null }));
    const submitted = rows.filter((r) => r.submission).length;
    return {
        homework,
        rows,
        summary: {
            total: rows.length,
            submitted,
            missing: rows.length - submitted,
            late: submissions.filter((s) => s.isLate).length,
            graded: submissions.filter((s) => s.status === 'GRADED').length,
        },
    };
};

const gradeSubmission = async (user, submissionId, { grade = '', feedback = '', status = 'GRADED' }) => {
    assertObjectId(submissionId, 'submission ID');
    if (!['GRADED', 'RETURNED'].includes(status)) throw new AppError('status must be GRADED or RETURNED', 400);
    const submission = await HomeworkSubmission.findById(submissionId);
    if (!submission) throw new AppError('Submission not found', 404);
    const homework = await Homework.findById(submission.homework).lean();
    await assertCanManage(user, homework);

    submission.grade = String(grade || '').trim();
    submission.feedback = String(feedback || '').trim();
    submission.status = status;
    submission.gradedBy = user._id;
    submission.gradedAt = new Date();
    await submission.save();

    const student = await Student.findById(submission.student).select('user').lean();
    if (student) {
        notifyUsers([student.user], {
            type: 'HOMEWORK',
            title: status === 'GRADED' ? `Homework graded: ${homework.title}` : `Homework returned for changes: ${homework.title}`,
            message: [submission.grade && `Grade: ${submission.grade}`, submission.feedback].filter(Boolean).join(' — '),
            link: '/homework',
        });
    }
    return submission.toObject();
};

module.exports = { submit, getSubmissionFor, listSubmissions, gradeSubmission, isPastDue };

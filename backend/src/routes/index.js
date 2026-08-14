const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const protectedRoutes = require('./protectedRoutes');
const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const teacherRoutes = require('./teacherRoutes');
const subjectRoutes = require('./subjectRoutes');
const examRoutes = require('./examRoutes');
const resultRoutes = require('./resultRoutes');
const timetableRoutes = require('./timetableRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/protected', protectedRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/teachers', teacherRoutes);
router.use('/subjects', subjectRoutes);
router.use('/exams', examRoutes);
router.use('/results', resultRoutes);
router.use('/timetable', timetableRoutes);

const teacherExamRoutes = require('./teacherExamRoutes');
const teacherTimetableRoutes = require('./teacherTimetableRoutes');
const teacherNoticeRoutes = require('./teacherNoticeRoutes');
router.use('/teacher/exams', teacherExamRoutes);
router.use('/teacher/timetable', teacherTimetableRoutes);
router.use('/teacher/notices', teacherNoticeRoutes);

const studentResultRoutes = require('./studentResultRoutes');
const studentTimetableRoutes = require('./studentTimetableRoutes');
const studentNoticeRoutes = require('./studentNoticeRoutes');
router.use('/student/results', studentResultRoutes);
router.use('/student/timetable', studentTimetableRoutes);
router.use('/student/notices', studentNoticeRoutes);

const noticeRoutes = require('./noticeRoutes');
router.use('/notices', noticeRoutes);

const messageRoutes = require('./messageRoutes');
router.use('/messages', messageRoutes);

const homeworkRoutes = require('./homeworkRoutes');
router.use('/homework', homeworkRoutes);
const leaveRoutes = require('./leaveRoutes');
router.use('/leaves', leaveRoutes);
const libraryRoutes = require('./libraryRoutes');
router.use('/library', libraryRoutes);
const parentRoutes = require('./parentRoutes');
const parentAttendanceRoutes = require('./parentAttendanceRoutes');
const parentResultRoutes = require('./parentResultRoutes');
const parentTimetableRoutes = require('./parentTimetableRoutes');
const parentNoticeRoutes = require('./parentNoticeRoutes');

router.use('/parent/notices', parentNoticeRoutes);
router.use('/parent', parentRoutes);
router.use('/parent', parentAttendanceRoutes);
router.use('/parent', parentResultRoutes);
router.use('/parent', parentTimetableRoutes);

module.exports = router;

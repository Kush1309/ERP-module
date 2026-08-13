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
router.use('/teacher/exams', teacherExamRoutes);
router.use('/teacher/timetable', teacherTimetableRoutes);

const studentResultRoutes = require('./studentResultRoutes');
const studentTimetableRoutes = require('./studentTimetableRoutes');
router.use('/student/results', studentResultRoutes);
router.use('/student/timetable', studentTimetableRoutes);

module.exports = router;

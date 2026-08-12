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

const teacherExamRoutes = require('./teacherExamRoutes');
router.use('/teacher/exams', teacherExamRoutes);

const studentResultRoutes = require('./studentResultRoutes');
router.use('/student/results', studentResultRoutes);

module.exports = router;

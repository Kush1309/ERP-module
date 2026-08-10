const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const protectedRoutes = require('./protectedRoutes');
const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/protected', protectedRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);

module.exports = router;

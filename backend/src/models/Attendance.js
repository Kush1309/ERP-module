const mongoose = require('mongoose');

const ATTENDANCE_STATUS = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT'
};

const ATTENDANCE_STATUS_VALUES = Object.values(ATTENDANCE_STATUS);

const attendanceSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
            index: true
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ATTENDANCE_STATUS_VALUES,
            required: true,
        },
        remarks: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate attendance for the same student on the same day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = { Attendance, ATTENDANCE_STATUS, ATTENDANCE_STATUS_VALUES };

const mongoose = require('mongoose');

const attendanceAuditSchema = new mongoose.Schema({
    attendance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
        required: false // Optional for deleted records
    },
    action: {
        type: String,
        enum: ['CREATED', 'UPDATED', 'DELETED'],
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    previousStatus: {
        type: String,
        enum: ['PRESENT', 'ABSENT', null],
        default: null
    },
    newStatus: {
        type: String,
        enum: ['PRESENT', 'ABSENT', null],
        default: null
    }
}, { timestamps: true });

// Indexes to speed up admin queries
attendanceAuditSchema.index({ performedBy: 1 });
attendanceAuditSchema.index({ student: 1 });
attendanceAuditSchema.index({ action: 1 });
attendanceAuditSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AttendanceAudit', attendanceAuditSchema);

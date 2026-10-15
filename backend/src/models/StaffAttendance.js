const mongoose = require('mongoose');

// Daily attendance for teaching and non-teaching staff (one record per staff user per day).
const staffAttendanceSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE', 'HALF_DAY'], required: true },
        remarks: { type: String, trim: true, maxlength: 300, default: '' },
        markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

staffAttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ date: 1 });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);

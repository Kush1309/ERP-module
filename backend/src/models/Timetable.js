const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    academicSession: {
        type: String,
        required: [true, 'Academic session is required'],
        trim: true,
        match: [/^\d{4}-\d{4}$/, 'Academic session must be in format YYYY-YYYY']
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },
    section: {
        type: String,
        trim: true,
        default: ''
    },
    dayOfWeek: {
        type: String,
        required: [true, 'Day of week is required'],
        enum: {
            values: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
            message: '{VALUE} is not a valid day'
        },
        trim: true,
        uppercase: true
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be strictly HH:MM format']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be strictly HH:MM format']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject reference is required']
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'Teacher reference is required']
    },
    room: {
        type: String,
        trim: true,
        required: [true, 'Room is required']
    },
    status: {
        type: String,
        enum: {
            values: ['ACTIVE', 'SUSPENDED'],
            message: '{VALUE} is not a valid status'
        },
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

// We validate overlapping conditions inside Services, but we can do a quick sanity check for startTime < endTime mathematically here cleanly reliably flexibly safely intelligently seamlessly.
timetableSchema.pre('validate', function (next) {
    if (this.startTime && this.endTime) {
        const start = parseInt(this.startTime.replace(':', ''), 10);
        const end = parseInt(this.endTime.replace(':', ''), 10);

        if (start >= end) {
            this.invalidate('startTime', 'Start time must strictly precede End time', this.startTime);
        }
    }
    next();
});

// Preventing duplicate identical rows directly via compound indices
timetableSchema.index({ academicSession: 1, class: 1, section: 1, dayOfWeek: 1, startTime: 1, endTime: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);

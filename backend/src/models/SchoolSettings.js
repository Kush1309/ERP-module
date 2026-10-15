const mongoose = require('mongoose');

// Single-document school configuration (school profile + policies).
const schoolSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: 'school', unique: true, immutable: true },
        schoolName: { type: String, trim: true, default: 'School ERP' },
        address: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, lowercase: true, default: '' },
        website: { type: String, trim: true, default: '' },
        principalName: { type: String, trim: true, default: '' },
        currency: { type: String, trim: true, default: 'INR' },
        libraryLoanDays: { type: Number, min: 1, default: 14 },
        libraryFinePerDay: { type: Number, min: 0, default: 0 },
        libraryMaxActiveIssues: { type: Number, min: 1, default: 3 },
        feeLateFeePerDay: { type: Number, min: 0, default: 0 },
        feeLateFeeMax: { type: Number, min: 0, default: 0 },
        attendanceLowThreshold: { type: Number, min: 0, max: 100, default: 75 },
        maxTeacherPeriodsPerWeek: { type: Number, min: 1, max: 60, default: 36 },
        // Grading scale; empty means the built-in default bands (see utils/grading.js)
        gradeScale: [
            {
                _id: false,
                grade: { type: String, trim: true, required: true },
                minPercentage: { type: Number, min: 0, max: 100, required: true },
                isFail: { type: Boolean, default: false },
                remark: { type: String, trim: true, default: '' },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('SchoolSettings', schoolSettingsSchema);

const mongoose = require('mongoose');

// Which teacher teaches which subject to a class-section in an academic session,
// and how many periods per week are planned for it.
const subjectAllocationSchema = new mongoose.Schema(
    {
        academicSession: {
            type: String,
            required: [true, 'Academic session is required'],
            trim: true,
            match: [/^\d{4}-\d{4}$/, 'Academic session must look like 2026-2027'],
        },
        className: { type: String, required: [true, 'Class is required'], trim: true },
        section: { type: String, required: [true, 'Section is required'], trim: true, uppercase: true },
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: [true, 'Subject is required'] },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: [true, 'Teacher is required'] },
        periodsPerWeek: { type: Number, min: [1, 'At least 1 period per week'], max: [20, 'At most 20 periods per week'], default: 5 },
        notes: { type: String, trim: true, maxlength: 200, default: '' },
    },
    { timestamps: true }
);

// One teacher per subject per class-section per session
subjectAllocationSchema.index({ academicSession: 1, className: 1, section: 1, subject: 1 }, { unique: true });
subjectAllocationSchema.index({ teacher: 1, academicSession: 1 });

module.exports = mongoose.model('SubjectAllocation', subjectAllocationSchema);

const mongoose = require('mongoose');

// Configured class + section combinations (e.g. Class 8 - A).
// Student/Teacher records keep storing class & section as strings for
// backwards compatibility; this collection is the source for pickers,
// capacity checks and the class-teacher assignment.
const classSectionSchema = new mongoose.Schema(
    {
        className: { type: String, required: [true, 'Class is required'], trim: true },
        section: { type: String, required: [true, 'Section is required'], trim: true, uppercase: true },
        classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
        capacity: { type: Number, min: [1, 'Capacity must be at least 1'], default: 40 },
        room: { type: String, trim: true, default: '' },
        status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    },
    { timestamps: true }
);

classSectionSchema.index({ className: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('ClassSection', classSectionSchema);

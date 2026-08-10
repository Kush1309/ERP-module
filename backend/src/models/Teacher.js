const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        assignedClass: {
            type: String,
            required: true,
            trim: true,
        },
        assignedSection: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
    },
    {
        timestamps: true,
    }
);

// Create compound index for class and section to easily find teachers for a specific class/section
teacherSchema.index({ assignedClass: 1, assignedSection: 1 });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;

const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        maximumMarks: {
            type: Number,
            required: true,
            min: 1,
        },
        passingMarks: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

subjectSchema.pre('validate', function () {
    if (this.passingMarks > this.maximumMarks) {
        this.invalidate('passingMarks', 'Passing marks cannot exceed maximum marks.');
    }
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;

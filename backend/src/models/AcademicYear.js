const mongoose = require('mongoose');

// Academic years (e.g. 2026-2027). Exactly one may be marked current.
const academicYearSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Academic year name is required'],
            trim: true,
            unique: true,
            match: [/^\d{4}-\d{4}$/, 'Academic year must look like 2026-2027'],
        },
        startDate: { type: Date, required: [true, 'Start date is required'] },
        endDate: { type: Date, required: [true, 'End date is required'] },
        isCurrent: { type: Boolean, default: false, index: true },
        terms: [
            {
                name: { type: String, required: true, trim: true },
                startDate: { type: Date, required: true },
                endDate: { type: Date, required: true },
            },
        ],
    },
    { timestamps: true }
);

academicYearSchema.pre('validate', function () {
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
        this.invalidate('endDate', 'End date must be after the start date');
    }
    (this.terms || []).forEach((term, index) => {
        if (term.startDate && term.endDate && term.startDate >= term.endDate) {
            this.invalidate(`terms.${index}.endDate`, `Term "${term.name}" must end after it starts`);
        }
    });
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);

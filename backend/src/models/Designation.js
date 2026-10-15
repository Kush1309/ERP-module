const mongoose = require('mongoose');

// Job titles used on teacher and staff profiles (e.g. PGT Mathematics, Accountant)
const designationSchema = new mongoose.Schema(
    {
        title: { type: String, required: [true, 'Designation title is required'], trim: true, unique: true, maxlength: 80 },
        category: { type: String, enum: ['TEACHING', 'NON_TEACHING', 'MANAGEMENT'], default: 'TEACHING' },
        description: { type: String, trim: true, maxlength: 300, default: '' },
        status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Designation', designationSchema);

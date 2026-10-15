const mongoose = require('mongoose');

// Profile for non-teaching staff accounts (accountant, librarian).
const staffProfileSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        firstName: { type: String, required: [true, 'First name is required'], trim: true },
        lastName: { type: String, required: [true, 'Last name is required'], trim: true },
        phone: { type: String, required: [true, 'Phone is required'], trim: true },
        email: { type: String, trim: true, lowercase: true, default: null },
        department: { type: String, trim: true, default: '' },
        designation: { type: String, trim: true, default: '' },
        joiningDate: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('StaffProfile', staffProfileSchema);

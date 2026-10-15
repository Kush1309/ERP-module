const mongoose = require('mongoose');

// Academic or administrative department (e.g. Science, Accounts).
// Teachers and staff profiles reference a department by its name.
const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Department name is required'], trim: true, unique: true, maxlength: 80 },
        code: { type: String, trim: true, uppercase: true, maxlength: 12, default: '' },
        type: { type: String, enum: ['ACADEMIC', 'ADMINISTRATIVE', 'SUPPORT'], default: 'ACADEMIC' },
        head: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        description: { type: String, trim: true, maxlength: 500, default: '' },
        status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);

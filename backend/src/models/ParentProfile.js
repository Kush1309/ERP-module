const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const User = require('./User'); // Used for role validation
const { ROLES } = require('../constants/roles');

const parentProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        students: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate student references in the array safely beforehand
parentProfileSchema.pre('validate', function deduplicateStudents() {
    if (this.students && Array.isArray(this.students)) {
        // Standard deduplication using Set and toString
        const stringified = this.students.map((id) => id.toString());
        const unique = [...new Set(stringified)];
        this.students = unique.map((id) => new mongoose.Types.ObjectId(id));
    }
});

// Role integrity verification preventing accidental link onto Admin/Student/Teacher user payload types 
parentProfileSchema.pre('save', async function validateRole() {
    const accountUser = await mongoose.model('User').findById(this.user);
    if (!accountUser) {
        throw new AppError('Linked user account does not exist', 400);
    }

    if (accountUser.role !== ROLES.PARENT) {
        throw new AppError('ParentProfile can only be associated with a user holding the PARENT role', 400);
    }
});

const ParentProfile = mongoose.model('ParentProfile', parentProfileSchema);

module.exports = ParentProfile;

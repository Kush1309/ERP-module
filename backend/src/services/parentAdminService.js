const mongoose = require('mongoose');
const ParentProfile = require('../models/ParentProfile');
const Student = require('../models/Student');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ROLES } = require('../constants/roles');
const { generateLoginId } = require('./loginIdService');
const { hashPassword } = require('../utils/password');
const { generateTempPassword } = require('./studentService');
const { runInTransaction } = require('../utils/transaction');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const validateObjectId = (id, message = 'Invalid ID provided') => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(message, 400);
    }
};

/**
 * Validates and normalises the admin supplied parent payload.
 * `partial` allows updates that only touch some fields.
 */
const normaliseParentInput = (data = {}, { partial = false } = {}) => {
    const clean = {};

    ['firstName', 'lastName', 'phone'].forEach((field) => {
        if (data[field] !== undefined) {
            clean[field] = typeof data[field] === 'string' ? data[field].trim() : '';
        }
        if (!partial && !clean[field]) {
            throw new AppError(`${field} is required`, 400);
        }
        if (partial && data[field] !== undefined && !clean[field]) {
            throw new AppError(`${field} cannot be empty`, 400);
        }
    });

    if (data.email !== undefined) {
        const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
        if (email && !EMAIL_REGEX.test(email)) {
            throw new AppError('Invalid email address', 400);
        }
        clean.email = email || null;
    }

    if (data.studentIds !== undefined) {
        if (!Array.isArray(data.studentIds)) {
            throw new AppError('studentIds must be an array', 400);
        }
        const unique = [...new Set(data.studentIds.map(String))];
        unique.forEach((id) => validateObjectId(id, `Invalid student ID: ${id}`));
        clean.students = unique;
    } else if (!partial) {
        clean.students = [];
    }

    return clean;
};

const ensureStudentsExist = async (studentIds) => {
    if (!studentIds || studentIds.length === 0) return;
    const count = await Student.countDocuments({ _id: { $in: studentIds } });
    if (count !== studentIds.length) {
        throw new AppError('One or more selected students do not exist', 400);
    }
};

const populateParent = (query) => query
    .populate('user', 'loginId isActive mustChangePassword lastLoginAt')
    .populate('students', 'studentId firstName lastName class section rollNumber status');

const createParentAccount = async (data) => {
    const parentData = normaliseParentInput(data);
    await ensureStudentsExist(parentData.students);

    const loginId = await generateLoginId(ROLES.PARENT);
    const temporaryPassword = generateTempPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    const profile = await runInTransaction(async (session) => {
        const [user] = await User.create([{
            loginId,
            password: hashedPassword,
            role: ROLES.PARENT,
            mustChangePassword: true,
            isActive: true,
        }], { session });

        try {
            const [created] = await ParentProfile.create([{ ...parentData, user: user._id }], { session });
            return created;
        } catch (error) {
            if (!session) {
                await User.deleteOne({ _id: user._id });
            }
            throw error;
        }
    });

    const parent = await populateParent(ParentProfile.findById(profile._id)).lean();

    return {
        parent,
        credentials: { loginId, temporaryPassword },
    };
};

const getParentsList = async (queryOpts = {}) => {
    const page = Math.max(parseInt(queryOpts.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(queryOpts.limit, 10) || 10, 1), 100);

    const query = {};

    if (queryOpts.search) {
        const regex = { $regex: escapeRegex(queryOpts.search), $options: 'i' };
        const matchingUsers = await User.find({ role: ROLES.PARENT, loginId: regex }).distinct('_id');
        query.$or = [
            { firstName: regex },
            { lastName: regex },
            { phone: regex },
            { email: regex },
            { user: { $in: matchingUsers } },
        ];
    }

    if (queryOpts.studentId) {
        validateObjectId(queryOpts.studentId, 'Invalid student filter');
        query.students = queryOpts.studentId;
    }

    const [parents, total] = await Promise.all([
        populateParent(ParentProfile.find(query))
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ParentProfile.countDocuments(query),
    ]);

    return {
        parents,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

const getParentById = async (id) => {
    validateObjectId(id, 'Invalid parent ID');
    const parent = await populateParent(ParentProfile.findById(id)).lean();
    if (!parent) {
        throw new AppError('Parent not found', 404);
    }
    return parent;
};

const updateParent = async (id, data) => {
    validateObjectId(id, 'Invalid parent ID');
    const updates = normaliseParentInput(data, { partial: true });

    if (Object.keys(updates).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    if (updates.students) {
        await ensureStudentsExist(updates.students);
    }

    const profile = await ParentProfile.findById(id);
    if (!profile) {
        throw new AppError('Parent not found', 404);
    }

    Object.assign(profile, updates);
    await profile.save();

    return getParentById(id);
};

const setParentActive = async (id, isActive) => {
    validateObjectId(id, 'Invalid parent ID');
    const profile = await ParentProfile.findById(id).lean();
    if (!profile) {
        throw new AppError('Parent not found', 404);
    }

    const result = await User.updateOne({ _id: profile.user, role: ROLES.PARENT }, { $set: { isActive } });
    if (result.matchedCount === 0) {
        throw new AppError('Associated parent login not found', 404);
    }

    return getParentById(id);
};

module.exports = {
    createParentAccount,
    getParentsList,
    getParentById,
    updateParent,
    setParentActive,
};

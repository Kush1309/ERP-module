const mongoose = require('mongoose');
const ParentProfile = require('../models/ParentProfile');
const Student = require('../models/Student');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ROLES } = require('../constants/roles');

const validateObjectId = (id, message = 'Invalid ID provided') => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(message, 400);
    }
};

/**
 * Ensures the authenticated user holds PARENT role explicitly.
 * Defensively extracts parent strictly from the database overriding caching.
 */
const verifyParentIdentity = async (userId) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    const user = await User.findById(userId);

    if (!user || user.role !== ROLES.PARENT) {
        throw new AppError('Unauthorized: Access designated strictly securely to PARENT profiles.', 403);
    }
    return true;
};

/**
 * Resolves explicit ParentProfile linking logic verifying target existence.
 */
const getParentProfile = async (userId) => {
    await verifyParentIdentity(userId);

    const profile = await ParentProfile.findOne({ user: userId });
    if (!profile) {
        throw new AppError('Profile not discovered for parent payload', 404);
    }

    return profile;
};

/**
 * Returns complete scoped linked payload natively validating arrays reliably.
 * Provides normalized, secure fetching blocking unsupported query variables neatly.
 */
const getLinkedStudents = async (userId) => {
    const profile = await getParentProfile(userId);

    if (!profile.students || profile.students.length === 0) {
        return [];
    }

    // Prevents any NoSQL parsing injection strictly querying exactly bounded $in operator safely
    const students = await Student.find({
        _id: { $in: profile.students }
    }).select('-createdAt -updatedAt -__v').lean();

    return students;
};

/**
 * Resolves exact specified identity bound implicitly ensuring target resides logically inside array properly.
 * Completely nullifies blind identity tampering effectively isolating strictly.
 */
const getLinkedStudentById = async (userId, studentId) => {
    validateObjectId(studentId, 'Invalid Student ID provided securely');

    const profile = await getParentProfile(userId);

    const isLinked = profile.students.some(
        (linkedId) => linkedId.toString() === studentId.toString()
    );

    if (!isLinked) {
        throw new AppError('Unauthorized: Specified identity not explicitly securely linked logically', 403);
    }

    const student = await Student.findById(studentId).select('-createdAt -updatedAt -__v').lean();

    if (!student) {
        throw new AppError('Student explicitly not discovered natively', 404);
    }

    return student;
};

/**
 * Determines exact linkage natively booleanly safely mapping logically purely.
 */
const isStudentLinked = async (userId, studentId) => {
    validateObjectId(studentId, 'Invalid Student ID');
    const profile = await getParentProfile(userId);
    return profile.students.some((linkedId) => linkedId.toString() === studentId.toString());
};

module.exports = {
    getParentProfile,
    getLinkedStudents,
    getLinkedStudentById,
    isStudentLinked,
};

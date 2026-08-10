const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateLoginId } = require('./loginIdService');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/roles');
const { generateTempPassword } = require('./studentService');

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createTeacherAccount = async (teacherData) => {
    // Check duplicates
    if (teacherData.email) {
        const existingEmail = await Teacher.findOne({ email: teacherData.email });
        if (existingEmail) {
            throw new AppError('Email already exists', 409);
        }
    }

    if (teacherData.phone) {
        const existingPhone = await Teacher.findOne({ phone: teacherData.phone });
        if (existingPhone) {
            throw new AppError('Phone already exists', 409);
        }
    }

    const ObjectToSave = {
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        email: teacherData.email,
        phone: teacherData.phone,
        assignedClass: teacherData.assignedClass,
        assignedSection: teacherData.assignedSection
    };

    const loginId = await generateLoginId(ROLES.TEACHER);
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    let session;
    let useFallback = false;

    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (error) {
        useFallback = true;
    }

    let newUser;
    let newTeacher;

    if (!useFallback) {
        try {
            [newUser] = await User.create([{
                loginId,
                password: hashedPassword,
                role: ROLES.TEACHER,
                mustChangePassword: true,
                isActive: true,
            }], { session });

            [newTeacher] = await Teacher.create([{
                ...ObjectToSave,
                user: newUser._id
            }], { session });

            await session.commitTransaction();
        } catch (error) {
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            if (error.codeName === 'IllegalOperation' || (error.message && error.message.includes('replica set'))) {
                useFallback = true;
            } else if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyValue || {})[0] || 'Field';
                throw new AppError(`${duplicateField} already exists.`, 409);
            } else {
                throw error;
            }
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    if (useFallback) {
        newUser = await User.create({
            loginId,
            password: hashedPassword,
            role: ROLES.TEACHER,
            mustChangePassword: true,
            isActive: true,
        });

        try {
            newTeacher = await Teacher.create({
                ...ObjectToSave,
                user: newUser._id
            });
        } catch (err) {
            await User.deleteOne({ _id: newUser._id });
            if (err.code === 11000) {
                const duplicateField = Object.keys(err.keyValue || {})[0] || 'Field';
                throw new AppError(`${duplicateField} already exists.`, 409);
            }
            throw err;
        }
    }

    // Convert to plain object and remove DB internals
    const teacherResult = newTeacher.toObject();

    return {
        user: newUser,
        teacher: teacherResult,
        temporaryPassword: tempPassword
    };
};

const getTeachersList = async (queryOpts) => {
    let { page = 1, limit = 10, search, class: className, section, status } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const query = {};

    if (className) query.assignedClass = className;
    if (section) query.assignedSection = section;

    let userIdsFromUserQuery = null;

    if (status) {
        const isActive = status.toUpperCase() === 'ACTIVE';
        const users = await User.find({ role: ROLES.TEACHER, isActive }, '_id').lean();
        userIdsFromUserQuery = users.map(u => String(u._id));
    }

    if (search) {
        const safeSearch = escapeRegex(search);
        const searchRegex = { $regex: safeSearch, $options: 'i' };

        const matchingUsers = await User.find({ role: ROLES.TEACHER, loginId: searchRegex }, '_id').lean();
        const matchingUserIds = matchingUsers.map(u => String(u._id));

        query.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
            { user: { $in: matchingUserIds } }
        ];
    }

    if (userIdsFromUserQuery) {
        query.user = query.user || {};
        const existingIn = query.user.$in;
        if (existingIn) {
            query.user.$in = existingIn.filter(id => userIdsFromUserQuery.includes(String(id)));
        } else {
            query.user.$in = userIdsFromUserQuery;
        }
    }

    const [teachers, total] = await Promise.all([
        Teacher.find(query)
            .populate('user', 'loginId role isActive mustChangePassword')
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Teacher.countDocuments(query)
    ]);

    return {
        teachers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getTeacherById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid Teacher ID format', 400);
    }
    const teacher = await Teacher.findById(id)
        .populate('user', 'loginId role isActive mustChangePassword')
        .lean();

    if (!teacher) {
        throw new AppError('Teacher not found', 404);
    }

    return teacher;
};

module.exports = {
    createTeacherAccount,
    getTeachersList,
    getTeacherById
};

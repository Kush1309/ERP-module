const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateLoginId } = require('./loginIdService');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/roles');
const { generateTempPassword } = require('./studentService');

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

module.exports = {
    createTeacherAccount
};

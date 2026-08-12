const mongoose = require('mongoose');
const crypto = require('crypto');
const Student = require('../models/Student');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateLoginId } = require('./loginIdService');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/roles');

const generateTempPassword = () => {
    const randomHex = crypto.randomBytes(6).toString('hex');
    return `Temp${randomHex}A1`;
};

const createStudentAccount = async (studentData) => {
    const existingAdmission = await Student.findOne({ admissionNumber: studentData.admissionNumber });
    if (existingAdmission) {
        throw new AppError('Admission number already exists', 409);
    }

    if (studentData.email) {
        const existingEmail = await Student.findOne({ email: studentData.email });
        if (existingEmail) {
            throw new AppError('Email already exists', 409);
        }
    }

    const loginId = await generateLoginId(ROLES.STUDENT);
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
    let newStudent;

    if (!useFallback) {
        try {
            [newUser] = await User.create([{
                loginId,
                password: hashedPassword,
                role: ROLES.STUDENT,
                mustChangePassword: true,
                isActive: true,
            }], { session });

            [newStudent] = await Student.create([{
                ...studentData,
                user: newUser._id
            }], { session });

            await session.commitTransaction();
        } catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            if (error.codeName === 'IllegalOperation' || (error.message && error.message.includes('replica set'))) {
                useFallback = true;
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
            role: ROLES.STUDENT,
            mustChangePassword: true,
            isActive: true,
        });

        try {
            newStudent = await Student.create({
                ...studentData,
                user: newUser._id
            });
        } catch (err) {
            await User.deleteOne({ _id: newUser._id });
            throw err;
        }
    }

    return {
        user: newUser,
        student: newStudent,
        temporaryPassword: tempPassword
    };
};

const getStudentsList = async (queryOpts) => {
    let { page = 1, limit = 10, search, class: className, section, status } = queryOpts;

    // Enforce restrictions implicitly
    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    // Sanitize string conversions to prevent NoSQL injection
    if (className) className = String(className);
    if (section) section = String(section);
    if (status) status = String(status);
    if (search) search = String(search);

    const query = {};

    if (className) query.class = className;
    if (section) query.section = section;
    if (status) query.status = status;

    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: safeSearch, $options: 'i' };
        query.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { studentId: searchRegex },
            { admissionNumber: searchRegex }
        ];
    }

    const [students, total] = await Promise.all([
        Student.find(query)
            .populate('user', 'loginId isActive')
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Student.countDocuments(query)
    ]);

    return {
        students,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getStudentById = async (id) => {
    const query = {};

    // Support both _id and studentId formats safely
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or = [{ _id: id }, { studentId: id }];
    } else {
        query.studentId = id;
    }

    const student = await Student.findOne(query)
        .populate('user', 'loginId isActive')
        .lean();

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    return student;
};

const updateStudentById = async (id, rawData) => {
    const query = {};

    // Support same identifier rule (ObjectId or studentId)
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or = [{ _id: id }, { studentId: id }];
    } else {
        query.studentId = id;
    }

    const whitelist = [
        'firstName', 'lastName', 'dateOfBirth', 'gender', 'class',
        'section', 'rollNumber', 'admissionNumber', 'admissionDate',
        'phone', 'email', 'address', 'city', 'state', 'postalCode'
    ];

    const safeUpdate = {};
    Object.keys(rawData).forEach(key => {
        if (whitelist.includes(key)) {
            safeUpdate[key] = rawData[key];
        }
    });

    if (Object.keys(safeUpdate).length === 0) {
        throw new AppError('No valid editable fields provided for update', 400);
    }

    try {
        const student = await Student.findOneAndUpdate(
            query,
            { $set: safeUpdate },
            { new: true, runValidators: true }
        ).populate('user', 'loginId isActive').lean();

        if (!student) {
            throw new AppError('Student not found', 404);
        }

        return student;
    } catch (error) {
        if (error.code === 11000) {
            // E.g., E11000 duplicate key error collection
            const duplicateField = Object.keys(error.keyValue || {})[0] || 'Field';
            throw new AppError(`${duplicateField} already exists in the system.`, 409);
        }
        throw error;
    }
};

const updateStudentStatus = async (id, isActive) => {
    const query = {};

    // Support both _id and studentId formats safely
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or = [{ _id: id }, { studentId: id }];
    } else {
        query.studentId = id;
    }

    const student = await Student.findOne(query);
    if (!student) {
        throw new AppError('Student not found', 404);
    }

    // Also update the student document status to match if needed
    const newStatus = isActive ? 'ACTIVE' : 'INACTIVE';
    student.status = newStatus;
    await student.save();

    const user = await User.findById(student.user);
    if (!user) {
        throw new AppError('Associated user account not found', 404);
    }

    user.isActive = isActive;
    await user.save();

    return { student, user: { loginId: user.loginId, isActive: user.isActive } };
};

const exportAdminStudents = async (queryOpts) => {
    let { search, class: className, section, status } = queryOpts;

    // Sanitize string conversions to prevent NoSQL injection
    if (className) className = String(className);
    if (section) section = String(section);
    if (status) status = String(status);
    if (search) search = String(search);

    const query = {};

    if (className) query.class = className;
    if (section) query.section = section;
    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
        query.status = status;
    }

    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: safeSearch, $options: 'i' };
        query.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { studentId: searchRegex },
            { admissionNumber: searchRegex }
        ];
    }

    const students = await Student.find(query)
        .select('studentId firstName lastName rollNumber class section status email')
        .sort({ studentId: 1 })
        .lean();

    const headers = ['Student ID', 'First Name', 'Last Name', 'Roll Number', 'Class', 'Section', 'Status', 'Email'];

    const escapeCsvValue = (val) => {
        if (val === null || val === undefined) return '';
        let strVal = String(val);
        // Protect against spreadsheet formula injection
        if (/^[=+\-@]/.test(strVal)) {
            strVal = "'" + strVal;
        }
        // Escape quotes and wrap in quotes if there is a comma, quote or newline
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
            strVal = `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
    };

    const csvRows = [headers.join(',')];

    for (const s of students) {
        const row = [
            escapeCsvValue(s.studentId),
            escapeCsvValue(s.firstName),
            escapeCsvValue(s.lastName),
            escapeCsvValue(s.rollNumber),
            escapeCsvValue(s.class),
            escapeCsvValue(s.section),
            escapeCsvValue(s.status),
            escapeCsvValue(s.email)
        ];
        csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
};

const getCurrentStudent = async (userId) => {
    // Only return safe profile fields
    const student = await Student.findOne({ user: userId })
        .populate('user', 'loginId role isActive mustChangePassword')
        .lean();

    if (!student) {
        throw new AppError('Student profile not found', 404);
    }

    return student;
};

const bulkUpdateStudentStatus = async (studentIds, isActive) => {
    const uniqueIds = [...new Set(studentIds)];

    const validObjectIds = uniqueIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const validStringIds = uniqueIds.filter(id => typeof id === 'string' && id.trim() !== '');

    if (validObjectIds.length === 0 && validStringIds.length === 0) {
        return { requestedCount: uniqueIds.length, updatedCount: 0, alreadyInStateCount: 0, failedCount: uniqueIds.length };
    }

    const query = { $or: [{ _id: { $in: validObjectIds } }, { studentId: { $in: validStringIds } }] };

    const students = await Student.find(query).lean();

    const failedCount = uniqueIds.length - students.length;
    const targetStatus = isActive ? 'ACTIVE' : 'INACTIVE';

    const studentsToUpdate = students.filter(s => s.status !== targetStatus);
    const alreadyInStateCount = students.length - studentsToUpdate.length;
    const updatedCount = studentsToUpdate.length;

    if (updatedCount > 0) {
        const studentIdsToUpdate = studentsToUpdate.map(s => s._id);
        const userIdsToUpdate = studentsToUpdate.map(s => s.user);

        let session;
        let useFallback = false;

        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (error) {
            useFallback = true;
        }

        if (!useFallback) {
            try {
                await Student.updateMany(
                    { _id: { $in: studentIdsToUpdate } },
                    { $set: { status: targetStatus } },
                    { session }
                );

                await User.updateMany(
                    { _id: { $in: userIdsToUpdate } },
                    { $set: { isActive: isActive } },
                    { session }
                );

                await session.commitTransaction();
            } catch (error) {
                if (session.inTransaction()) {
                    await session.abortTransaction();
                }
                if (error.codeName === 'IllegalOperation' || (error.message && error.message.includes('replica set'))) {
                    useFallback = true;
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
            await Student.updateMany(
                { _id: { $in: studentIdsToUpdate } },
                { $set: { status: targetStatus } }
            );

            await User.updateMany(
                { _id: { $in: userIdsToUpdate } },
                { $set: { isActive: isActive } }
            );
        }
    }

    return {
        requestedCount: uniqueIds.length,
        updatedCount,
        alreadyInStateCount,
        failedCount
    };
};

const bulkImportStudents = async (studentDataArray, totalRows) => {
    const serviceErrors = [];

    const admissionNumbers = new Set();
    const emails = new Set();
    let hasInternalDuplicates = false;

    for (const item of studentDataArray) {
        const { rowNum, data } = item;

        if (admissionNumbers.has(data.admissionNumber)) {
            serviceErrors.push({ row: rowNum, field: 'AdmissionNumber', message: 'Duplicate AdmissionNumber within CSV.' });
            hasInternalDuplicates = true;
        } else {
            admissionNumbers.add(data.admissionNumber);
        }

        if (data.email) {
            if (emails.has(data.email)) {
                serviceErrors.push({ row: rowNum, field: 'Email', message: 'Duplicate Email within CSV.' });
                hasInternalDuplicates = true;
            } else {
                emails.add(data.email);
            }
        }
    }

    if (hasInternalDuplicates) {
        return { imported: 0, failed: serviceErrors.length, serviceErrors };
    }

    const existingAdmissions = await Student.find({ admissionNumber: { $in: Array.from(admissionNumbers) } }).select('admissionNumber').lean();
    if (existingAdmissions.length > 0) {
        const dupes = existingAdmissions.map(e => e.admissionNumber);
        for (const item of studentDataArray) {
            if (dupes.includes(item.data.admissionNumber)) {
                serviceErrors.push({ row: item.rowNum, field: 'AdmissionNumber', message: `AdmissionNumber ${item.data.admissionNumber} already exists in database.` });
            }
        }
    }

    if (emails.size > 0) {
        const existingEmails = await Student.find({ email: { $in: Array.from(emails) } }).select('email').lean();
        if (existingEmails.length > 0) {
            const dupes = existingEmails.map(e => e.email);
            for (const item of studentDataArray) {
                if (item.data.email && dupes.includes(item.data.email)) {
                    serviceErrors.push({ row: item.rowNum, field: 'Email', message: `Email ${item.data.email} already exists in database.` });
                }
            }
        }
    }

    if (serviceErrors.length > 0) {
        return { imported: 0, failed: serviceErrors.length, serviceErrors };
    }

    let session;
    let useFallback = false;

    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (error) {
        useFallback = true;
    }

    try {
        const usersToCreate = [];
        const studentsToCreate = [];

        for (const item of studentDataArray) {
            const { data } = item;

            // Generate credentials sequentially for safety if id generator does not support multi-doc mapping simultaneously
            const loginId = await generateLoginId(ROLES.STUDENT);
            const tempPassword = generateTempPassword();
            const hashedPassword = await hashPassword(tempPassword);

            const userDoc = new User({
                loginId,
                password: hashedPassword,
                role: ROLES.STUDENT,
                mustChangePassword: true,
                isActive: true
            });
            usersToCreate.push(userDoc);

            const studentDoc = new Student({
                ...data,
                user: userDoc._id
            });
            studentsToCreate.push(studentDoc);
        }

        if (!useFallback) {
            await User.insertMany(usersToCreate, { session });
            await Student.insertMany(studentsToCreate, { session });
            await session.commitTransaction();
        } else {
            await User.insertMany(usersToCreate);
            await Student.insertMany(studentsToCreate);
        }

    } catch (error) {
        if (session && session.inTransaction()) {
            await session.abortTransaction();
        }
        serviceErrors.push({ row: '-', field: 'Database', message: 'Internal transaction error occurred while creating records.' });
        return { imported: 0, failed: 1, serviceErrors };
    } finally {
        if (session) {
            session.endSession();
        }
    }

    return { imported: totalRows, failed: 0, serviceErrors: [] };
};

module.exports = {
    createStudentAccount,
    generateTempPassword,
    getStudentsList,
    getStudentById,
    updateStudentById,
    updateStudentStatus,
    bulkUpdateStudentStatus,
    bulkImportStudents,
    getCurrentStudent,
    exportAdminStudents
};

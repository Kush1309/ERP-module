const mongoose = require('mongoose');
const crypto = require('crypto');
const Student = require('../models/Student');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateLoginId } = require('./loginIdService');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/roles');
const { runInTransaction } = require('../utils/transaction');

const STUDENT_WRITABLE_FIELDS = [
    'firstName', 'lastName', 'dateOfBirth', 'gender', 'class',
    'section', 'rollNumber', 'admissionNumber', 'admissionDate',
    'phone', 'email', 'address', 'city', 'state', 'postalCode'
];

// Only accept known profile fields from clients (prevents overriding user/status/_id)
const sanitizeStudentInput = (data = {}) => {
    const clean = {};
    STUDENT_WRITABLE_FIELDS.forEach((field) => {
        if (data[field] !== undefined) {
            clean[field] = data[field];
        }
    });
    if (typeof clean.email === 'string') {
        clean.email = clean.email.trim() === '' ? null : clean.email.trim().toLowerCase();
    }
    if (typeof clean.gender === 'string') {
        clean.gender = clean.gender.trim().toUpperCase();
    }
    return clean;
};

const generateTempPassword = () => {
    const randomHex = crypto.randomBytes(6).toString('hex');
    return `Temp${randomHex}A1`;
};

const createStudentAccount = async (rawStudentData) => {
    const studentData = sanitizeStudentInput(rawStudentData);

    // Validate the profile before any login ID / user account is created
    const probe = new Student({ ...studentData, user: new mongoose.Types.ObjectId() });
    const validationError = probe.validateSync(undefined, { pathsToSkip: ['studentId'] });
    if (validationError) {
        throw validationError;
    }

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

    const { user: newUser, student: newStudent } = await runInTransaction(async (session) => {
        const [user] = await User.create([{
            loginId,
            password: hashedPassword,
            role: ROLES.STUDENT,
            mustChangePassword: true,
            isActive: true,
        }], { session });

        try {
            const [student] = await Student.create([{
                ...studentData,
                user: user._id
            }], { session });
            return { user, student };
        } catch (error) {
            // Without a transaction we must remove the orphaned login ourselves.
            if (!session) {
                await User.deleteOne({ _id: user._id });
            }
            throw error;
        }
    });

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

        await runInTransaction(async (session) => {
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
        });
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

    const usersToCreate = [];
    const studentsToCreate = [];
    const credentials = [];

    for (const item of studentDataArray) {
        const { rowNum, data } = item;

        // Generate credentials sequentially so the login ID counter stays consistent
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
            ...sanitizeStudentInput(data),
            user: userDoc._id
        });
        studentsToCreate.push(studentDoc);

        credentials.push({
            row: rowNum,
            name: `${data.firstName} ${data.lastName}`.trim(),
            loginId,
            temporaryPassword: tempPassword,
        });
    }

    try {
        await runInTransaction(async (session) => {
            await User.insertMany(usersToCreate, { session });
            try {
                // Saved one by one so each student ID is generated sequentially
                // (parallel validation could race on the ID counter).
                for (const studentDoc of studentsToCreate) {
                    await studentDoc.save({ session });
                }
            } catch (error) {
                if (!session) {
                    // Roll back manually when transactions are unavailable
                    await Student.deleteMany({ user: { $in: usersToCreate.map((u) => u._id) } });
                    await User.deleteMany({ _id: { $in: usersToCreate.map((u) => u._id) } });
                }
                throw error;
            }
        });
    } catch (error) {
        console.error('Bulk student import failed:', error.message);
        const message = error.code === 11000
            ? 'A duplicate value was detected while saving. No students were imported.'
            : (error.name === 'ValidationError' ? error.message : 'Database error occurred while creating records. No students were imported.');
        serviceErrors.push({ row: '-', field: 'Database', message });
        return { imported: 0, failed: 1, serviceErrors };
    }

    return { imported: studentsToCreate.length, failed: 0, serviceErrors: [], credentials };
};

/**
 * Academic-year transition: move students of one class/section to the next class,
 * or mark final-year students as GRADUATED (their logins are deactivated).
 */
const promoteStudents = async ({ fromClass, fromSection, toClass, toSection, studentIds, action = 'PROMOTE' }) => {
    if (!fromClass) throw new AppError('fromClass is required', 400);
    if (!['PROMOTE', 'GRADUATE'].includes(action)) throw new AppError('action must be PROMOTE or GRADUATE', 400);
    if (action === 'PROMOTE' && !toClass) throw new AppError('toClass is required to promote', 400);
    if (action === 'PROMOTE' && String(toClass) === String(fromClass) && (!toSection || String(toSection).toUpperCase() === String(fromSection || '').toUpperCase())) {
        throw new AppError('Target class/section must differ from the source', 400);
    }

    const filter = { class: String(fromClass), status: 'ACTIVE' };
    if (fromSection) filter.section = String(fromSection).toUpperCase();
    if (Array.isArray(studentIds) && studentIds.length) {
        const valid = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (valid.length !== studentIds.length) throw new AppError('Invalid student ID in selection', 400);
        filter._id = { $in: valid };
    }
    const students = await Student.find(filter).select('_id user section').lean();
    if (!students.length) throw new AppError('No active students match the selection', 404);

    await runInTransaction(async (session) => {
        if (action === 'GRADUATE') {
            await Student.updateMany({ _id: { $in: students.map((s) => s._id) } }, { $set: { status: 'GRADUATED' } }, { session });
            await User.updateMany({ _id: { $in: students.map((s) => s.user) } }, { $set: { isActive: false } }, { session });
        } else {
            const update = { class: String(toClass) };
            if (toSection) update.section = String(toSection).toUpperCase();
            await Student.updateMany({ _id: { $in: students.map((s) => s._id) } }, { $set: update }, { session });
        }
    });

    return { action, affected: students.length };
};

// Lifecycle status change (e.g. TRANSFERRED / withdrawn). Only ACTIVE students keep login access.
const setStudentLifecycleStatus = async (id, status) => {
    const { STUDENT_STATUS_VALUES } = require('../constants/studentStatus');
    if (!STUDENT_STATUS_VALUES.includes(status)) {
        throw new AppError(`status must be one of ${STUDENT_STATUS_VALUES.join(', ')}`, 400);
    }
    const student = await getStudentById(id);
    await Student.updateOne({ _id: student._id }, { $set: { status } });
    await User.updateOne({ _id: student.user._id || student.user }, { $set: { isActive: status === 'ACTIVE' } });
    return getStudentById(student._id.toString());
};

module.exports = {
    setStudentLifecycleStatus,
    promoteStudents,
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

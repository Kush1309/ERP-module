const mongoose = require('mongoose');
const Homework = require('../models/Homework');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const ParentProfile = require('../models/ParentProfile');
const AppError = require('../utils/AppError');

const { isValidObjectId } = mongoose.Types;

const validateObjectId = (id, message = 'Invalid ObjectId provided') => {
    if (!id || !isValidObjectId(id)) {
        throw new AppError(message, 400);
    }
};

const resolveActor = async (userId) => {
    const user = await User.findById(userId).select('role').lean();
    if (!user) throw new AppError('Authenticated user not found', 404);
    return user;
};

const createHomework = async (userId, data) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    const userRole = await resolveActor(userId);

    if (userRole.role === 'STUDENT' || userRole.role === 'PARENT') {
        throw new AppError('Unauthorized to create homework', 403);
    }

    const { title, description, class: className, section, subject, dueDate, status } = data;

    const payload = {
        title,
        description,
        class: className,
        section,
        subject,
        dueDate,
        status: status || 'DRAFT'
    };

    if (userRole.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: userId }).lean();
        if (!teacher) throw new AppError('Teacher profile not found', 404);

        if (payload.class !== teacher.assignedClass || payload.section !== teacher.assignedSection) {
            throw new AppError('Unauthorized: Can only create homework for assigned class and section', 403);
        }

        payload.teacherId = teacher._id;
    } else if (userRole.role === 'ADMIN') {
        if (!data.teacherId) throw new AppError('Admin must provide teacherId', 400);
        validateObjectId(data.teacherId, 'Invalid teacherId');
        payload.teacherId = data.teacherId;
    }

    const homework = await Homework.create(payload);
    return homework;
};

const getHomeworks = async (userId, queryOpts = {}) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    const userRole = await resolveActor(userId);

    let { page = 1, limit = 10, status, search, class: className, section } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const match = {};
    if (status) match.status = String(status).toUpperCase();
    if (search) {
        const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        match.$or = [
            { title: { $regex: safeSearch, $options: 'i' } },
            { subject: { $regex: safeSearch, $options: 'i' } }
        ];
    }

    if (userRole.role === 'ADMIN') {
        if (className) match.class = String(className);
        if (section) match.section = String(section);
    } else if (userRole.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: userId }).lean();
        if (!teacher) throw new AppError('Teacher profile not found', 404);
        match.teacherId = teacher._id;

        // Scope strictly bound
        if (className) match.class = className;
        if (section) match.section = section;
    } else if (userRole.role === 'STUDENT') {
        const student = await Student.findOne({ user: userId }).lean();
        if (!student) throw new AppError('Student profile not found', 404);
        match.class = student.class;
        match.section = student.section;
        match.status = 'PUBLISHED';
    } else if (userRole.role === 'PARENT') {
        const parent = await ParentProfile.findOne({ user: userId }).lean();
        if (!parent || !parent.students || parent.students.length === 0) {
            return { data: [], pagination: { total: 0, page, limit, pages: 0 } };
        }
        const students = await Student.find({ _id: { $in: parent.students } }).lean();

        const scopeConditions = students.map(s => ({
            class: s.class,
            section: s.section
        }));

        match.$and = match.$and || [];
        match.$and.push({ $or: scopeConditions });
        match.status = 'PUBLISHED';
    }

    const [data, total] = await Promise.all([
        Homework.find(match)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('teacherId', 'firstName lastName')
            .lean(),
        Homework.countDocuments(match)
    ]);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
};

const enforceAccessCheck = async (userId, userRole, homework) => {
    if (userRole.role === 'ADMIN') return true;

    if (userRole.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: userId }).lean();
        if (!teacher || teacher._id.toString() !== homework.teacherId.toString()) {
            throw new AppError('Unauthorized access to homework', 403);
        }
    } else if (userRole.role === 'STUDENT') {
        const student = await Student.findOne({ user: userId }).lean();
        if (!student || student.class !== homework.class || student.section !== homework.section) {
            throw new AppError('Unauthorized access to homework', 403);
        }
        if (homework.status !== 'PUBLISHED') throw new AppError('Unauthorized access to homework', 403);
    } else if (userRole.role === 'PARENT') {
        const parent = await ParentProfile.findOne({ user: userId }).lean();
        if (!parent || !parent.students || parent.students.length === 0) throw new AppError('Unauthorized access to homework', 403);
        const students = await Student.find({ _id: { $in: parent.students } }).lean();
        const access = students.some(s => s.class === homework.class && s.section === homework.section);
        if (!access) throw new AppError('Unauthorized access to homework', 403);
        if (homework.status !== 'PUBLISHED') throw new AppError('Unauthorized access to homework', 403);
    }
};

const getHomeworkById = async (userId, homeworkId) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(homeworkId, 'Invalid homework ID');

    const userRole = await resolveActor(userId);
    const homework = await Homework.findById(homeworkId).populate('teacherId', 'firstName lastName').lean();

    if (!homework) throw new AppError('Homework not found', 404);

    await enforceAccessCheck(userId, userRole, homework);

    return homework;
};

const updateHomework = async (userId, homeworkId, data) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(homeworkId, 'Invalid homework ID');

    const userRole = await resolveActor(userId);
    if (userRole.role === 'STUDENT' || userRole.role === 'PARENT') {
        throw new AppError('Unauthorized to update homework', 403);
    }

    const existing = await Homework.findById(homeworkId).lean();
    if (!existing) throw new AppError('Homework not found', 404);

    if (userRole.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: userId }).lean();
        if (!teacher || teacher._id.toString() !== existing.teacherId.toString()) {
            throw new AppError('Unauthorized access to homework', 403);
        }

        if (data.class || data.section) {
            const classChange = data.class !== undefined ? data.class : existing.class;
            const sectionChange = data.section !== undefined ? data.section : existing.section;
            if (classChange !== teacher.assignedClass || sectionChange !== teacher.assignedSection) {
                throw new AppError('Unauthorized: Can only manage homework in assigned class and section', 403);
            }
        }
    }

    const { title, description, class: className, section, subject, dueDate, status } = data;
    const updatePayload = {};

    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (className !== undefined) updatePayload.class = className;
    if (section !== undefined) updatePayload.section = section;
    if (subject !== undefined) updatePayload.subject = subject;
    if (dueDate !== undefined) updatePayload.dueDate = dueDate;
    if (status !== undefined) updatePayload.status = status;

    if (Object.keys(updatePayload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const updated = await Homework.findByIdAndUpdate(
        homeworkId,
        { $set: updatePayload },
        { new: true, runValidators: true }
    ).populate('teacherId', 'firstName lastName').lean();

    return updated;
};

const deleteHomework = async (userId, homeworkId) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(homeworkId, 'Invalid homework ID');

    const userRole = await resolveActor(userId);
    if (userRole.role === 'STUDENT' || userRole.role === 'PARENT') {
        throw new AppError('Unauthorized to delete homework', 403);
    }

    const existing = await Homework.findById(homeworkId).lean();
    if (!existing) throw new AppError('Homework not found', 404);

    if (userRole.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: userId }).lean();
        if (!teacher || teacher._id.toString() !== existing.teacherId.toString()) {
            throw new AppError('Unauthorized access to homework', 403);
        }
    }

    await Homework.findByIdAndDelete(homeworkId);
    return { success: true, message: 'Homework deleted safely' };
};

module.exports = {
    createHomework,
    getHomeworks,
    getHomeworkById,
    updateHomework,
    deleteHomework
};

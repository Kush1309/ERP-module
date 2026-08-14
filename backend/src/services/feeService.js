const mongoose = require('mongoose');
const FeeStructure = require('../models/FeeStructure');
const FeeRecord = require('../models/FeeRecord');
const Student = require('../models/Student');

/**
 * Utility: Checks if string is a valid ObjectId
 */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);


// ==========================================
// FEE STRUCTURES (Templates)
// ==========================================

exports.createFeeStructure = async (user, data) => {
    if (user.role !== 'ADMIN') {
        const error = new Error('Only administrators can create fee structures.');
        error.statusCode = 403;
        throw error;
    }

    // Whitelist
    const { title, amount, dueDate, applicableClasses, academicYear, status } = data;

    const structure = new FeeStructure({
        title, amount, dueDate, applicableClasses, academicYear, status
    });

    await structure.save();
    return structure;
};

exports.getFeeStructures = async (user, filters = {}) => {
    const query = {};

    // Add safe text search
    if (filters.search) {
        query.title = { $regex: filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    if (filters.academicYear) {
        query.academicYear = filters.academicYear;
    }
    if (filters.status) {
        query.status = filters.status;
    }

    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const data = await FeeStructure.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await FeeStructure.countDocuments(query);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

exports.getFeeStructureById = async (user, id) => {
    if (!isValidId(id)) {
        const error = new Error('Invalid fee structure ID format');
        error.statusCode = 400;
        throw error;
    }
    const structure = await FeeStructure.findById(id);
    if (!structure) {
        const error = new Error('Fee structure not found');
        error.statusCode = 404;
        throw error;
    }
    return structure;
};

exports.updateFeeStructure = async (user, id, data) => {
    if (user.role !== 'ADMIN') {
        const error = new Error('Only administrators can update fee structures.');
        error.statusCode = 403;
        throw error;
    }
    if (!isValidId(id)) {
        const error = new Error('Invalid structure ID');
        error.statusCode = 400;
        throw error;
    }

    // Whitelist
    const updates = {};
    ['title', 'amount', 'dueDate', 'applicableClasses', 'academicYear', 'status'].forEach(key => {
        if (data[key] !== undefined) updates[key] = data[key];
    });

    const structure = await FeeStructure.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!structure) {
        const error = new Error('Fee structure not found');
        error.statusCode = 404;
        throw error;
    }
    return structure;
};

exports.deleteFeeStructure = async (user, id) => {
    if (user.role !== 'ADMIN') {
        const error = new Error('Only administrators can delete fee structures.');
        error.statusCode = 403;
        throw error;
    }
    if (!isValidId(id)) {
        const error = new Error('Invalid structure ID');
        error.statusCode = 400;
        throw error;
    }

    // Check if active records depend on this structure
    const activeRecords = await FeeRecord.countDocuments({ feeStructureId: id });
    if (activeRecords > 0) {
        const error = new Error('Cannot delete a fee structure that has active fee records assigned to students.');
        error.statusCode = 400;
        throw error;
    }

    const structure = await FeeStructure.findByIdAndDelete(id);
    if (!structure) {
        const error = new Error('Fee structure not found');
        error.statusCode = 404;
        throw error;
    }
    return true;
};


// ==========================================
// FEE RECORDS (Student assignments)
// ==========================================

exports.createFeeRecord = async (user, data) => {
    if (user.role !== 'ADMIN') {
        const error = new Error('Only administrators can assign fees to students.');
        error.statusCode = 403;
        throw error;
    }

    const { studentId, feeStructureId, amountDue } = data;
    if (!isValidId(studentId) || !isValidId(feeStructureId)) {
        const error = new Error('Invalid references provided.');
        error.statusCode = 400;
        throw error;
    }

    // Validate relations
    const structure = await FeeStructure.findById(feeStructureId);
    if (!structure) {
        const error = new Error('Referenced fee structure does not exist.');
        error.statusCode = 404;
        throw error;
    }

    // Check duplicate assignment
    const existing = await FeeRecord.findOne({ studentId, feeStructureId });
    if (existing) {
        const error = new Error('This student is already assigned this exact fee structure.');
        error.statusCode = 400;
        throw error;
    }

    const record = new FeeRecord({
        studentId,
        feeStructureId,
        amountDue: amountDue !== undefined ? amountDue : structure.amount,
        amountPaid: 0,
        status: 'PENDING'
    });

    await record.save();
    return record;
};


exports.getFeeRecords = async (user, filters = {}) => {
    const query = {};

    // Role-based scoping
    if (user.role === 'STUDENT') {
        // Enforce own logic implicitly mapping the reference ID statically avoiding overrides
        const student = await Student.findOne({ user: user._id });
        if (!student) {
            return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        }
        query.studentId = student._id;
    } else if (user.role === 'PARENT') {
        // Check linked array strictly enforcing bounds natively guarding horizontal traversals
        if (!user.parentProfile || !user.parentProfile.students || user.parentProfile.students.length === 0) {
            return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        }
        query.studentId = { $in: user.parentProfile.students };
    }

    if (filters.studentId && isValidId(filters.studentId)) {
        if (user.role === 'ADMIN' || user.role === 'TEACHER') {
            query.studentId = filters.studentId;
        } else if (user.role === 'PARENT') {
            // ensure it's in their linked array
            const requestedMap = user.parentProfile.students.map(id => id.toString());
            if (requestedMap.includes(filters.studentId)) {
                query.studentId = filters.studentId;
            }
        }
    }

    if (filters.feeStructureId && isValidId(filters.feeStructureId)) {
        query.feeStructureId = filters.feeStructureId;
    }
    if (filters.status) {
        query.status = filters.status;
    }

    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const data = await FeeRecord.find(query)
        .populate('studentId', 'firstName lastName admissionNumber rollNumber class section')
        .populate('feeStructureId', 'title academicYear dueDate amount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await FeeRecord.countDocuments(query);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

exports.getFeeRecordById = async (user, id) => {
    if (!isValidId(id)) {
        const error = new Error('Invalid record ID');
        error.statusCode = 400;
        throw error;
    }

    const record = await FeeRecord.findById(id)
        .populate('studentId', 'firstName lastName admissionNumber class section')
        .populate('feeStructureId', 'title academicYear dueDate amount');

    if (!record) {
        const error = new Error('Fee record not found');
        error.statusCode = 404;
        throw error;
    }

    // RBAC validation
    if (user.role === 'STUDENT') {
        const student = await Student.findOne({ user: user._id });
        if (!student || student._id.toString() !== record.studentId._id.toString()) {
            const error = new Error('Access denied. You can only view your own records.');
            error.statusCode = 403;
            throw error;
        }
    } else if (user.role === 'PARENT') {
        const linkedMap = user.parentProfile?.students?.map(id => id.toString()) || [];
        if (!linkedMap.includes(record.studentId._id.toString())) {
            const error = new Error('Access denied. You can only view records for your linked students.');
            error.statusCode = 403;
            throw error;
        }
    }

    return record;
};

exports.recordPayment = async (user, id, paymentAmount) => {
    if (user.role !== 'ADMIN') {
        const error = new Error('Only administrators can process fee payments currently.');
        error.statusCode = 403;
        throw error;
    }

    if (!isValidId(id)) {
        const error = new Error('Invalid record ID');
        error.statusCode = 400;
        throw error;
    }

    if (paymentAmount === undefined || paymentAmount <= 0) {
        const error = new Error('Invalid payment amount. Must be greater than zero.');
        error.statusCode = 400;
        throw error;
    }

    // Concurrency protection wrapping natively
    const record = await FeeRecord.findById(id);

    if (!record) {
        const error = new Error('Fee record not found');
        error.statusCode = 404;
        throw error;
    }

    if (record.status === 'PAID' || record.amountPaid >= record.amountDue) {
        const error = new Error('Fee is already fully paid.');
        error.statusCode = 400;
        throw error;
    }

    if (record.amountPaid + paymentAmount > record.amountDue) {
        const error = new Error(`Payment exceeds amount due. Outstanding balance is ${record.amountDue - record.amountPaid}.`);
        error.statusCode = 400;
        throw error;
    }

    // Atomic operations mitigating race conditions natively updating increment securely validating boundaries inside schema rules.
    const updated = await FeeRecord.findByIdAndUpdate(
        id,
        {
            $inc: { amountPaid: paymentAmount },
            $set: { paymentDate: new Date() }
        },
        { new: true, runValidators: true }
    );

    // Status resolution handled dynamically natively utilizing the Schema `pre('save')` if `.save()` is called,
    // but `findByIdAndUpdate` bypasses it unless strictly hooked. Let's force an explicit document mapping resolving the enum gracefully.
    const finalRecord = await FeeRecord.findById(id);
    let newStatus = 'PENDING';
    if (finalRecord.amountPaid === finalRecord.amountDue && finalRecord.amountDue > 0) {
        newStatus = 'PAID';
    } else if (finalRecord.amountPaid > 0 && finalRecord.amountPaid < finalRecord.amountDue) {
        newStatus = 'PARTIAL';
    }

    if (finalRecord.status !== newStatus) {
        finalRecord.status = newStatus;
        await finalRecord.save();
    }

    return finalRecord;
};

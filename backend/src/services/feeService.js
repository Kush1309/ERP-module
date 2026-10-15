const mongoose = require('mongoose');
const FeeStructure = require('../models/FeeStructure');
const FeeRecord = require('../models/FeeRecord');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ParentProfile = require('../models/ParentProfile');
const Counter = require('../models/Counter');
const { notifyUsers, userIdsForStudents } = require('./notificationService');
const { getSettings } = require('./settingsService');

const FINANCE_ROLES = ['ADMIN', 'ACCOUNTANT'];
const isFinance = (user) => FINANCE_ROLES.includes(user.role);

const EMPTY_PAGE = { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };

const buildError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};

/**
 * Resolves which students' fee records the current user may see.
 * Returns null for unrestricted (ADMIN) access, otherwise an array of Student ids.
 */
const resolveVisibleStudentIds = async (user) => {
    if (isFinance(user)) {
        return null;
    }

    if (user.role === 'STUDENT') {
        const student = await Student.findOne({ user: user._id }).select('_id').lean();
        return student ? [student._id] : [];
    }

    if (user.role === 'PARENT') {
        const profile = await ParentProfile.findOne({ user: user._id }).select('students').lean();
        return profile?.students || [];
    }

    if (user.role === 'TEACHER') {
        // Teachers may only see fee status of the class/section they are assigned to
        const teacher = await Teacher.findOne({ user: user._id }).lean();
        if (!teacher) return [];
        return Student.find({ class: teacher.assignedClass, section: teacher.assignedSection }).distinct('_id');
    }

    return [];
};

/**
 * Utility: Checks if string is a valid ObjectId
 */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);


// ==========================================
// FEE STRUCTURES (Templates)
// ==========================================

exports.createFeeStructure = async (user, data) => {
    if (!isFinance(user)) {
        const error = new Error('Only administrators or accountants can create fee structures.');
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
        query.title = { $regex: String(filters.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    if (filters.academicYear) {
        query.academicYear = filters.academicYear;
    }
    if (filters.status) {
        query.status = filters.status;
    }

    const page = Math.max(parseInt(filters.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 10, 1), 100);
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
    if (!isFinance(user)) {
        const error = new Error('Only administrators or accountants can update fee structures.');
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
    if (!isFinance(user)) {
        const error = new Error('Only administrators or accountants can delete fee structures.');
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
    if (!isFinance(user)) {
        const error = new Error('Only administrators or accountants can assign fees to students.');
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

    const student = await Student.findById(studentId).select('_id').lean();
    if (!student) {
        throw buildError('Referenced student does not exist.', 404);
    }

    // Check duplicate assignment
    const existing = await FeeRecord.findOne({ studentId, feeStructureId });
    if (existing) {
        const error = new Error('This student is already assigned this exact fee structure.');
        error.statusCode = 409;
        throw error;
    }

    const record = new FeeRecord({
        studentId,
        feeStructureId,
        amountDue: amountDue !== undefined ? amountDue : structure.amount,
        amountPaid: 0,
        dueDate: structure.dueDate,
        status: 'PENDING'
    });

    await record.save();

    notifyUsers(await userIdsForStudents([studentId]), {
        type: 'FEE',
        title: `Fee assigned: ${structure.title}`,
        message: `Amount ${record.amountDue}${structure.dueDate ? ` due by ${structure.dueDate.toISOString().slice(0, 10)}` : ''}.`,
        link: '/fees',
    });
    return record;
};


exports.getFeeRecords = async (user, filters = {}) => {
    await exports.refreshOverdueStatuses();
    const query = {};

    // Role-based scoping (never trust client supplied student ids for non-admins)
    const visibleIds = await resolveVisibleStudentIds(user);
    if (visibleIds !== null) {
        if (visibleIds.length === 0) {
            return EMPTY_PAGE;
        }
        query.studentId = { $in: visibleIds };
    }

    if (filters.studentId) {
        if (!isValidId(filters.studentId)) {
            throw buildError('Invalid student ID filter', 400);
        }
        const allowed = visibleIds === null || visibleIds.some((id) => id.toString() === String(filters.studentId));
        if (!allowed) {
            return EMPTY_PAGE;
        }
        query.studentId = filters.studentId;
    }

    if (filters.feeStructureId && isValidId(filters.feeStructureId)) {
        query.feeStructureId = filters.feeStructureId;
    }
    if (filters.status) {
        query.status = String(filters.status).toUpperCase();
    }

    const page = Math.max(parseInt(filters.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 10, 1), 100);
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
    const visibleIds = await resolveVisibleStudentIds(user);
    if (visibleIds !== null) {
        const ownerId = (record.studentId?._id || record.studentId)?.toString();
        if (!ownerId || !visibleIds.some((sid) => sid.toString() === ownerId)) {
            throw buildError('Access denied. You can only view fee records you are permitted to see.', 403);
        }
    }

    return record;
};

const PAYMENT_METHODS = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER'];

const nextReceiptNumber = async () => {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
        { key: `FEE_RECEIPT:${year}` },
        { $inc: { seq: 1 }, $setOnInsert: { role: 'ADMIN', year } },
        { new: true, upsert: true }
    );
    return `RCPT-${year}-${String(counter.seq).padStart(6, '0')}`;
};

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Records an offline payment (cash, cheque, bank transfer, UPI collected at the counter).
 * No online gateway is integrated, so nothing here pretends a card was charged.
 */
exports.recordPayment = async (user, id, paymentInput) => {
    if (!isFinance(user)) {
        throw buildError('Only administrators or accountants can record fee payments.', 403);
    }
    if (!isValidId(id)) {
        throw buildError('Invalid record ID', 400);
    }

    const details = (paymentInput && typeof paymentInput === 'object') ? paymentInput : { paymentAmount: paymentInput };
    const amount = Number(details.paymentAmount);
    if (details.paymentAmount === undefined || details.paymentAmount === null || details.paymentAmount === '' || !Number.isFinite(amount) || amount <= 0) {
        throw buildError('Invalid payment amount. Must be greater than zero.', 400);
    }
    const method = details.method ? String(details.method).toUpperCase() : 'CASH';
    if (!PAYMENT_METHODS.includes(method)) {
        throw buildError(`Payment method must be one of ${PAYMENT_METHODS.join(', ')}`, 400);
    }

    const record = await FeeRecord.findById(id);
    if (!record) {
        throw buildError('Fee record not found', 404);
    }

    const netDue = round2(record.amountDue - (record.discount || 0));
    if (record.status === 'PAID' || record.amountPaid >= netDue) {
        throw buildError('Fee is already fully paid.', 400);
    }

    const newAmountPaid = round2(record.amountPaid + amount);
    if (newAmountPaid > netDue) {
        throw buildError(`Payment exceeds amount due. Outstanding balance is ${round2(netDue - record.amountPaid)}.`, 400);
    }

    const pastDue = record.dueDate && record.dueDate < new Date();
    const newStatus = newAmountPaid >= netDue ? 'PAID' : (pastDue ? 'OVERDUE' : 'PARTIAL');
    const receiptNumber = await nextReceiptNumber();
    const payment = {
        amount: round2(amount),
        paidAt: new Date(),
        method,
        reference: String(details.reference || '').trim(),
        note: String(details.note || '').trim(),
        receiptNumber,
        recordedBy: user._id,
    };

    // Optimistic concurrency: only apply if nobody else paid in the meantime
    const finalRecord = await FeeRecord.findOneAndUpdate(
        { _id: id, amountPaid: record.amountPaid },
        { $set: { amountPaid: newAmountPaid, status: newStatus, paymentDate: payment.paidAt }, $push: { payments: payment } },
        { new: true, runValidators: true }
    );

    if (!finalRecord) {
        throw buildError('This fee record was updated by another payment. Please refresh and try again.', 409);
    }

    notifyUsers(await userIdsForStudents([finalRecord.studentId]), {
        type: 'FEE',
        title: `Payment received (${receiptNumber})`,
        message: `Amount ${payment.amount} received. Remaining balance ${round2(netDue - newAmountPaid)}.`,
        link: '/fees',
    });

    return finalRecord;
};

// Approved concession / scholarship / waiver. Administrator approval only.
exports.applyDiscount = async (user, id, { discount, reason }) => {
    if (user.role !== 'ADMIN') {
        throw buildError('Only administrators can approve fee concessions.', 403);
    }
    if (!isValidId(id)) throw buildError('Invalid record ID', 400);
    const value = Number(discount);
    if (!Number.isFinite(value) || value < 0) throw buildError('Discount must be zero or a positive number.', 400);
    if (value > 0 && !String(reason || '').trim()) throw buildError('A reason is required for a concession.', 400);

    const record = await FeeRecord.findById(id);
    if (!record) throw buildError('Fee record not found', 404);
    if (value > record.amountDue) throw buildError('Discount cannot exceed the amount due.', 400);
    if (record.amountPaid > round2(record.amountDue - value)) {
        throw buildError('Discount would make the amount already paid exceed the net payable.', 400);
    }

    record.discount = round2(value);
    record.discountReason = String(reason || '').trim();
    record.discountApprovedBy = user._id;
    await record.save();
    return record;
};

// Marks unpaid records whose due date has passed as OVERDUE (and back-fills due dates of older records)
exports.refreshOverdueStatuses = async () => {
    const missingDue = await FeeRecord.find({ dueDate: null }).select('feeStructureId').lean();
    if (missingDue.length) {
        const structures = await FeeStructure.find({ _id: { $in: missingDue.map((r) => r.feeStructureId) } }).select('dueDate').lean();
        const dueById = new Map(structures.map((st) => [String(st._id), st.dueDate]));
        await Promise.all(missingDue.map((r) => FeeRecord.updateOne({ _id: r._id }, { $set: { dueDate: dueById.get(String(r.feeStructureId)) || null } })));
    }
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    await FeeRecord.updateMany(
        { status: { $in: ['PENDING', 'PARTIAL'] }, dueDate: { $ne: null, $lt: startOfToday } },
        { $set: { status: 'OVERDUE' } }
    );
};

// Data for a printable receipt
exports.getReceipt = async (user, id, receiptNumber) => {
    const record = await exports.getFeeRecordById(user, id);
    const payment = (record.payments || []).find((p) => p.receiptNumber === receiptNumber);
    if (!payment) throw buildError('Receipt not found', 404);
    const school = await getSettings();
    return { school, record, payment };
};

// Fee collection and outstanding dues summary (finance roles)
exports.getFinanceSummary = async (user, filters = {}) => {
    if (!isFinance(user)) throw buildError('Only administrators or accountants can view finance reports.', 403);
    await exports.refreshOverdueStatuses();

    const recordFilter = {};
    if (filters.feeStructureId && isValidId(filters.feeStructureId)) recordFilter.feeStructureId = filters.feeStructureId;
    const records = await FeeRecord.find(recordFilter)
        .populate('studentId', 'class section')
        .populate('feeStructureId', 'title academicYear')
        .lean();

    const totals = { gross: 0, discount: 0, net: 0, collected: 0, outstanding: 0, overdueAmount: 0, overdueCount: 0, records: records.length };
    const byStatus = { PENDING: 0, PARTIAL: 0, PAID: 0, OVERDUE: 0 };
    const byClass = new Map();
    const byMonth = new Map();
    const byMethod = new Map();

    records.forEach((r) => {
        const net = Math.max(r.amountDue - (r.discount || 0), 0);
        const outstanding = Math.max(net - r.amountPaid, 0);
        totals.gross += r.amountDue;
        totals.discount += r.discount || 0;
        totals.net += net;
        totals.collected += r.amountPaid;
        totals.outstanding += outstanding;
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
        if (r.status === 'OVERDUE') {
            totals.overdueCount += 1;
            totals.overdueAmount += outstanding;
        }
        const cls = r.studentId ? `${r.studentId.class}-${r.studentId.section}` : 'Unknown';
        const c = byClass.get(cls) || { className: cls, net: 0, collected: 0, outstanding: 0 };
        c.net += net; c.collected += r.amountPaid; c.outstanding += outstanding;
        byClass.set(cls, c);

        const payments = r.payments?.length ? r.payments : (r.amountPaid > 0 ? [{ amount: r.amountPaid, paidAt: r.paymentDate || r.updatedAt, method: 'UNRECORDED' }] : []);
        payments.forEach((p) => {
            const month = new Date(p.paidAt).toISOString().slice(0, 7);
            byMonth.set(month, round2((byMonth.get(month) || 0) + p.amount));
            byMethod.set(p.method, round2((byMethod.get(p.method) || 0) + p.amount));
        });
    });

    Object.keys(totals).forEach((k) => { totals[k] = round2(totals[k]); });
    totals.collectionRate = totals.net ? round2((totals.collected / totals.net) * 100) : null;

    return {
        totals,
        byStatus,
        byClass: [...byClass.values()].map((c) => ({ ...c, net: round2(c.net), collected: round2(c.collected), outstanding: round2(c.outstanding) }))
            .sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true })),
        byMonth: [...byMonth.entries()].sort().map(([month, amount]) => ({ month, amount })),
        byMethod: [...byMethod.entries()].map(([method, amount]) => ({ method, amount })),
    };
};

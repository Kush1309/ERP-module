const mongoose = require('mongoose');
const LeaveRequest = require('../models/LeaveRequest');
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

const resolveRequesterContext = async (userId, role) => {
    if (role === 'STUDENT') {
        const student = await Student.findOne({ user: userId }).lean();
        if (!student) throw new AppError('Student profile not found', 404);
        return { requesterId: student._id, requesterModel: 'Student' };
    } else if (role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: userId }).lean();
        if (!teacher) throw new AppError('Teacher profile not found', 404);
        return { requesterId: teacher._id, requesterModel: 'Teacher' };
    }
    return null;
};

const createLeaveRequest = async (userId, data) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    const userRole = await resolveActor(userId);

    if (userRole.role === 'PARENT') {
        throw new AppError('Unauthorized to create leave request', 403);
    }

    const { startDate, endDate, type, reason } = data;

    let requesterId, requesterModel;

    if (userRole.role === 'STUDENT' || userRole.role === 'TEACHER') {
        const context = await resolveRequesterContext(userId, userRole.role);
        requesterId = context.requesterId;
        requesterModel = context.requesterModel;
    } else if (userRole.role === 'ADMIN') {
        if (!data.requesterId || !data.requesterModel) {
            throw new AppError('Admin must provide requesterId and requesterModel', 400);
        }
        validateObjectId(data.requesterId, 'Invalid requesterId');
        requesterId = data.requesterId;
        requesterModel = data.requesterModel;
    }

    const payload = {
        requesterId,
        requesterModel,
        startDate,
        endDate,
        type,
        reason,
        status: 'PENDING'
    };

    const leave = await LeaveRequest.create(payload);
    return leave;
};

const getLeaveRequests = async (userId, queryOpts = {}) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    const userRole = await resolveActor(userId);

    let { page = 1, limit = 10, status, requesterModel } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const match = {};
    if (status) match.status = String(status).toUpperCase();
    if (requesterModel) match.requesterModel = String(requesterModel);

    if (userRole.role === 'TEACHER' || userRole.role === 'STUDENT') {
        const context = await resolveRequesterContext(userId, userRole.role);
        match.requesterId = context.requesterId;
        match.requesterModel = context.requesterModel;
    } else if (userRole.role === 'PARENT') {
        const parent = await ParentProfile.findOne({ user: userId }).lean();
        if (!parent || !parent.students || parent.students.length === 0) {
            return { data: [], pagination: { total: 0, page, limit, pages: 0 } };
        }
        match.requesterId = { $in: parent.students };
        match.requesterModel = 'Student';
    }

    const [data, total] = await Promise.all([
        LeaveRequest.find(match)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('requesterId', 'firstName lastName admissionNumber employeeId class section')
            .populate('approverId', 'firstName lastName')
            .lean(),
        LeaveRequest.countDocuments(match)
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

const enforceAccessCheck = async (userId, userRole, leave) => {
    if (userRole.role === 'ADMIN') return true;

    if (userRole.role === 'STUDENT' || userRole.role === 'TEACHER') {
        const context = await resolveRequesterContext(userId, userRole.role);
        if (leave.requesterId.toString() !== context.requesterId.toString() || leave.requesterModel !== context.requesterModel) {
            throw new AppError('Unauthorized access to leave request', 403);
        }
    } else if (userRole.role === 'PARENT') {
        if (leave.requesterModel !== 'Student') {
            throw new AppError('Unauthorized access to leave request', 403);
        }
        const parent = await ParentProfile.findOne({ user: userId }).lean();
        if (!parent || !parent.students || parent.students.length === 0) {
            throw new AppError('Unauthorized access to leave request', 403);
        }
        const hasAccess = parent.students.some(s => s.toString() === leave.requesterId.toString());
        if (!hasAccess) {
            throw new AppError('Unauthorized access to leave request', 403);
        }
    }
};

const getLeaveRequestById = async (userId, leaveId) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(leaveId, 'Invalid leave ID');

    const userRole = await resolveActor(userId);
    const leave = await LeaveRequest.findById(leaveId)
        .populate('requesterId', 'firstName lastName admissionNumber employeeId class section')
        .populate('approverId', 'firstName lastName')
        .lean();

    if (!leave) throw new AppError('Leave request not found', 404);

    await enforceAccessCheck(userId, userRole, leave);

    return leave;
};

const updateLeaveRequest = async (userId, leaveId, data) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(leaveId, 'Invalid leave ID');

    const userRole = await resolveActor(userId);
    if (userRole.role === 'PARENT') {
        throw new AppError('Unauthorized to update leave request', 403);
    }

    const existing = await LeaveRequest.findById(leaveId).lean();
    if (!existing) throw new AppError('Leave request not found', 404);

    await enforceAccessCheck(userId, userRole, existing);

    if (userRole.role !== 'ADMIN' && existing.status !== 'PENDING') {
        throw new AppError('Cannot modify a non-pending leave request', 400);
    }

    const updatePayload = {};
    if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
    if (data.endDate !== undefined) updatePayload.endDate = data.endDate;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.reason !== undefined) updatePayload.reason = data.reason;

    if (Object.keys(updatePayload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const updated = await LeaveRequest.findByIdAndUpdate(
        leaveId,
        { $set: updatePayload },
        { new: true, runValidators: true }
    ).populate('requesterId').populate('approverId').lean();

    return updated;
};

const deleteLeaveRequest = async (userId, leaveId) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(leaveId, 'Invalid leave ID');

    const userRole = await resolveActor(userId);
    if (userRole.role === 'PARENT') {
        throw new AppError('Unauthorized to delete leave request', 403);
    }

    const existing = await LeaveRequest.findById(leaveId).lean();
    if (!existing) throw new AppError('Leave request not found', 404);

    await enforceAccessCheck(userId, userRole, existing);

    if (userRole.role !== 'ADMIN' && existing.status !== 'PENDING') {
        throw new AppError('Cannot delete a non-pending leave request', 400);
    }

    await LeaveRequest.findByIdAndDelete(leaveId);
    return { success: true, message: 'Leave request deleted safely' };
};

const changeLeaveStatus = async (userId, leaveId, newStatus, data = {}) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(leaveId, 'Invalid leave ID');

    const userRole = await resolveActor(userId);
    if (userRole.role !== 'ADMIN') {
        throw new AppError('Only Admins can change leave request status', 403);
    }

    const existing = await LeaveRequest.findById(leaveId).lean();
    if (!existing) throw new AppError('Leave request not found', 404);

    if (existing.status !== 'PENDING') {
        throw new AppError('Cannot change status of a non-pending leave request', 400);
    }

    const updatePayload = {
        status: newStatus,
        approverId: userId
    };

    if (data.adminComment !== undefined) {
        updatePayload.adminComment = data.adminComment;
    }

    const updated = await LeaveRequest.findByIdAndUpdate(
        leaveId,
        { $set: updatePayload },
        { new: true, runValidators: true }
    ).populate('requesterId').populate('approverId').lean();

    return updated;
};

const approveLeaveRequest = (userId, leaveId, data) => changeLeaveStatus(userId, leaveId, 'APPROVED', data);
const rejectLeaveRequest = (userId, leaveId, data) => changeLeaveStatus(userId, leaveId, 'REJECTED', data);

module.exports = {
    createLeaveRequest,
    getLeaveRequests,
    getLeaveRequestById,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest
};

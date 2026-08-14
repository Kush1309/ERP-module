const {
    createLeaveRequest,
    getLeaveRequests,
    getLeaveRequestById,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest
} = require('../services/leaveService');

const createLeave = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const {
            startDate,
            endDate,
            type,
            reason
        } = req.body;

        const safeData = {
            startDate,
            endDate,
            type,
            reason
        };

        const leave = await createLeaveRequest(userId, safeData);
        res.status(201).json(leave);
    } catch (err) {
        next(err);
    }
};

const getLeaves = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const {
            page,
            limit,
            status,
            requesterModel
        } = req.query;

        const safeQuery = {};
        if (page !== undefined) safeQuery.page = page;
        if (limit !== undefined) safeQuery.limit = limit;
        if (status !== undefined) safeQuery.status = status;
        if (requesterModel !== undefined) safeQuery.requesterModel = requesterModel;

        const result = await getLeaveRequests(userId, safeQuery);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getLeaveById = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const leave = await getLeaveRequestById(userId, id);
        res.status(200).json(leave);
    } catch (err) {
        next(err);
    }
};

const updateLeave = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const {
            startDate,
            endDate,
            type,
            reason
        } = req.body;

        const safeData = {};
        if (startDate !== undefined) safeData.startDate = startDate;
        if (endDate !== undefined) safeData.endDate = endDate;
        if (type !== undefined) safeData.type = type;
        if (reason !== undefined) safeData.reason = reason;

        const updated = await updateLeaveRequest(userId, id, safeData);
        res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

const deleteLeave = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const result = await deleteLeaveRequest(userId, id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const updateLeaveStatus = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const { status, adminComment } = req.body;

        let result;
        if (status === 'APPROVED') {
            result = await approveLeaveRequest(userId, id, { adminComment });
        } else if (status === 'REJECTED') {
            result = await rejectLeaveRequest(userId, id, { adminComment });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid status for this operation' });
        }

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createLeave,
    getLeaves,
    getLeaveById,
    updateLeave,
    deleteLeave,
    updateLeaveStatus
};

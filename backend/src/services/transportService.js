const mongoose = require('mongoose');
const TransportRoute = require('../models/TransportRoute');
const TransportAllocation = require('../models/TransportAllocation');
const AppError = require('../utils/AppError');
const Student = require('../models/Student');
const ParentProfile = require('../models/ParentProfile');
const { ROLES } = require('../constants/roles');

const validateObjectId = (id, resourceName = 'ID') => {
    if (!id || !mongoose.Types.ObjectId.isValid(id.toString())) {
        throw new AppError(`Invalid ${resourceName}`, 400);
    }
};

const handleDuplicateKeyError = (err, defaultMsg) => {
    if (err.code === 11000) {
        throw new AppError(defaultMsg, 400);
    }
    throw err;
};

// ============================================
// Transport Route Operations
// ============================================

exports.createRoute = async (data) => {
    const { name, vehicleNumber, driverName, capacity, stops } = data;
    try {
        const route = await TransportRoute.create({ name, vehicleNumber, driverName, capacity, stops });
        return route;
    } catch (err) {
        return handleDuplicateKeyError(err, 'Route with this name already exists');
    }
};

exports.getRoutes = async (query = {}) => {
    const { search, page = 1, limit = 10 } = query;
    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { driverName: { $regex: search, $options: 'i' } },
            { vehicleNumber: { $regex: search, $options: 'i' } }
        ];
    }

    const pageNum = Math.max(1, parseInt(page, 10)) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const routes = await TransportRoute.find(filter)
        .select('-__v')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await TransportRoute.countDocuments(filter);

    return {
        routes,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1
        }
    };
};

exports.getRouteById = async (id) => {
    validateObjectId(id, 'Route ID');
    const route = await TransportRoute.findById(id).select('-__v').lean();
    if (!route) throw new AppError('Route not found', 404);
    return route;
};

exports.updateRoute = async (id, data) => {
    validateObjectId(id, 'Route ID');
    const { name, vehicleNumber, driverName, capacity, stops } = data;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (stops !== undefined) updateData.stops = stops;

    try {
        const route = await TransportRoute.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-__v').lean();

        if (!route) throw new AppError('Route not found', 404);
        return route;
    } catch (err) {
        return handleDuplicateKeyError(err, 'Route with this name already exists');
    }
};

exports.deleteRoute = async (id) => {
    validateObjectId(id, 'Route ID');

    const hasActiveAllocations = await TransportAllocation.exists({ routeId: id, status: 'ACTIVE' });
    if (hasActiveAllocations) {
        throw new AppError('Cannot delete route with active allocations', 400);
    }

    const route = await TransportRoute.findByIdAndDelete(id).select('-__v').lean();
    if (!route) throw new AppError('Route not found', 404);
    return route;
};

// ============================================
// Transport Allocation Operations
// ============================================

exports.createAllocation = async (data, user) => {
    if (user.role !== ROLES.ADMIN) {
        throw new AppError('Only administrators can modify transport allocations', 403);
    }

    const { studentId, routeId, pickupStop, dropStop } = data;

    validateObjectId(studentId, 'Student ID');
    validateObjectId(routeId, 'Route ID');

    const studentExists = await Student.exists({ _id: studentId });
    if (!studentExists) throw new AppError('Student not found', 404);

    const route = await TransportRoute.findById(routeId).lean();
    if (!route) throw new AppError('Route not found', 404);

    if (!route.stops || !route.stops.includes(pickupStop)) {
        throw new AppError('Invalid pickup stop: Stop not found on route', 400);
    }
    if (!route.stops || !route.stops.includes(dropStop)) {
        throw new AppError('Invalid drop stop: Stop not found on route', 400);
    }

    try {
        const allocation = await TransportAllocation.create({
            studentId,
            routeId,
            pickupStop,
            dropStop,
            status: 'ACTIVE'
        });
        return allocation;
    } catch (err) {
        return handleDuplicateKeyError(err, 'Student already has an active transport allocation');
    }
};

exports.getAllocations = async (query = {}, user) => {
    const filter = {};

    if (user.role === ROLES.STUDENT) {
        const student = await Student.findOne({ user: user._id }).lean();
        if (!student) throw new AppError('Student profile not found', 404);
        filter.studentId = student._id;
    } else if (user.role === ROLES.PARENT) {
        const parent = await ParentProfile.findOne({ user: user._id }).lean();
        if (!parent || !parent.students || parent.students.length === 0) {
            return { allocations: [], pagination: { total: 0 } };
        }
        filter.studentId = { $in: parent.students };
    } else if (user.role === ROLES.ADMIN) {
        if (query.studentId) {
            validateObjectId(query.studentId, 'Student ID filter');
            filter.studentId = query.studentId;
        }
    } else {
        throw new AppError('Unauthorized role access to allocations', 403);
    }

    if (query.routeId) {
        validateObjectId(query.routeId, 'Route ID filter');
        filter.routeId = query.routeId;
    }
    if (query.status && ['ACTIVE', 'INACTIVE'].includes(query.status)) {
        filter.status = query.status;
    }

    const { page = 1, limit = 10 } = query;
    const pageNum = Math.max(1, parseInt(page, 10)) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const allocations = await TransportAllocation.find(filter)
        .populate('studentId', 'firstName lastName admissionNumber')
        .populate('routeId', 'name vehicleNumber driverName')
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await TransportAllocation.countDocuments(filter);

    return {
        allocations,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1
        }
    };
};

const resolveOwnershipFilter = async (user, allocationId) => {
    if (user.role === ROLES.ADMIN) return { _id: allocationId };

    if (user.role === ROLES.STUDENT) {
        const student = await Student.findOne({ user: user._id }).lean();
        return { _id: allocationId, studentId: student ? student._id : null };
    }

    if (user.role === ROLES.PARENT) {
        const parent = await ParentProfile.findOne({ user: user._id }).lean();
        const studentIds = parent && parent.students ? parent.students : [];
        return { _id: allocationId, studentId: { $in: studentIds } };
    }

    return { _id: null };
};

exports.getAllocationById = async (id, user) => {
    validateObjectId(id, 'Allocation ID');

    if (![ROLES.ADMIN, ROLES.STUDENT, ROLES.PARENT].includes(user.role)) {
        throw new AppError('Unauthorized role access to allocations', 403);
    }

    const ownershipFilter = await resolveOwnershipFilter(user, id);
    if (!ownershipFilter._id) {
        throw new AppError('Allocation not found or access denied', 404);
    }

    const allocation = await TransportAllocation.findOne(ownershipFilter)
        .populate('studentId', 'firstName lastName admissionNumber')
        .populate('routeId', 'name vehicleNumber driverName stops')
        .select('-__v')
        .lean();

    if (!allocation) {
        throw new AppError('Allocation not found or access denied', 404);
    }

    return allocation;
};

exports.updateAllocation = async (id, data, user) => {
    validateObjectId(id, 'Allocation ID');

    if (user.role !== ROLES.ADMIN) {
        throw new AppError('Only administrators can modify transport allocations', 403);
    }

    const { routeId, pickupStop, dropStop, status } = data;

    const existing = await TransportAllocation.findById(id).lean();
    if (!existing) throw new AppError('Allocation not found', 404);

    const updateData = {};
    if (status !== undefined) {
        if (!['ACTIVE', 'INACTIVE'].includes(status)) {
            throw new AppError('Invalid status value', 400);
        }
        updateData.status = status;
    }

    const targetRouteId = routeId !== undefined ? routeId : existing.routeId;
    if (routeId !== undefined) {
        validateObjectId(routeId, 'Target Route ID');
        updateData.routeId = routeId;
    }

    let targetRoute = null;
    if (routeId !== undefined || pickupStop !== undefined || dropStop !== undefined) {
        targetRoute = await TransportRoute.findById(targetRouteId).lean();
        if (!targetRoute) throw new AppError('Target route not found', 404);
    }

    const targetPickup = pickupStop !== undefined ? pickupStop : existing.pickupStop;
    const targetDrop = dropStop !== undefined ? dropStop : existing.dropStop;

    if (targetRoute) {
        if (!targetRoute.stops || !targetRoute.stops.includes(targetPickup)) {
            throw new AppError('Invalid pickup stop: Stop not found on target route', 400);
        }
        if (!targetRoute.stops || !targetRoute.stops.includes(targetDrop)) {
            throw new AppError('Invalid drop stop: Stop not found on target route', 400);
        }
    }

    if (pickupStop !== undefined) updateData.pickupStop = pickupStop;
    if (dropStop !== undefined) updateData.dropStop = dropStop;

    try {
        const allocation = await TransportAllocation.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-__v').lean();

        return allocation;
    } catch (err) {
        return handleDuplicateKeyError(err, 'Student already has an active transport allocation');
    }
};

exports.deleteAllocation = async (id, user) => {
    validateObjectId(id, 'Allocation ID');

    if (user.role !== ROLES.ADMIN) {
        throw new AppError('Only administrators can delete transport allocations', 403);
    }

    const allocation = await TransportAllocation.findById(id).lean();
    if (!allocation) throw new AppError('Allocation not found', 404);

    // Deactivate safely tracking historical allocations
    const inact = await TransportAllocation.findByIdAndUpdate(
        id,
        { status: 'INACTIVE' },
        { new: true }
    ).select('-__v').lean();

    return inact;
};

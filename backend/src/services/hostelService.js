const HostelRoom = require('../models/HostelRoom');
const HostelAllocation = require('../models/HostelAllocation');
const Student = require('../models/Student');
const AppError = require('../utils/AppError');
const { assertObjectId, pick, escapeRegex } = require('../utils/queryHelpers');

const ROOM_FIELDS = ['block', 'roomNumber', 'type', 'capacity', 'feePerTerm', 'status', 'notes'];

const occupancyByRoom = async () => {
    const active = await HostelAllocation.find({ status: 'ACTIVE' }).select('room').lean();
    const counts = new Map();
    active.forEach((a) => counts.set(String(a.room), (counts.get(String(a.room)) || 0) + 1));
    return counts;
};

const listRooms = async (query = {}) => {
    const filter = {};
    if (query.block) filter.block = String(query.block);
    if (query.type) filter.type = String(query.type).toUpperCase();
    if (query.status) filter.status = String(query.status).toUpperCase();
    if (query.search) {
        const regex = { $regex: escapeRegex(query.search), $options: 'i' };
        filter.$or = [{ block: regex }, { roomNumber: regex }];
    }
    const [rooms, counts] = await Promise.all([HostelRoom.find(filter).lean(), occupancyByRoom()]);
    rooms.sort((a, b) => a.block.localeCompare(b.block) || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
    return rooms.map((r) => {
        const occupied = counts.get(String(r._id)) || 0;
        return { ...r, occupied, available: Math.max(r.capacity - occupied, 0) };
    });
};

const createRoom = async (data) => {
    try {
        return (await HostelRoom.create(pick(data, ROOM_FIELDS))).toObject();
    } catch (error) {
        if (error.code === 11000) throw new AppError('A room with this number already exists in that block', 409);
        throw error;
    }
};

const updateRoom = async (id, data) => {
    assertObjectId(id, 'room ID');
    const room = await HostelRoom.findById(id);
    if (!room) throw new AppError('Room not found', 404);
    const updates = pick(data, ROOM_FIELDS);
    if (updates.capacity !== undefined) {
        const occupied = await HostelAllocation.countDocuments({ room: id, status: 'ACTIVE' });
        if (Number(updates.capacity) < occupied) throw new AppError(`Capacity cannot be lower than the ${occupied} current occupant(s)`, 400);
    }
    Object.assign(room, updates);
    try {
        await room.save();
    } catch (error) {
        if (error.code === 11000) throw new AppError('A room with this number already exists in that block', 409);
        throw error;
    }
    return room.toObject();
};

const deleteRoom = async (id) => {
    assertObjectId(id, 'room ID');
    const occupied = await HostelAllocation.countDocuments({ room: id, status: 'ACTIVE' });
    if (occupied) throw new AppError('Vacate all occupants before deleting this room', 409);
    const room = await HostelRoom.findByIdAndDelete(id);
    if (!room) throw new AppError('Room not found', 404);
    return { deleted: true };
};

const listAllocations = async (query = {}) => {
    const filter = {};
    if (query.status) filter.status = String(query.status).toUpperCase();
    if (query.room) { assertObjectId(query.room, 'room ID'); filter.room = query.room; }
    return HostelAllocation.find(filter)
        .populate('room', 'block roomNumber type')
        .populate('student', 'studentId firstName lastName class section')
        .sort({ createdAt: -1 })
        .lean();
};

const allocate = async ({ room: roomId, student: studentId, bedNumber, startDate, notes }) => {
    assertObjectId(roomId, 'room ID');
    assertObjectId(studentId, 'student ID');
    const [room, student] = await Promise.all([HostelRoom.findById(roomId).lean(), Student.findById(studentId).lean()]);
    if (!room) throw new AppError('Room not found', 404);
    if (!student) throw new AppError('Student not found', 404);
    if (student.status !== 'ACTIVE') throw new AppError('Only active students can be allocated a bed', 400);
    if (room.status !== 'AVAILABLE') throw new AppError(`Room is ${room.status.toLowerCase()} and cannot take occupants`, 400);
    // Checked explicitly as well as by the partial unique index
    if (await HostelAllocation.exists({ student: studentId, status: 'ACTIVE' })) {
        throw new AppError('This student already has an active hostel allocation', 409);
    }
    const occupied = await HostelAllocation.countDocuments({ room: roomId, status: 'ACTIVE' });
    if (occupied >= room.capacity) throw new AppError('This room is full', 409);
    try {
        const allocation = await HostelAllocation.create({ room: roomId, student: studentId, bedNumber, startDate: startDate || new Date(), notes });
        return allocation.toObject();
    } catch (error) {
        if (error.code === 11000) throw new AppError('This student already has an active hostel allocation', 409);
        throw error;
    }
};

const vacate = async (id) => {
    assertObjectId(id, 'allocation ID');
    const allocation = await HostelAllocation.findOneAndUpdate(
        { _id: id, status: 'ACTIVE' },
        { $set: { status: 'VACATED', endDate: new Date() } },
        { new: true }
    ).lean();
    if (!allocation) throw new AppError('Active allocation not found', 404);
    return allocation;
};

const occupancyReport = async () => {
    const rooms = await listRooms();
    const blocks = new Map();
    rooms.forEach((r) => {
        const b = blocks.get(r.block) || { block: r.block, rooms: 0, capacity: 0, occupied: 0 };
        b.rooms += 1; b.capacity += r.capacity; b.occupied += r.occupied;
        blocks.set(r.block, b);
    });
    const totals = rooms.reduce((acc, r) => ({ rooms: acc.rooms + 1, capacity: acc.capacity + r.capacity, occupied: acc.occupied + r.occupied }), { rooms: 0, capacity: 0, occupied: 0 });
    totals.occupancyRate = totals.capacity ? Math.round((totals.occupied / totals.capacity) * 1000) / 10 : null;
    return { totals, blocks: [...blocks.values()].map((b) => ({ ...b, occupancyRate: b.capacity ? Math.round((b.occupied / b.capacity) * 1000) / 10 : null })) };
};

// Student / parent view of their own allocation
const getMyAllocation = async (studentIds) => HostelAllocation.find({ student: { $in: studentIds }, status: 'ACTIVE' })
    .populate('room', 'block roomNumber type feePerTerm')
    .populate('student', 'firstName lastName')
    .lean();

module.exports = { listRooms, createRoom, updateRoom, deleteRoom, listAllocations, allocate, vacate, occupancyReport, getMyAllocation };

const StaffAttendance = require('../models/StaffAttendance');
const Teacher = require('../models/Teacher');
const StaffProfile = require('../models/StaffProfile');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ROLES, STAFF_ROLES } = require('../constants/roles');
const { startOfUtcDay, assertObjectId } = require('../utils/queryHelpers');

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE', 'HALF_DAY'];

// All active staff: teachers + non-teaching staff, with display names
const getStaffDirectory = async () => {
    const users = await User.find({ role: { $in: [ROLES.TEACHER, ...STAFF_ROLES] }, isActive: true })
        .select('loginId role').lean();
    const ids = users.map((u) => u._id);
    const [teachers, staff] = await Promise.all([
        Teacher.find({ user: { $in: ids } }).select('user firstName lastName assignedClass assignedSection').lean(),
        StaffProfile.find({ user: { $in: ids } }).select('user firstName lastName designation department').lean(),
    ]);
    const profiles = new Map();
    teachers.forEach((t) => profiles.set(String(t.user), { name: `${t.firstName} ${t.lastName}`, detail: `Teacher · Class ${t.assignedClass}-${t.assignedSection}` }));
    staff.forEach((s) => profiles.set(String(s.user), { name: `${s.firstName} ${s.lastName}`, detail: [s.designation, s.department].filter(Boolean).join(' · ') }));
    return users
        .map((u) => ({ userId: u._id, loginId: u.loginId, role: u.role, name: profiles.get(String(u._id))?.name || u.loginId, detail: profiles.get(String(u._id))?.detail || u.role }))
        .sort((a, b) => a.name.localeCompare(b.name));
};

const getRoster = async (date) => {
    const day = startOfUtcDay(date || new Date());
    const [directory, records] = await Promise.all([
        getStaffDirectory(),
        StaffAttendance.find({ date: day }).lean(),
    ]);
    const byUser = new Map(records.map((r) => [String(r.user), r]));
    return {
        date: day,
        staff: directory.map((s) => ({
            ...s,
            status: byUser.get(String(s.userId))?.status || null,
            remarks: byUser.get(String(s.userId))?.remarks || '',
        })),
    };
};

const saveAttendance = async (markedBy, { date, records }) => {
    if (!date || !Array.isArray(records) || records.length === 0) {
        throw new AppError('date and a non-empty records array are required', 400);
    }
    const day = startOfUtcDay(date);
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    if (day >= tomorrow) throw new AppError('Attendance cannot be recorded for a future date', 400);

    const directory = await getStaffDirectory();
    const allowed = new Set(directory.map((s) => String(s.userId)));
    const seen = new Set();
    for (const record of records) {
        assertObjectId(record.user, 'staff user ID');
        if (!allowed.has(String(record.user))) throw new AppError('One or more users are not active staff members', 400);
        if (!STATUSES.includes(record.status)) throw new AppError(`Invalid status "${record.status}"`, 400);
        if (seen.has(String(record.user))) throw new AppError('Duplicate staff entries in payload', 400);
        seen.add(String(record.user));
    }

    // Upsert so the same day can be corrected later
    await StaffAttendance.bulkWrite(records.map((record) => ({
        updateOne: {
            filter: { user: record.user, date: day },
            update: { $set: { status: record.status, remarks: String(record.remarks || '').slice(0, 300), markedBy } },
            upsert: true,
        },
    })));
    return getRoster(day);
};

const monthRange = (month) => {
    const match = /^(\d{4})-(\d{2})$/.exec(String(month || ''));
    const now = new Date();
    const year = match ? Number(match[1]) : now.getUTCFullYear();
    const monthIndex = match ? Number(match[2]) - 1 : now.getUTCMonth();
    if (monthIndex < 0 || monthIndex > 11) throw new AppError('month must be YYYY-MM', 400);
    return { start: new Date(Date.UTC(year, monthIndex, 1)), end: new Date(Date.UTC(year, monthIndex + 1, 1)) };
};

const summarise = (records) => {
    const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, ON_LEAVE: 0, HALF_DAY: 0 };
    records.forEach((r) => { counts[r.status] += 1; });
    const total = records.length;
    // Late and half-day count as attended (half-day as 0.5)
    const attended = counts.PRESENT + counts.LATE + counts.HALF_DAY * 0.5;
    return { ...counts, total, percentage: total ? Math.round((attended / total) * 1000) / 10 : null };
};

const getMonthlySummary = async (month) => {
    const { start, end } = monthRange(month);
    const [directory, records] = await Promise.all([
        getStaffDirectory(),
        StaffAttendance.find({ date: { $gte: start, $lt: end } }).lean(),
    ]);
    const byUser = new Map();
    records.forEach((r) => {
        const key = String(r.user);
        if (!byUser.has(key)) byUser.set(key, []);
        byUser.get(key).push(r);
    });
    return {
        month: start.toISOString().slice(0, 7),
        staff: directory.map((s) => ({ ...s, ...summarise(byUser.get(String(s.userId)) || []) })),
    };
};

const getMyAttendance = async (userId, month) => {
    const { start, end } = monthRange(month);
    const records = await StaffAttendance.find({ user: userId, date: { $gte: start, $lt: end } }).sort({ date: 1 }).lean();
    return { month: start.toISOString().slice(0, 7), records, summary: summarise(records) };
};

module.exports = { getRoster, saveAttendance, getMonthlySummary, getMyAttendance, STATUSES };

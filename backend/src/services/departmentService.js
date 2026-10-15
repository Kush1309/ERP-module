const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Teacher = require('../models/Teacher');
const StaffProfile = require('../models/StaffProfile');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { assertObjectId, pick, escapeRegex } = require('../utils/queryHelpers');
const { runInTransaction } = require('../utils/transaction');
const { ROLES, STAFF_ROLES } = require('../constants/roles');

const DEPARTMENT_FIELDS = ['name', 'code', 'type', 'head', 'description', 'status'];
const DESIGNATION_FIELDS = ['title', 'category', 'description', 'status'];
const exact = (value) => ({ $regex: `^${escapeRegex(String(value).trim())}$`, $options: 'i' });

const duplicate = (error, label) => {
    if (error.code === 11000) throw new AppError(`A ${label} with this name already exists`, 409);
    throw error;
};

// ---------- Departments ----------
const validateHead = async (head) => {
    if (!head) return null;
    assertObjectId(head, 'department head');
    const user = await User.findOne({ _id: head, role: { $in: [ROLES.TEACHER, ROLES.ADMIN, ...STAFF_ROLES] } }).select('_id').lean();
    if (!user) throw new AppError('Department head must be a teacher or staff account', 400);
    return head;
};

const memberCounts = async () => {
    const [teachers, staff] = await Promise.all([
        Teacher.find({ department: { $nin: [null, ''] } }).select('department').lean(),
        StaffProfile.find({ department: { $nin: [null, ''] } }).select('department').lean(),
    ]);
    const counts = new Map();
    const add = (name, key) => {
        const k = String(name).toLowerCase();
        const row = counts.get(k) || { teachers: 0, staff: 0 };
        row[key] += 1;
        counts.set(k, row);
    };
    teachers.forEach((t) => add(t.department, 'teachers'));
    staff.forEach((s) => add(s.department, 'staff'));
    return counts;
};

// Display names for department heads (teacher/staff profile name or login ID)
const headNames = async (userIds) => {
    const ids = userIds.filter(Boolean);
    if (!ids.length) return new Map();
    const [users, teachers, staff] = await Promise.all([
        User.find({ _id: { $in: ids } }).select('loginId').lean(),
        Teacher.find({ user: { $in: ids } }).select('user firstName lastName').lean(),
        StaffProfile.find({ user: { $in: ids } }).select('user firstName lastName').lean(),
    ]);
    const names = new Map(users.map((u) => [String(u._id), u.loginId]));
    [...teachers, ...staff].forEach((p) => names.set(String(p.user), `${p.firstName} ${p.lastName}`));
    return names;
};

const listDepartments = async (query = {}) => {
    const filter = {};
    if (query.status) filter.status = String(query.status).toUpperCase();
    if (query.type) filter.type = String(query.type).toUpperCase();
    if (query.search) filter.name = { $regex: escapeRegex(query.search), $options: 'i' };
    const [departments, counts] = await Promise.all([Department.find(filter).sort({ name: 1 }).lean(), memberCounts()]);
    const names = await headNames(departments.map((d) => d.head));
    return departments.map((d) => ({
        ...d,
        headName: d.head ? names.get(String(d.head)) || null : null,
        teacherCount: counts.get(d.name.toLowerCase())?.teachers || 0,
        staffCount: counts.get(d.name.toLowerCase())?.staff || 0,
    }));
};

const createDepartment = async (data) => {
    const payload = pick(data, DEPARTMENT_FIELDS);
    payload.head = await validateHead(payload.head);
    if (await Department.exists({ name: exact(payload.name || '') })) throw new AppError('A department with this name already exists', 409);
    try {
        return (await Department.create(payload)).toObject();
    } catch (error) {
        return duplicate(error, 'department');
    }
};

// Renaming a department also renames it on every teacher and staff profile
const updateDepartment = async (id, data) => {
    assertObjectId(id, 'department ID');
    const department = await Department.findById(id);
    if (!department) throw new AppError('Department not found', 404);
    const updates = pick(data, DEPARTMENT_FIELDS);
    if (updates.head !== undefined) updates.head = await validateHead(updates.head);
    const oldName = department.name;
    const newName = updates.name !== undefined ? String(updates.name).trim() : oldName;
    if (newName.toLowerCase() !== oldName.toLowerCase() && await Department.exists({ _id: { $ne: id }, name: exact(newName) })) {
        throw new AppError('A department with this name already exists', 409);
    }
    Object.assign(department, updates);
    try {
        await runInTransaction(async (session) => {
            await department.save({ session });
            if (newName !== oldName) {
                await Teacher.updateMany({ department: exact(oldName) }, { $set: { department: newName } }, { session });
                await StaffProfile.updateMany({ department: exact(oldName) }, { $set: { department: newName } }, { session });
            }
        });
    } catch (error) {
        return duplicate(error, 'department');
    }
    return department.toObject();
};

const deleteDepartment = async (id) => {
    assertObjectId(id, 'department ID');
    const department = await Department.findById(id);
    if (!department) throw new AppError('Department not found', 404);
    const [teachers, staff] = await Promise.all([
        Teacher.countDocuments({ department: exact(department.name) }),
        StaffProfile.countDocuments({ department: exact(department.name) }),
    ]);
    if (teachers + staff > 0) {
        throw new AppError(`${department.name} has ${teachers + staff} member(s). Move them to another department or mark it inactive.`, 409);
    }
    await department.deleteOne();
    return { deleted: true };
};

// ---------- Designations ----------
const listDesignations = async (query = {}) => {
    const filter = {};
    if (query.status) filter.status = String(query.status).toUpperCase();
    if (query.category) filter.category = String(query.category).toUpperCase();
    const [designations, teachers, staff] = await Promise.all([
        Designation.find(filter).sort({ category: 1, title: 1 }).lean(),
        Teacher.find({ designation: { $nin: [null, ''] } }).select('designation').lean(),
        StaffProfile.find({ designation: { $nin: [null, ''] } }).select('designation').lean(),
    ]);
    const counts = new Map();
    [...teachers, ...staff].forEach((p) => {
        const k = p.designation.toLowerCase();
        counts.set(k, (counts.get(k) || 0) + 1);
    });
    return designations.map((d) => ({ ...d, memberCount: counts.get(d.title.toLowerCase()) || 0 }));
};

const createDesignation = async (data) => {
    const payload = pick(data, DESIGNATION_FIELDS);
    if (await Designation.exists({ title: exact(payload.title || '') })) throw new AppError('A designation with this title already exists', 409);
    try {
        return (await Designation.create(payload)).toObject();
    } catch (error) {
        return duplicate(error, 'designation');
    }
};

const updateDesignation = async (id, data) => {
    assertObjectId(id, 'designation ID');
    const designation = await Designation.findById(id);
    if (!designation) throw new AppError('Designation not found', 404);
    const updates = pick(data, DESIGNATION_FIELDS);
    const oldTitle = designation.title;
    const newTitle = updates.title !== undefined ? String(updates.title).trim() : oldTitle;
    if (newTitle.toLowerCase() !== oldTitle.toLowerCase() && await Designation.exists({ _id: { $ne: id }, title: exact(newTitle) })) {
        throw new AppError('A designation with this title already exists', 409);
    }
    Object.assign(designation, updates);
    try {
        await runInTransaction(async (session) => {
            await designation.save({ session });
            if (newTitle !== oldTitle) {
                await Teacher.updateMany({ designation: exact(oldTitle) }, { $set: { designation: newTitle } }, { session });
                await StaffProfile.updateMany({ designation: exact(oldTitle) }, { $set: { designation: newTitle } }, { session });
            }
        });
    } catch (error) {
        return duplicate(error, 'designation');
    }
    return designation.toObject();
};

const deleteDesignation = async (id) => {
    assertObjectId(id, 'designation ID');
    const designation = await Designation.findById(id);
    if (!designation) throw new AppError('Designation not found', 404);
    const used = await Teacher.countDocuments({ designation: exact(designation.title) }) + await StaffProfile.countDocuments({ designation: exact(designation.title) });
    if (used) throw new AppError(`${used} profile(s) use this designation. Change them first or mark it inactive.`, 409);
    await designation.deleteOne();
    return { deleted: true };
};

/**
 * Validates department/designation values on teacher and staff profiles.
 * Once a list is configured, values must match an ACTIVE entry (returned with canonical casing);
 * before that, free text is accepted so existing data keeps working.
 */
const normaliseAssignment = async ({ department, designation }) => {
    const out = {};
    if (department !== undefined) {
        const value = String(department || '').trim();
        if (!value) out.department = '';
        else if (await Department.countDocuments({}) === 0) out.department = value;
        else {
            const match = await Department.findOne({ name: exact(value) }).lean();
            if (!match) throw new AppError(`Department "${value}" does not exist. Add it under Departments first.`, 400);
            if (match.status !== 'ACTIVE') throw new AppError(`Department "${match.name}" is inactive`, 400);
            out.department = match.name;
        }
    }
    if (designation !== undefined) {
        const value = String(designation || '').trim();
        if (!value) out.designation = '';
        else if (await Designation.countDocuments({}) === 0) out.designation = value;
        else {
            const match = await Designation.findOne({ title: exact(value) }).lean();
            if (!match) throw new AppError(`Designation "${value}" does not exist. Add it under Departments → Designations first.`, 400);
            if (match.status !== 'ACTIVE') throw new AppError(`Designation "${match.title}" is inactive`, 400);
            out.designation = match.title;
        }
    }
    return out;
};

// Teachers and staff of one department
const listMembers = async (id) => {
    assertObjectId(id, 'department ID');
    const department = await Department.findById(id).lean();
    if (!department) throw new AppError('Department not found', 404);
    const [teachers, staff] = await Promise.all([
        Teacher.find({ department: exact(department.name) }).select('teacherId firstName lastName designation assignedClass assignedSection email phone').populate('user', 'loginId isActive').lean(),
        StaffProfile.find({ department: exact(department.name) }).select('firstName lastName designation email phone').populate('user', 'loginId role isActive').lean(),
    ]);
    return {
        department,
        members: [
            ...teachers.map((t) => ({ _id: t._id, kind: 'TEACHER', name: `${t.firstName} ${t.lastName}`, designation: t.designation || '', detail: `Class ${t.assignedClass}-${t.assignedSection}`, loginId: t.user?.loginId, isActive: t.user?.isActive })),
            ...staff.map((s) => ({ _id: s._id, kind: s.user?.role || 'STAFF', name: `${s.firstName} ${s.lastName}`, designation: s.designation || '', detail: s.phone, loginId: s.user?.loginId, isActive: s.user?.isActive })),
        ].sort((a, b) => a.name.localeCompare(b.name)),
    };
};

module.exports = {
    listDepartments, createDepartment, updateDepartment, deleteDepartment, listMembers,
    listDesignations, createDesignation, updateDesignation, deleteDesignation,
    normaliseAssignment,
};

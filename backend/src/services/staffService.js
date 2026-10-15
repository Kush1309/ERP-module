const StaffProfile = require('../models/StaffProfile');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { STAFF_ROLES } = require('../constants/roles');
const { generateLoginId } = require('./loginIdService');
const { hashPassword } = require('../utils/password');
const { generateTempPassword } = require('./studentService');
const { runInTransaction } = require('../utils/transaction');
const { assertObjectId, pick, escapeRegex, getPagination, buildPagination } = require('../utils/queryHelpers');

const PROFILE_FIELDS = ['firstName', 'lastName', 'phone', 'email', 'department', 'designation', 'joiningDate'];

const populateUser = (query) => query.populate('user', 'loginId role isActive mustChangePassword lastLoginAt');

const createStaffAccount = async (data) => {
    if (!STAFF_ROLES.includes(data.role)) {
        throw new AppError(`Role must be one of: ${STAFF_ROLES.join(', ')}`, 400);
    }
    const profileData = pick(data, PROFILE_FIELDS);
    if (typeof profileData.email === 'string') profileData.email = profileData.email.trim() || null;

    // Validate before generating a login ID
    const probe = new StaffProfile(profileData);
    const validationError = probe.validateSync(undefined, { pathsToSkip: ['user'] });
    if (validationError) throw validationError;

    const loginId = await generateLoginId(data.role);
    const temporaryPassword = generateTempPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    const profile = await runInTransaction(async (session) => {
        const [user] = await User.create([{ loginId, password: hashedPassword, role: data.role, mustChangePassword: true, isActive: true }], { session });
        try {
            const [created] = await StaffProfile.create([{ ...profileData, user: user._id }], { session });
            return created;
        } catch (error) {
            if (!session) await User.deleteOne({ _id: user._id });
            throw error;
        }
    });

    const staff = await populateUser(StaffProfile.findById(profile._id)).lean();
    return { staff, credentials: { loginId, temporaryPassword } };
};

const listStaff = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const userFilter = { role: { $in: STAFF_ROLES } };
    if (query.role && STAFF_ROLES.includes(String(query.role))) userFilter.role = String(query.role);
    const userIds = await User.find(userFilter).distinct('_id');

    const filter = { user: { $in: userIds } };
    if (query.search) {
        const regex = { $regex: escapeRegex(query.search), $options: 'i' };
        filter.$or = [{ firstName: regex }, { lastName: regex }, { phone: regex }, { email: regex }, { department: regex }, { designation: regex }];
    }

    const [staff, total] = await Promise.all([
        populateUser(StaffProfile.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        StaffProfile.countDocuments(filter),
    ]);
    return { staff, pagination: buildPagination(page, limit, total) };
};

const updateStaff = async (id, data) => {
    assertObjectId(id, 'staff ID');
    const profile = await StaffProfile.findById(id);
    if (!profile) throw new AppError('Staff member not found', 404);
    const updates = pick(data, PROFILE_FIELDS);
    if (typeof updates.email === 'string') updates.email = updates.email.trim() || null;
    Object.assign(profile, updates);
    await profile.save();
    return populateUser(StaffProfile.findById(id)).lean();
};

const setStaffActive = async (id, isActive) => {
    assertObjectId(id, 'staff ID');
    const profile = await StaffProfile.findById(id).lean();
    if (!profile) throw new AppError('Staff member not found', 404);
    await User.updateOne({ _id: profile.user, role: { $in: STAFF_ROLES } }, { $set: { isActive } });
    return populateUser(StaffProfile.findById(id)).lean();
};

module.exports = { createStaffAccount, listStaff, updateStaff, setStaffActive };

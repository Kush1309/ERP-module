const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const ParentProfile = require('../models/ParentProfile');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Creates in-app notifications. Notification delivery must never break the
 * business operation that triggered it, so failures are logged, not thrown.
 */
const notifyUsers = async (userIds, { type = 'GENERAL', title, message = '', link = '' }) => {
    try {
        const unique = [...new Set((userIds || []).filter(Boolean).map(String))]
            .filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (!unique.length || !title) return 0;
        await Notification.insertMany(unique.map((recipient) => ({ recipient, type, title, message, link })), { ordered: false });
        return unique.length;
    } catch (error) {
        console.error('Notification delivery failed:', error.message);
        return 0;
    }
};

// User accounts of the given students plus their linked parents
const userIdsForStudents = async (studentIds, { includeParents = true } = {}) => {
    const ids = (studentIds || []).filter(Boolean);
    if (!ids.length) return [];
    const students = await Student.find({ _id: { $in: ids } }).select('user').lean();
    const userIds = students.map((s) => s.user);
    if (includeParents) {
        const parents = await ParentProfile.find({ students: { $in: ids } }).select('user').lean();
        userIds.push(...parents.map((p) => p.user));
    }
    return userIds;
};

const userIdsForClass = async (className, section, options) => {
    const filter = { class: className, status: 'ACTIVE' };
    if (section) filter.section = section;
    const students = await Student.find(filter).distinct('_id');
    return userIdsForStudents(students, options);
};

const userIdsForRoles = async (roles) => User.find({ role: { $in: roles }, isActive: true }).distinct('_id');

const listForUser = async (userId, query = {}) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const filter = { recipient: userId };
    if (query.unread === 'true') filter.isRead = false;
    if (query.type) filter.type = String(query.type).toUpperCase();

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return { notifications, unreadCount, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const markRead = async (userId, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid notification ID', 400);
    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipient: userId },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true }
    ).lean();
    if (!notification) throw new AppError('Notification not found', 404);
    return notification;
};

const markAllRead = async (userId) => {
    const result = await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
    return { updated: result.modifiedCount };
};

module.exports = {
    notifyUsers,
    userIdsForStudents,
    userIdsForClass,
    userIdsForRoles,
    listForUser,
    markRead,
    markAllRead,
};

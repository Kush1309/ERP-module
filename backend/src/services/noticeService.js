const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const AppError = require('../utils/AppError');

const createNotice = async (data, userId) => {
    const { title, content, category, priority, audience, targetClass, targetSection, expiresAt } = data;

    const newNotice = new Notice({
        title,
        content,
        category,
        priority,
        audience,
        targetClass,
        targetSection,
        expiresAt,
        createdBy: userId,
        status: 'DRAFT'
    });

    await newNotice.save();
    return newNotice;
};

const getNotices = async (queryOpts) => {
    let { page = 1, limit = 10, search, status, category, priority, audience } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const match = {};
    if (search) {
        const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        match.$or = [
            { title: { $regex: safeSearch, $options: 'i' } },
            { content: { $regex: safeSearch, $options: 'i' } }
        ];
    }

    if (status) match.status = String(status).toUpperCase();
    if (category) match.category = String(category).toUpperCase();
    if (priority) match.priority = String(priority).toUpperCase();
    if (audience) match.audience = String(audience).toUpperCase();

    const [notices, total] = await Promise.all([
        Notice.find(match)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('createdBy', 'firstName lastName email')
            .lean(),
        Notice.countDocuments(match)
    ]);

    return {
        notices,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getNoticeById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Notice ID', 400);
    const notice = await Notice.findById(id).populate('createdBy', 'firstName lastName email').lean();
    if (!notice) throw new AppError('Notice not found', 404);
    return notice;
};

const updateNotice = async (id, data) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Notice ID', 400);
    const notice = await Notice.findById(id);
    if (!notice) throw new AppError('Notice not found', 404);

    const { title, content, category, priority, audience, targetClass, targetSection, expiresAt, status, publishedAt } = data;

    if (title !== undefined) notice.title = title;
    if (content !== undefined) notice.content = content;
    if (category !== undefined) notice.category = category;
    if (priority !== undefined) notice.priority = priority;
    if (audience !== undefined) notice.audience = audience;
    if (targetClass !== undefined) notice.targetClass = targetClass;
    if (targetSection !== undefined) notice.targetSection = targetSection;
    if (expiresAt !== undefined) notice.expiresAt = expiresAt;

    if (status !== undefined) notice.status = status;
    if (publishedAt !== undefined) notice.publishedAt = publishedAt;

    await notice.save();
    return notice;
};

const deleteNotice = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Notice ID', 400);
    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) throw new AppError('Notice not found or already deleted', 404);
    return deleted;
};

const publishNotice = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Notice ID', 400);
    const notice = await Notice.findById(id);
    if (!notice) throw new AppError('Notice not found', 404);

    notice.status = 'PUBLISHED';
    notice.publishedAt = new Date();
    await notice.save();
    return notice;
};

const archiveNotice = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Notice ID', 400);
    const notice = await Notice.findById(id);
    if (!notice) throw new AppError('Notice not found', 404);

    notice.status = 'ARCHIVED';
    await notice.save();
    return notice;
};

module.exports = {
    createNotice,
    getNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,
    publishNotice,
    archiveNotice
};

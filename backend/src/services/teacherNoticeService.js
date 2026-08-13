const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const AppError = require('../utils/AppError');

const getTeacherNotices = async (queryOpts) => {
    let { page = 1, limit = 10, search, category, priority } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const match = {
        status: 'PUBLISHED',
        audience: { $in: ['ALL', 'TEACHERS'] },
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    };

    if (search) {
        const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        match.$and = match.$and || [];
        match.$and.push({
            $or: [
                { title: { $regex: safeSearch, $options: 'i' } },
                { content: { $regex: safeSearch, $options: 'i' } }
            ]
        });
    }

    if (category) match.category = String(category).toUpperCase();
    if (priority) match.priority = String(priority).toUpperCase();

    const [notices, total] = await Promise.all([
        Notice.find(match)
            .sort({ publishedAt: -1 })
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

const getTeacherNoticeById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Notice ID', 400);

    const notice = await Notice.findOne({
        _id: id,
        status: 'PUBLISHED',
        audience: { $in: ['ALL', 'TEACHERS'] },
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    }).populate('createdBy', 'firstName lastName email').lean();

    if (!notice) throw new AppError('Notice not found or no longer available', 404);

    return notice;
};

module.exports = {
    getTeacherNotices,
    getTeacherNoticeById
};

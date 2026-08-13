const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const Student = require('../models/Student');
const AppError = require('../utils/AppError');

const getStudentNotices = async (userId, queryOpts) => {
    let { page = 1, limit = 10, search, category, priority } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const student = await Student.findOne({ user: userId });
    if (!student) throw new AppError('Student profile not found', 404);

    const match = {
        status: 'PUBLISHED',
        $and: [
            {
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]
            },
            {
                $or: [
                    { audience: { $in: ['ALL', 'STUDENTS'] } },
                    { audience: 'SPECIFIC_CLASS', targetClass: student.class },
                    { audience: 'SPECIFIC_SECTION', targetClass: student.class, targetSection: student.section }
                ]
            }
        ]
    };

    if (search) {
        const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

const getStudentNoticeById = async (userId, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Notice ID', 400);

    const student = await Student.findOne({ user: userId });
    if (!student) throw new AppError('Student profile not found', 404);

    const notice = await Notice.findOne({
        _id: id,
        status: 'PUBLISHED',
        $and: [
            {
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]
            },
            {
                $or: [
                    { audience: { $in: ['ALL', 'STUDENTS'] } },
                    { audience: 'SPECIFIC_CLASS', targetClass: student.class },
                    { audience: 'SPECIFIC_SECTION', targetClass: student.class, targetSection: student.section }
                ]
            }
        ]
    }).populate('createdBy', 'firstName lastName email').lean();

    if (!notice) throw new AppError('Notice not found or no longer available', 404);

    return notice;
};

module.exports = {
    getStudentNotices,
    getStudentNoticeById
};

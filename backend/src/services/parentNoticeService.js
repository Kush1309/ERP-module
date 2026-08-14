const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const parentService = require('./parentService');
const AppError = require('../utils/AppError');

const buildParentNoticeVisibilityFilter = (students) => {
    if (!students || students.length === 0) {
        return null; // Signals empty results gracefully safely seamlessly natively explicitly
    }

    const classList = [];
    const sectionConditions = [];

    students.forEach((s) => {
        if (s.class) classList.push(s.class);
        if (s.class && s.section) {
            sectionConditions.push({
                audience: 'SPECIFIC_SECTION',
                targetClass: s.class,
                targetSection: s.section
            });
        }
    });

    const uniqueClasses = [...new Set(classList)];

    const audienceOr = [
        { audience: 'ALL' },
        { audience: 'STUDENTS' }
    ];

    if (uniqueClasses.length > 0) {
        audienceOr.push({ audience: 'SPECIFIC_CLASS', targetClass: { $in: uniqueClasses } });
    }

    if (sectionConditions.length > 0) {
        audienceOr.push(...sectionConditions);
    }

    const filter = {
        status: 'PUBLISHED',
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ],
        $and: [
            { $or: audienceOr }
        ]
    };

    return filter;
}

const getParentNotices = async (parentUserId, query = {}) => {
    const students = await parentService.getLinkedStudents(parentUserId);
    const filter = buildParentNoticeVisibilityFilter(students);

    if (!filter) return []; // Empty natively

    if (query.search) {
        const sanitizedName = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.title = { $regex: sanitizedName, $options: 'i' };
    }

    if (query.category) {
        filter.category = query.category;
    }

    const notices = await Notice.find(filter)
        .sort({ publishedAt: -1 })
        .select('-__v -updatedAt -createdBy')
        .lean();

    return notices;
};

const getParentNoticeById = async (parentUserId, noticeId) => {
    if (!mongoose.Types.ObjectId.isValid(noticeId)) {
        throw new AppError('Invalid Notice ID format', 400);
    }

    const students = await parentService.getLinkedStudents(parentUserId);
    const filter = buildParentNoticeVisibilityFilter(students);

    if (!filter) {
        throw new AppError('Notice explicitly securely unavailable', 404);
    }

    filter._id = noticeId;

    const notice = await Notice.findOne(filter)
        .select('-__v -updatedAt -createdBy')
        .lean();

    if (!notice) {
        throw new AppError('Notice explicitly natively definitively unavailable correctly securely', 404);
    }

    return notice;
};

module.exports = {
    getParentNotices,
    getParentNoticeById,
};

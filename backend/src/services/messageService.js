const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const ParentProfile = require('../models/ParentProfile');
const StaffProfile = require('../models/StaffProfile');
const AppError = require('../utils/AppError');

const { isValidObjectId } = mongoose;

const validateObjectId = (id, message = 'Invalid ObjectId provided') => {
    if (!id || !isValidObjectId(id)) {
        throw new AppError(message, 400);
    }
};

/**
 * Users do not carry names themselves (names live on Student/Teacher/Parent
 * profiles), so build a display map for a set of user ids.
 */
const buildUserDirectory = async (userIds) => {
    const ids = [...new Set((userIds || []).map(String))].filter(isValidObjectId);
    if (ids.length === 0) return new Map();

    const [users, students, teachers, parents, staffProfiles] = await Promise.all([
        User.find({ _id: { $in: ids } }).select('loginId role isActive').lean(),
        Student.find({ user: { $in: ids } }).select('user firstName lastName class section').lean(),
        Teacher.find({ user: { $in: ids } }).select('user firstName lastName assignedClass assignedSection').lean(),
        ParentProfile.find({ user: { $in: ids } }).select('user firstName lastName').lean(),
        StaffProfile.find({ user: { $in: ids } }).select('user firstName lastName designation').lean(),
    ]);

    const profileByUser = new Map();
    students.forEach((p) => profileByUser.set(String(p.user), {
        name: `${p.firstName} ${p.lastName}`.trim(),
        detail: `Student · Class ${p.class}-${p.section}`,
    }));
    teachers.forEach((p) => profileByUser.set(String(p.user), {
        name: `${p.firstName} ${p.lastName}`.trim(),
        detail: `Teacher · Class ${p.assignedClass}-${p.assignedSection}`,
    }));
    parents.forEach((p) => profileByUser.set(String(p.user), {
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        detail: 'Parent',
    }));
    staffProfiles.forEach((p) => profileByUser.set(String(p.user), {
        name: `${p.firstName} ${p.lastName}`.trim(),
        detail: p.designation || 'Staff',
    }));

    const directory = new Map();
    users.forEach((u) => {
        const profile = profileByUser.get(String(u._id)) || {};
        const fallbackName = u.role === 'ADMIN' ? 'Administrator' : u.loginId;
        directory.set(String(u._id), {
            _id: u._id,
            loginId: u.loginId,
            role: u.role,
            name: profile.name || fallbackName,
            detail: profile.detail || (u.role === 'ADMIN' ? 'School Administration' : u.role),
        });
    });

    return directory;
};

const decorateParticipants = (conversation, directory) => ({
    ...conversation,
    participants: (conversation.participants || []).map((p) => {
        const id = String(p?._id || p);
        return directory.get(id) || { _id: id, name: 'Unknown user', role: null, loginId: null };
    }),
});

/**
 * Lists the people the current user is allowed to start a conversation with,
 * mirroring the rules enforced by canCommunicate().
 */
const getContacts = async (userId, query = {}) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    const me = await User.findById(userId).select('role').lean();
    if (!me) throw new AppError('Authenticated user not found', 404);

    const search = query.search ? String(query.search).trim().toLowerCase() : '';
    const candidateUserIds = new Set();

    const addUsers = (list) => list.forEach((id) => id && candidateUserIds.add(String(id)));

    const admins = await User.find({ role: 'ADMIN', isActive: true }).distinct('_id');
    addUsers(admins);

    if (me.role === 'ADMIN') {
        const others = await User.find({ role: { $in: ['TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN'] }, isActive: true }).distinct('_id');
        addUsers(others);
    } else if (me.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: userId }).lean();
        if (teacher) {
            const classStudents = await Student.find({ class: teacher.assignedClass, section: teacher.assignedSection }).select('_id user').lean();
            addUsers(classStudents.map((s) => s.user));
            const parentUsers = await ParentProfile.find({ students: { $in: classStudents.map((s) => s._id) } }).distinct('user');
            addUsers(parentUsers);
        }
    } else if (me.role === 'STUDENT') {
        const student = await Student.findOne({ user: userId }).lean();
        if (student) {
            const teachers = await Teacher.find({ assignedClass: student.class, assignedSection: student.section }).distinct('user');
            addUsers(teachers);
        }
    } else if (me.role === 'PARENT') {
        const parent = await ParentProfile.findOne({ user: userId }).lean();
        if (parent && parent.students?.length) {
            const children = await Student.find({ _id: { $in: parent.students } }).select('class section').lean();
            if (children.length) {
                const teachers = await Teacher.find({
                    $or: children.map((c) => ({ assignedClass: c.class, assignedSection: c.section })),
                }).distinct('user');
                addUsers(teachers);
            }
        }
    }

    candidateUserIds.delete(String(userId));

    // Only active accounts can be contacted
    const activeIds = await User.find({ _id: { $in: [...candidateUserIds] }, isActive: true }).distinct('_id');
    const directory = await buildUserDirectory(activeIds);

    let contacts = [...directory.values()];
    if (search) {
        contacts = contacts.filter((c) =>
            c.name.toLowerCase().includes(search) || (c.loginId || '').toLowerCase().includes(search)
        );
    }

    const roleOrder = { ADMIN: 0, TEACHER: 1, ACCOUNTANT: 2, LIBRARIAN: 2, PARENT: 3, STUDENT: 4 };
    contacts.sort((a, b) => (roleOrder[a.role] - roleOrder[b.role]) || a.name.localeCompare(b.name));

    return contacts.slice(0, 200);
};

const extractUserRoleIdsSafe = (participants) => {
    if (!participants || !Array.isArray(participants)) throw new AppError('Invalid participants payload', 400);
    return [...new Set(participants.map(String))];
}

const canCommunicate = async (senderId, recipientId) => {
    if (senderId.toString() === recipientId.toString()) return false;
    const sender = await User.findById(senderId).select('role').lean();
    const recipient = await User.findById(recipientId).select('role').lean();

    if (!sender || !recipient) return false;

    if (sender.role === 'ADMIN' || recipient.role === 'ADMIN') return true;

    if (sender.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: senderId }).lean();
        if (!teacher) return false;

        if (recipient.role === 'STUDENT') {
            const student = await Student.findOne({ user: recipientId }).lean();
            if (!student) return false;
            return student.class === teacher.assignedClass && student.section === teacher.assignedSection;
        }
        if (recipient.role === 'PARENT') {
            const parent = await ParentProfile.findOne({ user: recipientId }).lean();
            if (!parent || !parent.students || parent.students.length === 0) return false;
            const students = await Student.find({ _id: { $in: parent.students } }).lean();
            return students.some(s => s.class === teacher.assignedClass && s.section === teacher.assignedSection);
        }
    }

    if (sender.role === 'PARENT') {
        if (recipient.role === 'TEACHER') {
            const parent = await ParentProfile.findOne({ user: senderId }).lean();
            if (!parent || !parent.students || parent.students.length === 0) return false;
            const students = await Student.find({ _id: { $in: parent.students } }).lean();
            const teacher = await Teacher.findOne({ user: recipientId }).lean();
            if (!teacher) return false;
            return students.some(s => s.class === teacher.assignedClass && s.section === teacher.assignedSection);
        }
    }

    if (sender.role === 'STUDENT') {
        if (recipient.role === 'TEACHER') {
            const student = await Student.findOne({ user: senderId }).lean();
            const teacher = await Teacher.findOne({ user: recipientId }).lean();
            if (!student || !teacher) return false;
            return student.class === teacher.assignedClass && student.section === teacher.assignedSection;
        }
    }

    return false;
};

const createConversation = async (userId, participantIds) => {
    validateObjectId(userId, 'Invalid authenticating user ID');

    const uniqueIds = extractUserRoleIdsSafe(participantIds);
    if (!uniqueIds.includes(userId.toString())) {
        uniqueIds.push(userId.toString());
    }

    if (uniqueIds.length < 2) {
        throw new AppError('A conversation must have at least one other participant', 400);
    }

    // Explicit RBAC verification from creator to all targets safely
    for (const pid of uniqueIds) {
        validateObjectId(pid, `Invalid specific participant ID: ${pid}`);
        if (pid !== userId.toString()) {
            const allowed = await canCommunicate(userId, pid);
            if (!allowed) {
                throw new AppError(`Not authorized to initiate communication with user ${pid}`, 403);
            }
        }
    }

    // Exact match for 2-participant duplicate check
    if (uniqueIds.length === 2) {
        const existing = await Conversation.findOne({
            participants: { $all: uniqueIds, $size: 2 }
        });
        if (existing) {
            return existing;
        }
    }

    const conversation = await Conversation.create({ participants: uniqueIds });
    return conversation;
};

const getConversations = async (userId, query) => {
    validateObjectId(userId, 'Invalid authenticating user ID');

    const page = Math.max(1, parseInt(query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query?.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const dbQuery = { participants: { $in: [userId] } };

    const total = await Conversation.countDocuments(dbQuery);
    const conversations = await Conversation.find(dbQuery)
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: 'lastMessage',
            select: 'content sender createdAt readBy'
        })
        .lean();

    const directory = await buildUserDirectory(conversations.flatMap((c) => c.participants));

    return {
        data: conversations.map((c) => decorateParticipants(c, directory)),
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
};

const getConversationById = async (userId, conversationId) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(conversationId, 'Invalid conversation ID');

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] }
    }).lean();

    if (!conversation) {
        throw new AppError('Conversation not found', 404);
    }

    const messages = await Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .lean();

    const directory = await buildUserDirectory(conversation.participants);
    const decorated = decorateParticipants(conversation, directory);
    decorated.messages = messages;
    return decorated;
};

const sendMessage = async (userId, conversationId, content) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(conversationId, 'Invalid conversation ID');

    if (!content || typeof content !== 'string') {
        throw new AppError('Message content must be text', 400);
    }
    const safeContent = content.trim();
    if (safeContent.length === 0 || safeContent.length > 2000) {
        throw new AppError('Message must be between 1 and 2000 characters', 400);
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] }
    });

    if (!conversation) {
        throw new AppError('Conversation not found', 404);
    }

    const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        content: safeContent,
        readBy: [userId]
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    // Explicitly do not return internal tokens/secrets, populate sender safely if needed.
    return message;
};

const markMessageRead = async (userId, messageId) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(messageId, 'Invalid message ID');

    const message = await Message.findById(messageId);
    if (!message) {
        throw new AppError('Message not found', 404);
    }

    const conversation = await Conversation.findOne({
        _id: message.conversation,
        participants: { $in: [userId] }
    });
    if (!conversation) {
        throw new AppError('Message not found', 404); // uniform error handling
    }

    if (!message.readBy.some(id => id.toString() === userId.toString())) {
        message.readBy.push(userId);
        await message.save();
    }
    return message;
};

module.exports = {
    getContacts,
    createConversation,
    getConversations,
    getConversationById,
    sendMessage,
    markMessageRead
};

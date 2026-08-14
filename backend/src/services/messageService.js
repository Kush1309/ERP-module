const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const ParentProfile = require('../models/ParentProfile');
const AppError = require('../utils/AppError');

const { isValidObjectId } = mongoose;

const validateObjectId = (id, message = 'Invalid ObjectId provided') => {
    if (!id || !isValidObjectId(id)) {
        throw new AppError(message, 400);
    }
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
        .populate('participants', 'firstName lastName email role')
        .populate({
            path: 'lastMessage',
            select: 'content sender createdAt readBy'
        })
        .lean();

    return {
        data: conversations,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
};

const getConversationById = async (userId, conversationId) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(conversationId, 'Invalid conversation ID');

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] }
    })
        .populate('participants', 'firstName lastName email role')
        .lean();

    if (!conversation) {
        throw new AppError('Conversation not found', 404);
    }

    const messages = await Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .lean();

    conversation.messages = messages;
    return conversation;
};

const sendMessage = async (userId, conversationId, content) => {
    validateObjectId(userId, 'Invalid authenticating user ID');
    validateObjectId(conversationId, 'Invalid conversation ID');

    if (!content || typeof content !== 'string') {
        throw new AppError('Message content must be structured text', 400);
    }
    const safeContent = content.trim();
    if (safeContent.length === 0 || safeContent.length > 2000) {
        throw new AppError('Message size invalid', 400);
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
    createConversation,
    getConversations,
    getConversationById,
    sendMessage,
    markMessageRead
};

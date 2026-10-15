const mongoose = require('mongoose');
const Event = require('../models/Event');
const AppError = require('../utils/AppError');
const User = require('../models/User');

// Non-admins only see announced events meant for their audience
const AUDIENCE_BY_ROLE = { TEACHER: ['ALL', 'TEACHERS'], STUDENT: ['ALL', 'STUDENTS'], PARENT: ['ALL', 'PARENTS', 'STUDENTS'], ACCOUNTANT: ['ALL'], LIBRARIAN: ['ALL'] };
const visibilityFilterFor = async (userId) => {
  const user = userId ? await User.findById(userId).select('role').lean() : null;
  if (!user || user.role === 'ADMIN') return {};
  return { status: { $in: ['PUBLISHED', 'COMPLETED', 'CANCELLED'] }, targetAudience: { $in: AUDIENCE_BY_ROLE[user.role] || ['ALL'] } };
};

// Helper to validate MongoDB ObjectId
const validateObjectId = (id, message = 'Invalid ObjectId') => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400);
  }
};

// Escape user input for regex to prevent ReDoS and injection
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whitelisted fields for creation and updates
const CREATE_WHITELIST = [
  'title',
  'description',
  'eventDate',
  'startTime',
  'endTime',
  'location',
  'eventType',
  'targetAudience',
  'applicableClasses',
  'section',
  'status'
];

const UPDATE_WHITELIST = [
  'title',
  'description',
  'eventDate',
  'startTime',
  'endTime',
  'location',
  'eventType',
  'targetAudience',
  'applicableClasses',
  'section',
  'status'
];

// Enum definitions (mirroring Event model)
const EVENT_TYPES = [
  'ACADEMIC', 'SPORTS', 'CULTURAL', 'MEETING', 'HOLIDAY', 'EXAMINATION', 'WORKSHOP', 'OTHER'
];
const TARGET_AUDIENCES = ['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS'];
const EVENT_STATUSES = ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'];

const validateEnum = (value, allowed, fieldName) => {
  if (!allowed.includes(value)) {
    throw new AppError(`${fieldName} '${value}' is not a valid option`, 400);
  }
};

const validateTime = (time, fieldName) => {
  if (time === undefined || time === null || time === '') return;
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    throw new AppError(`${fieldName} must be in HH:MM (24‑hour) format`, 400);
  }
};

/** Create a new Event. */
const createEvent = async (userId, rawData) => {
  validateObjectId(userId, 'Invalid authenticating user ID');

  const payload = {};
  CREATE_WHITELIST.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(rawData, key)) {
      payload[key] = rawData[key];
    }
  });

  // Required fields
  ['title', 'eventDate', 'eventType', 'targetAudience'].forEach((field) => {
    if (!payload[field]) {
      throw new AppError(`${field} is required`, 400);
    }
  });

  // Trim strings
  if (payload.title) payload.title = String(payload.title).trim();
  if (payload.description) payload.description = String(payload.description).trim();
  if (payload.location) payload.location = String(payload.location).trim();

  // Enums
  payload.eventType = String(payload.eventType).toUpperCase();
  validateEnum(payload.eventType, EVENT_TYPES, 'eventType');

  payload.targetAudience = String(payload.targetAudience).toUpperCase();
  validateEnum(payload.targetAudience, TARGET_AUDIENCES, 'targetAudience');

  if (payload.status) {
    payload.status = String(payload.status).toUpperCase();
    validateEnum(payload.status, EVENT_STATUSES, 'status');
  }

  // Date validation
  const eventDate = new Date(payload.eventDate);
  if (isNaN(eventDate)) {
    throw new AppError('eventDate must be a valid date', 400);
  }
  payload.eventDate = eventDate;

  // Time validation (optional)
  validateTime(payload.startTime, 'startTime');
  validateTime(payload.endTime, 'endTime');

  // applicableClasses array handling
  if (payload.applicableClasses) {
    if (!Array.isArray(payload.applicableClasses)) {
      throw new AppError('applicableClasses must be an array', 400);
    }
    payload.applicableClasses = payload.applicableClasses.map((c) => String(c).trim());
  }

  // Set creator from auth context, never trust client input
  payload.createdBy = userId;

  const event = await Event.create(payload);
  return event;
};

/** List events with safe filtering, pagination and optional search. */
const getEvents = async (userId, queryOpts = {}) => {
  if (userId) validateObjectId(userId, 'Invalid authenticating user ID');

  let { page = 1, limit = 10, search, status, eventType, startDate, endDate, targetAudience, class: className, section } = queryOpts;

  page = Math.max(parseInt(page, 10) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const filter = {};

  if (status) {
    const val = String(status).toUpperCase();
    validateEnum(val, EVENT_STATUSES, 'status');
    filter.status = val;
  }
  const visibility = await visibilityFilterFor(userId);
  if (eventType) {
    const val = String(eventType).toUpperCase();
    validateEnum(val, EVENT_TYPES, 'eventType');
    filter.eventType = val;
  }
  if (targetAudience) {
    const val = String(targetAudience).toUpperCase();
    validateEnum(val, TARGET_AUDIENCES, 'targetAudience');
    filter.targetAudience = val;
  }
  if (className) filter.class = String(className).trim();
  if (section) filter.section = String(section).trim();

  if (startDate || endDate) {
    filter.eventDate = {};
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start)) throw new AppError('Invalid startDate', 400);
      filter.eventDate.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end)) throw new AppError('Invalid endDate', 400);
      filter.eventDate.$lte = end;
    }
    if (Object.keys(filter.eventDate).length === 0) delete filter.eventDate;
  }

  if (search) {
    const safe = escapeRegex(search);
    const regex = { $regex: safe, $options: 'i' };
    filter.$or = [{ title: regex }, { location: regex }];
  }

  // Apply role visibility on top of the user's own filters
  if (visibility.status) filter.$and = [{ status: visibility.status }, { targetAudience: visibility.targetAudience }];

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ eventDate: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Event.countDocuments(filter)
  ]);

  return { events, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

/** Retrieve a single event by ID. */
const getEventById = async (userId, id) => {
  if (userId) validateObjectId(userId, 'Invalid authenticating user ID');
  validateObjectId(id, 'Invalid event ID');

  const visibility = await visibilityFilterFor(userId);
  const event = await Event.findOne({ _id: id, ...visibility }).lean();
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  return event;
};

/** Update an event – only whitelisted fields. */
const updateEvent = async (userId, id, rawData) => {
  validateObjectId(userId, 'Invalid authenticating user ID');
  validateObjectId(id, 'Invalid event ID');

  const updatePayload = {};
  UPDATE_WHITELIST.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(rawData, key)) {
      updatePayload[key] = rawData[key];
    }
  });

  if (Object.keys(updatePayload).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  // Apply same validation as creation where relevant
  if (updatePayload.title) updatePayload.title = String(updatePayload.title).trim();
  if (updatePayload.description) updatePayload.description = String(updatePayload.description).trim();
  if (updatePayload.location) updatePayload.location = String(updatePayload.location).trim();

  if (updatePayload.eventType) {
    updatePayload.eventType = String(updatePayload.eventType).toUpperCase();
    validateEnum(updatePayload.eventType, EVENT_TYPES, 'eventType');
  }
  if (updatePayload.targetAudience) {
    updatePayload.targetAudience = String(updatePayload.targetAudience).toUpperCase();
    validateEnum(updatePayload.targetAudience, TARGET_AUDIENCES, 'targetAudience');
  }
  if (updatePayload.status) {
    updatePayload.status = String(updatePayload.status).toUpperCase();
    validateEnum(updatePayload.status, EVENT_STATUSES, 'status');
  }

  if (updatePayload.eventDate) {
    const d = new Date(updatePayload.eventDate);
    if (isNaN(d)) throw new AppError('eventDate must be a valid date', 400);
    updatePayload.eventDate = d;
  }

  validateTime(updatePayload.startTime, 'startTime');
  validateTime(updatePayload.endTime, 'endTime');

  if (updatePayload.applicableClasses) {
    if (!Array.isArray(updatePayload.applicableClasses)) {
      throw new AppError('applicableClasses must be an array', 400);
    }
    updatePayload.applicableClasses = updatePayload.applicableClasses.map((c) => String(c).trim());
  }

  const updated = await Event.findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true }).lean();
  if (!updated) {
    throw new AppError('Event not found', 404);
  }
  return updated;
};

/** Delete an event. */
const deleteEvent = async (userId, id) => {
  validateObjectId(userId, 'Invalid authenticating user ID');
  validateObjectId(id, 'Invalid event ID');

  const existing = await Event.findById(id).lean();
  if (!existing) {
    throw new AppError('Event not found', 404);
  }

  await Event.findByIdAndDelete(id);
  return { success: true, message: 'Event deleted successfully' };
};

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent };

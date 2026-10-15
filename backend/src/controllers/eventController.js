const asyncHandler = require('../utils/asyncHandler');
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../services/eventService');

// @desc    Create a new Event
// @route   POST /events
// @access  ADMIN
const createEventController = asyncHandler(async (req, res) => {
  const userId = req.user.id; // authenticated user id
  const event = await createEvent(userId, req.body);
  res.status(201).json({ success: true, data: event });
});

// @desc    Get list of Events (with pagination & filters)
// @route   GET /events
// @access  Authenticated (all roles)
const getEventsController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await getEvents(userId, req.query);
  res.status(200).json({ success: true, data: result });
});

// @desc    Get single Event by ID
// @route   GET /events/:id
// @access  Authenticated (all roles)
const getEventByIdController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const event = await getEventById(userId, req.params.id);
  res.status(200).json({ success: true, data: event });
});

// @desc    Update an Event
// @route   PUT /events/:id
// @access  ADMIN
const updateEventController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updated = await updateEvent(userId, req.params.id, req.body);
  res.status(200).json({ success: true, data: updated });
});

// @desc    Delete an Event
// @route   DELETE /events/:id
// @access  ADMIN
const deleteEventController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await deleteEvent(userId, req.params.id);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  createEvent: createEventController,
  getEvents: getEventsController,
  getEventById: getEventByIdController,
  updateEvent: updateEventController,
  deleteEvent: deleteEventController,
};

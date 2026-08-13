const timetableService = require('../services/timetableService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createTimetable = asyncHandler(async (req, res) => {
    // Avoid providing complex db logic in controllers, simply pass to service.
    const result = await timetableService.createTimetable(req.body);

    res.status(201).json({
        success: true,
        message: 'Timetable entry created successfully',
        data: result
    });
});

const getTimetables = asyncHandler(async (req, res) => {
    const result = await timetableService.getTimetables(req.query);

    res.status(200).json({
        success: true,
        data: result
    });
});

const getTimetableById = asyncHandler(async (req, res) => {
    const result = await timetableService.getTimetableById(req.params.id);

    res.status(200).json({
        success: true,
        data: result
    });
});

const updateTimetable = asyncHandler(async (req, res) => {
    const result = await timetableService.updateTimetable(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Timetable entry updated successfully',
        data: result
    });
});

const deleteTimetable = asyncHandler(async (req, res) => {
    await timetableService.deleteTimetable(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Timetable entry deleted successfully'
    });
});

module.exports = {
    createTimetable,
    getTimetables,
    getTimetableById,
    updateTimetable,
    deleteTimetable
};

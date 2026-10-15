const asyncHandler = require('../utils/asyncHandler');
const parentAdminService = require('../services/parentAdminService');

const pickParentFields = (body = {}) => ({
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
    email: body.email,
    studentIds: body.studentIds,
});

const createParent = asyncHandler(async (req, res) => {
    const { parent, credentials } = await parentAdminService.createParentAccount(pickParentFields(req.body));
    res.status(201).json({
        success: true,
        message: 'Parent account created successfully',
        data: { parent, credentials },
    });
});

const getParents = asyncHandler(async (req, res) => {
    const result = await parentAdminService.getParentsList({
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        studentId: req.query.studentId,
    });
    res.status(200).json({ success: true, data: result });
});

const getParentById = asyncHandler(async (req, res) => {
    const parent = await parentAdminService.getParentById(req.params.id);
    res.status(200).json({ success: true, data: { parent } });
});

const updateParent = asyncHandler(async (req, res) => {
    const body = pickParentFields(req.body);
    Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
    const parent = await parentAdminService.updateParent(req.params.id, body);
    res.status(200).json({ success: true, message: 'Parent updated successfully', data: { parent } });
});

const activateParent = asyncHandler(async (req, res) => {
    const parent = await parentAdminService.setParentActive(req.params.id, true);
    res.status(200).json({ success: true, message: 'Parent activated successfully', data: { parent } });
});

const deactivateParent = asyncHandler(async (req, res) => {
    const parent = await parentAdminService.setParentActive(req.params.id, false);
    res.status(200).json({ success: true, message: 'Parent deactivated successfully', data: { parent } });
});

module.exports = {
    createParent,
    getParents,
    getParentById,
    updateParent,
    activateParent,
    deactivateParent,
};

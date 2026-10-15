const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/admissionService');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();
router.use(authenticateUser, authorizeRoles(ROLES.ADMIN));

const send = (res, data, status = 200, message) => res.status(status).json({ success: true, ...(message && { message }), data });

router.get('/enquiries', asyncHandler(async (req, res) => send(res, await service.listEnquiries(req.query))));
router.post('/enquiries', asyncHandler(async (req, res) => send(res, await service.createEnquiry(req.body), 201, 'Enquiry recorded')));
router.put('/enquiries/:id', asyncHandler(async (req, res) => send(res, await service.updateEnquiry(req.params.id, req.body), 200, 'Enquiry updated')));
router.post('/enquiries/:id/follow-ups', asyncHandler(async (req, res) => send(res, await service.addFollowUp(req.params.id, req.user._id, req.body), 201, 'Follow-up added')));
router.delete('/enquiries/:id', asyncHandler(async (req, res) => send(res, await service.deleteEnquiry(req.params.id), 200, 'Enquiry deleted')));

router.get('/applications', asyncHandler(async (req, res) => send(res, await service.listApplications(req.query))));
router.post('/applications', asyncHandler(async (req, res) => send(res, await service.createApplication(req.body), 201, 'Application created')));
router.get('/applications/:id', asyncHandler(async (req, res) => send(res, await service.getApplication(req.params.id))));
router.put('/applications/:id', asyncHandler(async (req, res) => send(res, await service.updateApplication(req.params.id, req.body), 200, 'Application updated')));
router.patch('/applications/:id/documents/:docId', asyncHandler(async (req, res) => send(res, await service.setDocumentVerified(req.params.id, req.params.docId, req.body.verified === true, req.user._id))));
router.patch('/applications/:id/status', asyncHandler(async (req, res) => send(res, await service.changeStatus(req.params.id, String(req.body.status || '').toUpperCase(), req.body.note, req.user._id), 200, 'Status updated')));
router.post('/applications/:id/enroll', asyncHandler(async (req, res) => send(res, await service.enrollApplication(req.params.id, req.body), 201, 'Student enrolled')));

module.exports = router;

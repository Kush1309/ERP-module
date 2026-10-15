const Enquiry = require('../models/Enquiry');
const AdmissionApplication = require('../models/AdmissionApplication');
const Counter = require('../models/Counter');
const Student = require('../models/Student');
const AppError = require('../utils/AppError');
const studentService = require('./studentService');
const { assertObjectId, pick, escapeRegex, getPagination, buildPagination, getSort } = require('../utils/queryHelpers');

const ENQUIRY_FIELDS = ['studentName', 'parentName', 'phone', 'email', 'classApplied', 'source', 'status', 'notes', 'nextFollowUpDate'];
const APPLICATION_FIELDS = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'classApplied', 'guardianName', 'phone', 'email', 'address', 'city', 'state', 'postalCode', 'previousSchool'];

// Allowed manual status transitions (ENROLLED is only reached through enroll())
const TRANSITIONS = {
    PENDING: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED', 'PENDING'],
    APPROVED: ['UNDER_REVIEW', 'REJECTED'],
    REJECTED: ['UNDER_REVIEW'],
    ENROLLED: [],
};

// ---------------- Enquiries ----------------
const listEnquiries = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const filter = {};
    if (query.status) filter.status = String(query.status).toUpperCase();
    if (query.classApplied) filter.classApplied = String(query.classApplied);
    if (query.search) {
        const regex = { $regex: escapeRegex(query.search), $options: 'i' };
        filter.$or = [{ studentName: regex }, { parentName: regex }, { phone: regex }, { email: regex }];
    }
    if (query.followUpDue === 'true') {
        const endOfToday = new Date();
        endOfToday.setUTCHours(23, 59, 59, 999);
        filter.nextFollowUpDate = { $ne: null, $lte: endOfToday };
        filter.status = { $in: ['NEW', 'CONTACTED', 'FOLLOW_UP'] };
    }
    const sort = getSort(query.sort, ['createdAt', 'studentName', 'nextFollowUpDate', 'status'], { createdAt: -1 });
    const [enquiries, total] = await Promise.all([
        Enquiry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Enquiry.countDocuments(filter),
    ]);
    return { enquiries, pagination: buildPagination(page, limit, total) };
};

const createEnquiry = async (data) => (await Enquiry.create(pick(data, ENQUIRY_FIELDS))).toObject();

const updateEnquiry = async (id, data) => {
    assertObjectId(id, 'enquiry ID');
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    const updates = pick(data, ENQUIRY_FIELDS);
    if (updates.status === 'APPLIED' && !enquiry.application) {
        throw new AppError('Use "Convert to application" to move an enquiry to APPLIED', 400);
    }
    Object.assign(enquiry, updates);
    await enquiry.save();
    return enquiry.toObject();
};

const addFollowUp = async (id, userId, { note, nextFollowUpDate, status }) => {
    assertObjectId(id, 'enquiry ID');
    if (!note || !String(note).trim()) throw new AppError('Follow-up note is required', 400);
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    enquiry.followUps.push({ note: String(note).trim(), by: userId, date: new Date() });
    if (nextFollowUpDate !== undefined) enquiry.nextFollowUpDate = nextFollowUpDate || null;
    if (status && ['CONTACTED', 'FOLLOW_UP', 'CLOSED'].includes(status)) enquiry.status = status;
    else if (enquiry.status === 'NEW') enquiry.status = 'CONTACTED';
    await enquiry.save();
    return enquiry.toObject();
};

const deleteEnquiry = async (id) => {
    assertObjectId(id, 'enquiry ID');
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    if (enquiry.application) throw new AppError('This enquiry already has an application and cannot be deleted', 409);
    await enquiry.deleteOne();
    return { deleted: true };
};

// ---------------- Applications ----------------
const nextApplicationNumber = async () => {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
        { key: `ADMISSION_APPLICATION:${year}` },
        { $inc: { seq: 1 }, $setOnInsert: { role: 'ADMIN', year } },
        { new: true, upsert: true }
    );
    return `APP-${year}-${String(counter.seq).padStart(4, '0')}`;
};

const normaliseDocuments = (documents) => {
    if (documents === undefined) return undefined;
    if (!Array.isArray(documents)) throw new AppError('documents must be an array', 400);
    return documents
        .map((d) => (typeof d === 'string' ? { name: d } : d))
        .filter((d) => d && String(d.name || '').trim())
        .map((d) => ({ name: String(d.name).trim(), verified: false }));
};

const createApplication = async (data) => {
    const payload = pick(data, APPLICATION_FIELDS);
    if (typeof payload.gender === 'string') payload.gender = payload.gender.toUpperCase();
    const documents = normaliseDocuments(data.documents) || [];

    let enquiry = null;
    if (data.enquiry) {
        assertObjectId(data.enquiry, 'enquiry ID');
        enquiry = await Enquiry.findById(data.enquiry);
        if (!enquiry) throw new AppError('Enquiry not found', 404);
        if (enquiry.application) throw new AppError('An application already exists for this enquiry', 409);
    }

    const probe = new AdmissionApplication({ ...payload, documents, applicationNumber: 'PENDING' });
    const validationError = probe.validateSync();
    if (validationError) throw validationError;

    const application = await AdmissionApplication.create({
        ...payload,
        documents,
        enquiry: enquiry ? enquiry._id : null,
        applicationNumber: await nextApplicationNumber(),
    });

    if (enquiry) {
        enquiry.application = application._id;
        enquiry.status = 'APPLIED';
        await enquiry.save();
    }
    return application.toObject();
};

const listApplications = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const filter = {};
    if (query.status) filter.status = String(query.status).toUpperCase();
    if (query.classApplied) filter.classApplied = String(query.classApplied);
    if (query.search) {
        const regex = { $regex: escapeRegex(query.search), $options: 'i' };
        filter.$or = [{ firstName: regex }, { lastName: regex }, { guardianName: regex }, { phone: regex }, { applicationNumber: regex }];
    }
    const [applications, total, statusCounts] = await Promise.all([
        AdmissionApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('student', 'studentId').lean(),
        AdmissionApplication.countDocuments(filter),
        AdmissionApplication.find().select('status').lean(),
    ]);
    const counts = statusCounts.reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), {});
    return { applications, counts, pagination: buildPagination(page, limit, total) };
};

const getApplication = async (id) => {
    assertObjectId(id, 'application ID');
    const application = await AdmissionApplication.findById(id).populate('student', 'studentId firstName lastName class section').lean();
    if (!application) throw new AppError('Application not found', 404);
    return application;
};

const updateApplication = async (id, data) => {
    assertObjectId(id, 'application ID');
    const application = await AdmissionApplication.findById(id);
    if (!application) throw new AppError('Application not found', 404);
    if (application.status === 'ENROLLED') throw new AppError('An enrolled application can no longer be edited', 409);
    const updates = pick(data, APPLICATION_FIELDS);
    if (typeof updates.gender === 'string') updates.gender = updates.gender.toUpperCase();
    Object.assign(application, updates);
    if (data.documents !== undefined) {
        // Keep verification state for documents that still exist
        const previous = new Map(application.documents.map((d) => [d.name, d]));
        application.documents = normaliseDocuments(data.documents).map((d) => previous.get(d.name) || d);
    }
    await application.save();
    return application.toObject();
};

const setDocumentVerified = async (id, docId, verified, userId) => {
    assertObjectId(id, 'application ID');
    assertObjectId(docId, 'document ID');
    const application = await AdmissionApplication.findById(id);
    if (!application) throw new AppError('Application not found', 404);
    const doc = application.documents.id(docId);
    if (!doc) throw new AppError('Document not found', 404);
    doc.verified = Boolean(verified);
    doc.verifiedBy = verified ? userId : null;
    doc.verifiedAt = verified ? new Date() : null;
    await application.save();
    return application.toObject();
};

const changeStatus = async (id, status, note, userId) => {
    assertObjectId(id, 'application ID');
    const application = await AdmissionApplication.findById(id);
    if (!application) throw new AppError('Application not found', 404);
    if (!(TRANSITIONS[application.status] || []).includes(status)) {
        throw new AppError(`Cannot change status from ${application.status} to ${status}`, 400);
    }
    if (status === 'APPROVED' && application.documents.some((d) => !d.verified)) {
        throw new AppError('All submitted documents must be verified before approval', 400);
    }
    application.status = status;
    application.decisionNote = String(note || '').trim();
    application.decidedBy = userId;
    application.decidedAt = new Date();
    await application.save();
    return application.toObject();
};

/**
 * Converts an APPROVED application into a Student (with login credentials).
 * The status is claimed atomically first, so double submissions cannot create two students.
 */
const enrollApplication = async (id, { section, rollNumber, admissionNumber, admissionDate, allowPossibleDuplicate = false }) => {
    assertObjectId(id, 'application ID');
    if (!section || !rollNumber || !admissionNumber) {
        throw new AppError('section, rollNumber and admissionNumber are required to enroll', 400);
    }

    const candidate = await AdmissionApplication.findById(id).lean();
    if (!candidate) throw new AppError('Application not found', 404);
    if (candidate.status === 'ENROLLED') throw new AppError('This application has already been enrolled', 409);
    if (candidate.status !== 'APPROVED') throw new AppError('Only approved applications can be enrolled', 400);

    if (!allowPossibleDuplicate) {
        const duplicate = await Student.findOne({
            firstName: candidate.firstName, lastName: candidate.lastName, dateOfBirth: candidate.dateOfBirth,
        }).select('studentId').lean();
        if (duplicate) {
            throw new AppError(`A student with the same name and date of birth already exists (${duplicate.studentId}). Confirm to enroll anyway.`, 409);
        }
    }

    // Claim the application so a concurrent request cannot enroll it too
    const claimed = await AdmissionApplication.findOneAndUpdate(
        { _id: id, status: 'APPROVED', student: null },
        { $set: { status: 'ENROLLED' } },
        { new: true }
    );
    if (!claimed) throw new AppError('This application is already being enrolled', 409);

    try {
        const result = await studentService.createStudentAccount({
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            dateOfBirth: candidate.dateOfBirth,
            gender: candidate.gender,
            class: candidate.classApplied,
            section: String(section).toUpperCase(),
            rollNumber: String(rollNumber),
            admissionNumber: String(admissionNumber),
            admissionDate: admissionDate || new Date(),
            phone: candidate.phone,
            email: candidate.email || undefined,
            address: candidate.address,
            city: candidate.city,
            state: candidate.state,
            postalCode: candidate.postalCode,
        });
        claimed.student = result.student._id;
        await claimed.save();
        return {
            application: claimed.toObject(),
            student: { _id: result.student._id, studentId: result.student.studentId, class: result.student.class, section: result.student.section },
            credentials: { loginId: result.user.loginId, temporaryPassword: result.temporaryPassword },
        };
    } catch (error) {
        // Release the claim so the admin can fix the data and retry
        await AdmissionApplication.updateOne({ _id: id, student: null }, { $set: { status: 'APPROVED' } });
        throw error;
    }
};

module.exports = {
    listEnquiries, createEnquiry, updateEnquiry, addFollowUp, deleteEnquiry,
    createApplication, listApplications, getApplication, updateApplication,
    setDocumentVerified, changeStatus, enrollApplication,
};

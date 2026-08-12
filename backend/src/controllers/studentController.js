const studentService = require('../services/studentService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createStudent = asyncHandler(async (req, res) => {
    const restrictedFields = ['studentId', 'loginId', 'password', 'passwordHash', 'role', 'refreshToken'];

    for (const field of restrictedFields) {
        if (req.body[field]) {
            throw new AppError(`Field '${field}' is not allowed in request body`, 400);
        }
    }

    const result = await studentService.createStudentAccount(req.body);

    res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: {
            student: {
                studentId: result.student.studentId,
                loginId: result.user.loginId,
                firstName: result.student.firstName,
                lastName: result.student.lastName,
                class: result.student.class,
                section: result.student.section,
                status: result.student.status,
            },
            credentials: {
                loginId: result.user.loginId,
                temporaryPassword: result.temporaryPassword,
            }
        }
    });
});

const getStudents = asyncHandler(async (req, res) => {
    const result = await studentService.getStudentsList(req.query);
    res.status(200).json({
        success: true,
        data: result
    });
});

const getStudentById = asyncHandler(async (req, res) => {
    const result = await studentService.getStudentById(req.params.id);
    res.status(200).json({
        success: true,
        data: result
    });
});

const updateStudent = asyncHandler(async (req, res) => {
    const updatedStudent = await studentService.updateStudentById(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: {
            student: updatedStudent
        }
    });
});

const activateStudentAccount = asyncHandler(async (req, res) => {
    const result = await studentService.updateStudentStatus(req.params.id, true);
    res.status(200).json({
        success: true,
        message: 'Student activated successfully',
        data: result
    });
});

const deactivateStudentAccount = asyncHandler(async (req, res) => {
    const result = await studentService.updateStudentStatus(req.params.id, false);
    res.status(200).json({
        success: true,
        message: 'Student deactivated successfully',
        data: result
    });
});

const getCurrentStudent = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const student = await studentService.getCurrentStudent(userId);

    res.status(200).json({
        success: true,
        data: student
    });
});

const exportAdminStudents = asyncHandler(async (req, res) => {
    // Explicitly destructure only allowed filters from query
    const { search, status } = req.query;
    const classFilter = req.query.class;
    const sectionFilter = req.query.section;

    const csvData = await studentService.exportAdminStudents({
        search, status, class: classFilter, section: sectionFilter
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.status(200).send(csvData);
});

const bulkActivateStudents = asyncHandler(async (req, res) => {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new AppError('studentIds must be a non-empty array', 400);
    }

    const validIds = studentIds.filter(id => id && typeof id === 'string');
    if (validIds.length !== studentIds.length) {
        throw new AppError('Invalid student ID array format provided. IDs must be valid strings.', 400);
    }

    const { requestedCount, updatedCount, alreadyInStateCount, failedCount } = await studentService.bulkUpdateStudentStatus(validIds, true);

    res.status(200).json({
        success: true,
        message: 'Bulk activation completed successfully',
        data: {
            requestedCount,
            updatedCount,
            alreadyInStateCount,
            failedCount
        }
    });
});

const bulkDeactivateStudents = asyncHandler(async (req, res) => {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new AppError('studentIds must be a non-empty array', 400);
    }

    const validIds = studentIds.filter(id => id && typeof id === 'string');
    if (validIds.length !== studentIds.length) {
        throw new AppError('Invalid student ID array format provided. IDs must be valid strings.', 400);
    }

    const { requestedCount, updatedCount, alreadyInStateCount, failedCount } = await studentService.bulkUpdateStudentStatus(validIds, false);

    res.status(200).json({
        success: true,
        message: 'Bulk deactivation completed successfully',
        data: {
            requestedCount,
            updatedCount,
            alreadyInStateCount,
            failedCount
        }
    });
});

const importAdminStudents = asyncHandler(async (req, res) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
        throw new AppError('Invalid content type. Must be multipart/form-data.', 400);
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
        throw new AppError('Boundary not found in multipart/form-data content type.', 400);
    }
    const boundary = '--' + (boundaryMatch[1] || boundaryMatch[2]);

    let buffer;
    try {
        buffer = await new Promise((resolve, reject) => {
            let body = [];
            let totalSize = 0;
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
            req.on('data', chunk => {
                totalSize += chunk.length;
                if (totalSize > MAX_SIZE) {
                    reject(new AppError('File size exceeds the 5MB limit.', 400));
                    return;
                }
                body.push(chunk);
            });
            req.on('end', () => resolve(Buffer.concat(body)));
            req.on('error', err => reject(err));
        });
    } catch (err) {
        throw new AppError(err.message || 'Error reading upload stream.', 400);
    }

    const strBuffer = buffer.toString('utf-8');
    const parts = strBuffer.split(boundary);
    let csvContent = null;

    for (const part of parts) {
        if (part.includes('filename="') && part.includes('name="file"')) {
            const dataIndex = part.indexOf('\r\n\r\n');
            if (dataIndex !== -1) {
                const contentEnd = part.lastIndexOf('\r\n');
                csvContent = part.substring(dataIndex + 4, contentEnd !== -1 && contentEnd > dataIndex + 4 ? contentEnd : part.length);
                break;
            }
        }
    }

    if (!csvContent || csvContent.trim().length === 0) {
        throw new AppError('No valid CSV file found in request. File part must be named "file".', 400);
    }

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    const csvStr = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < csvStr.length; i++) {
        let c = csvStr[i];
        if (inQuotes) {
            if (c === '"') {
                if (i + 1 < csvStr.length && csvStr[i + 1] === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentCell += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === ',') {
                currentRow.push(currentCell.trim());
                currentCell = '';
            } else if (c === '\n') {
                currentRow.push(currentCell.trim());
                if (currentRow.join('').trim().length > 0) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += c;
            }
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.join('').trim().length > 0) {
            rows.push(currentRow);
        }
    }

    if (rows.length < 2) {
        throw new AppError('CSV must contain headers and at least one data row.', 400);
    }

    const rawHeaders = rows[0];
    const dataRows = rows.slice(1);

    const EXPECTED_HEADERS = ['FirstName', 'LastName', 'DateOfBirth', 'Gender', 'Class', 'Section', 'RollNumber', 'AdmissionNumber', 'AdmissionDate', 'Phone', 'Address', 'City', 'State', 'PostalCode'];

    const headerMap = {};
    rawHeaders.forEach((h, idx) => {
        const cleanH = h.trim();
        headerMap[cleanH] = idx;
    });

    const missingHeaders = EXPECTED_HEADERS.filter(eh => headerMap[eh] === undefined);
    if (missingHeaders.length > 0) {
        throw new AppError(`Missing required headers: ${missingHeaders.join(', ')}`, 400);
    }

    const studentDataArray = [];
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;

        const getValue = (header) => row[headerMap[header]] !== undefined ? row[headerMap[header]] : '';

        const studentData = {
            firstName: getValue('FirstName'),
            lastName: getValue('LastName'),
            dateOfBirth: getValue('DateOfBirth'),
            gender: getValue('Gender').toUpperCase(),
            class: getValue('Class'),
            section: getValue('Section'),
            rollNumber: getValue('RollNumber'),
            admissionNumber: getValue('AdmissionNumber'),
            admissionDate: getValue('AdmissionDate'),
            phone: getValue('Phone'),
            email: getValue('Email') ? getValue('Email').toLowerCase() : null,
            address: getValue('Address'),
            city: getValue('City'),
            state: getValue('State'),
            postalCode: getValue('PostalCode'),
        };

        let rowHasError = false;

        for (const [key, val] of Object.entries(studentData)) {
            if (val && typeof val === 'string' && val.startsWith('$')) {
                errors.push({ row: rowNum, field: key, message: 'Invalid starting character "$".' });
                rowHasError = true;
            }
        }

        for (const reqField of EXPECTED_HEADERS) {
            if (!studentData[reqField] && reqField !== 'Email') {
                errors.push({ row: rowNum, field: reqField, message: `${reqField} is required.` });
                rowHasError = true;
            }
        }

        if (studentData.email && !emailRegex.test(studentData.email)) {
            errors.push({ row: rowNum, field: 'Email', message: 'Invalid email format.' });
            rowHasError = true;
        }

        if (studentData.gender && !['MALE', 'FEMALE', 'OTHER'].includes(studentData.gender)) {
            errors.push({ row: rowNum, field: 'Gender', message: 'Gender must be MALE, FEMALE, or OTHER.' });
            rowHasError = true;
        }

        if (studentData.dateOfBirth && isNaN(Date.parse(studentData.dateOfBirth))) {
            errors.push({ row: rowNum, field: 'DateOfBirth', message: 'Invalid date format.' });
            rowHasError = true;
        }

        if (studentData.admissionDate && isNaN(Date.parse(studentData.admissionDate))) {
            errors.push({ row: rowNum, field: 'AdmissionDate', message: 'Invalid date format.' });
            rowHasError = true;
        }

        if (!rowHasError) {
            studentDataArray.push({ rowNum, data: studentData });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'CSV validation failed.',
            data: {
                totalRows: dataRows.length,
                imported: 0,
                failed: errors.length,
                errors: errors.slice(0, 50)
            }
        });
    }

    const { imported, failed, serviceErrors } = await studentService.bulkImportStudents(studentDataArray, dataRows.length);

    if (failed > 0) {
        return res.status(400).json({
            success: false,
            message: 'Import failed due to data consistency errors.',
            data: {
                totalRows: dataRows.length,
                imported: 0,
                failed,
                errors: serviceErrors
            }
        });
    }

    res.status(200).json({
        success: true,
        message: 'Students imported successfully.',
        data: {
            totalRows: dataRows.length,
            imported,
            failed: 0,
            errors: []
        }
    });
});

module.exports = {
    createStudent,
    getStudents,
    getStudentById,
    updateStudent,
    activateStudentAccount,
    deactivateStudentAccount,
    getCurrentStudent,
    exportAdminStudents,
    bulkActivateStudents,
    bulkDeactivateStudents,
    importAdminStudents
};

const AuditLog = require('../models/AuditLog');
const { ROLES } = require('../constants/roles');

const AUDITED_ROLES = [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.LIBRARIAN];
const SKIPPED_PATHS = [/^\/api\/auth\//, /^\/api\/notifications/, /^\/api\/messages/];

/**
 * Records successful write requests made by administrative roles.
 * Runs after the response is sent, so it never slows down or breaks a request.
 * Request bodies are intentionally NOT stored (they can contain passwords).
 */
const auditLog = (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

    res.on('finish', () => {
        const user = req.user;
        if (!user || !AUDITED_ROLES.includes(user.role)) return;
        if (res.statusCode >= 400) return;
        const path = req.originalUrl.split('?')[0];
        if (SKIPPED_PATHS.some((rx) => rx.test(path))) return;

        const segments = path.replace(/^\/api\//, '').split('/');
        AuditLog.create({
            actor: user._id,
            actorLoginId: user.loginId,
            actorRole: user.role,
            method: req.method,
            path,
            module: segments[0] || 'unknown',
            statusCode: res.statusCode,
            summary: `${req.method} ${path}`,
            ip: req.ip || '',
        }).catch((error) => console.error('Audit log write failed:', error.message));
    });

    next();
};

module.exports = { auditLog };

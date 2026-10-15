const mongoose = require('mongoose');

// Append-only record of administrative write actions.
const auditLogSchema = new mongoose.Schema(
    {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        actorLoginId: { type: String, required: true },
        actorRole: { type: String, required: true },
        method: { type: String, required: true },
        path: { type: String, required: true },
        module: { type: String, required: true, index: true },
        statusCode: { type: Number, required: true },
        summary: { type: String, default: '' },
        ip: { type: String, default: '' },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

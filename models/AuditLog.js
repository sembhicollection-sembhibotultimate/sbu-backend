const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    eventType: { type: String, default: '' },
    email: { type: String, default: '' },
    status: { type: String, default: '' },
    details: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

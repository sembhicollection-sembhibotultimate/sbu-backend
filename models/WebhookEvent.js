const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    stripeEventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, default: '' },
    status: { type: String, enum: ['processed', 'failed'], default: 'processed' },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', webhookEventSchema);

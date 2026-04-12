const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    stripeCustomerId: { type: String, default: '' },
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String, default: '' },
    amountTotal: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
    status: { type: String, default: 'paid' },
    orderId: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);

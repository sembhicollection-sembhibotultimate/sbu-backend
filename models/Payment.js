const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'License', default: null, index: true },

    email: { type: String, required: true, index: true, lowercase: true, trim: true },

    stripeCustomerId: { type: String, default: '', index: true },
    stripeSessionId: { type: String, default: '', index: true },
    stripePaymentIntentId: { type: String, default: '', index: true },
    stripeInvoiceId: { type: String, default: '', index: true },
    stripeSubscriptionId: { type: String, default: '', index: true },
    stripeEventId: { type: String, default: '', index: true },

    amountTotal: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },

    status: {
      type: String,
      enum: ['paid', 'failed', 'pending', 'refunded'],
      default: 'paid'
    },

    paymentType: {
      type: String,
      enum: ['checkout', 'subscription_initial', 'subscription_renewal', 'manual', 'unknown'],
      default: 'unknown'
    },

    plan: { type: String, default: 'Monthly' },
    orderId: { type: String, default: '', index: true },

    rawSnapshot: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

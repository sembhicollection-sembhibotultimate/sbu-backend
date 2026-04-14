const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    licenseKey: { type: String, required: true, unique: true, index: true },

    productName: { type: String, default: 'Sembhi Bot Ultimate' },
    plan: { type: String, default: 'Monthly' },
    licenseType: { type: String, enum: ['customer', 'owner'], default: 'customer', index: true },
    ownerLifetime: { type: Boolean, default: false },
    allowUnlimitedDevices: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active'
    },

    activatedDevices: { type: Number, default: 0 },
    maxDevices: { type: Number, default: 1 },

    machineId: { type: String, default: '' },
    machineName: { type: String, default: '' },
    lastValidatedAt: { type: Date, default: null },

    orderId: { type: String, default: '' },
    stripeSessionId: { type: String, default: '' },
    stripeCustomerId: { type: String, default: '', index: true },
    stripeSubscriptionId: { type: String, default: '', index: true },

    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.License || mongoose.model('License', licenseSchema);

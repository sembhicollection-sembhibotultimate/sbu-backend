const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, index: true },
    licenseKey: { type: String, required: true, unique: true, index: true },
    productName: { type: String, default: 'Sembhi Bot Ultimate' },
    plan: { type: String, default: 'Monthly' },
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },

    activatedDevices: { type: Number, default: 0 },
    maxDevices: { type: Number, default: 1 },

    machineId: { type: String, default: '' },
    machineName: { type: String, default: '' },
    lastValidatedAt: { type: Date, default: null },

    orderId: { type: String, default: '' },
    stripeSessionId: { type: String, default: '' },

    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('License', licenseSchema);

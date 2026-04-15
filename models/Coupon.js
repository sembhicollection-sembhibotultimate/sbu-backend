const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    name: { type: String, default: '' },
    discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
    discountValue: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    maxRedemptions: { type: Number, default: null },
    redemptions: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    stripeCouponId: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

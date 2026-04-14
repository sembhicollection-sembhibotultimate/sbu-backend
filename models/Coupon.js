const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
    discountValue: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    duration: { type: String, enum: ['once', 'repeating', 'forever'], default: 'once' },
    durationInMonths: { type: Number, default: null },
    maxRedemptions: { type: Number, default: null },
    timesRedeemed: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    stripeCouponId: { type: String, default: '', index: true },
    stripePromotionCodeId: { type: String, default: '', index: true },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, default: "monthly" },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    showOnHomepage: { type: Boolean, default: true },
    showCountdown: { type: Boolean, default: true },
    badgeText: { type: String, default: "" },
    offerLine: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

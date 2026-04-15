import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    value: { type: Number, required: true },
    active: { type: Boolean, default: true },
    appliesTo: { type: [String], default: ["monthly"] },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);

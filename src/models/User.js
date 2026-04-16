import mongoose from "mongoose";

const acceptanceSchema = new mongoose.Schema(
  {
    termsAccepted: { type: Boolean, default: false },
    privacyAccepted: { type: Boolean, default: false },
    refundAccepted: { type: Boolean, default: false },
    riskAccepted: { type: Boolean, default: false },
    signatureDataUrl: { type: String, default: "" },
    signatureTypedName: { type: String, default: "" },
    acceptedAt: { type: Date, default: null },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    country: { type: String, default: "" },
    plan: { type: String, default: "monthly" },
    status: { type: String, enum: ["active", "inactive", "disabled"], default: "active" },
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    couponUsed: { type: String, default: "" },
    agreementPdfFileName: { type: String, default: "" },
    acceptance: { type: acceptanceSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

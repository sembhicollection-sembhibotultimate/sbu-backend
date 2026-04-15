import mongoose from "mongoose";

const paymentRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customerEmail: { type: String, default: "" },
    stripeCustomerId: { type: String, default: "" },
    stripeSessionId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "cancelled"], default: "pending" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    plan: { type: String, default: "monthly" },
    couponCode: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("PaymentRecord", paymentRecordSchema);

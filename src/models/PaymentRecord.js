import mongoose from "mongoose";

const paymentRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customerEmail: { type: String, default: "" },
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    stripeSessionId: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    plan: { type: String, default: "monthly" },
    couponCode: { type: String, default: "" },
    paymentStatus: { type: String, default: "pending" }
  },
  { timestamps: true }
);

export default mongoose.model("PaymentRecord", paymentRecordSchema);

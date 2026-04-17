import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, required: true },
    fullName: { type: String, default: "" },
    type: { type: String, enum: ["strategy_request","suggestion","support","general"], default: "general" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open","resolved"], default: "open" },
    adminNotes: { type: String, default: "" },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.models.SupportMessage || mongoose.model("SupportMessage", schema);

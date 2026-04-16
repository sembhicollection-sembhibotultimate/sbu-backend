import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, required: true, index: true },
    fullName: { type: String, default: "" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["strategy_request", "suggestion", "support", "general"],
      default: "general"
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open"
    },
    adminNotes: { type: String, default: "" },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.models.SupportMessage ||
  mongoose.model("SupportMessage", supportMessageSchema);

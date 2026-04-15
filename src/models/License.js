import mongoose from "mongoose";

const licenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    licenseKey: { type: String, required: true, unique: true },
    productName: { type: String, default: "Sembhi Bot Ultimate" },
    status: { type: String, enum: ["active", "expired", "disabled"], default: "active" },
    plan: { type: String, default: "monthly" },
    hwid: { type: String, default: "" },
    expiresAt: { type: Date, default: null },
    lastValidatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("License", licenseSchema);

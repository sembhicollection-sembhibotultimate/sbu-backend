import mongoose from "mongoose";

const legalDocumentSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    html: { type: String, default: "" },
    version: { type: String, default: "1.0" },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("LegalDocument", legalDocumentSchema);

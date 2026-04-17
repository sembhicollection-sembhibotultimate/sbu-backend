import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    fileName: { type: String, default: "" },
    sortOrder: { type: Number, default: 1 },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.DownloadItem || mongoose.model("DownloadItem", schema);

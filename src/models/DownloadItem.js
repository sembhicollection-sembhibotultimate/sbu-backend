import mongoose from "mongoose";

const downloadItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    sortOrder: { type: Number, default: 1 },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.DownloadItem || mongoose.model("DownloadItem", downloadItemSchema);

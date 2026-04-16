import mongoose from "mongoose";

const learningVideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    sortOrder: { type: Number, default: 1 },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.LearningVideo || mongoose.model("LearningVideo", learningVideoSchema);

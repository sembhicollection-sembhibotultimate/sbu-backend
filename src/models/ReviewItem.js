import mongoose from "mongoose";

const reviewItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    role: { type: String, default: "Member" },
    text: { type: String, default: "" },
    rating: { type: Number, default: 5 },
    screenshotUrl: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export default mongoose.models.ReviewItem || mongoose.model("ReviewItem", reviewItemSchema);

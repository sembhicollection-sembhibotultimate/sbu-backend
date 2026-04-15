import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    phone: { type: String, default: "" },
    country: { type: String, default: "" },
    address: { type: String, default: "" }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: "" },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    plan: { type: String, default: "monthly" },
    couponUsed: { type: String, default: "" },
    stripeCustomerId: { type: String, default: "" },
    profile: { type: profileSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

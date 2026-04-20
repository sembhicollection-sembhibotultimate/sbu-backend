import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.PasswordResetToken || mongoose.model("PasswordResetToken", passwordResetTokenSchema);

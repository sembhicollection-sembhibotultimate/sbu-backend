// V14 PATCH METHODS
// Add these imports to your existing authController.js:
// import crypto from "crypto";
// import PasswordResetToken from "../models/PasswordResetToken.js";
// import { sendPasswordResetEmail } from "../services/emailService.js";

export async function requestPasswordReset(req, res) {
  const email = (req.body.email || "").toLowerCase().trim();
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({
      success: true,
      message: "If this email exists, a reset link has been sent."
    });
  }

  await PasswordResetToken.deleteMany({ userId: user._id });

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await PasswordResetToken.create({
    userId: user._id,
    email: user.email,
    token,
    expiresAt
  });

  const resetUrl = `${process.env.FRONTEND_URL || "https://sembhibotultimate.com"}/reset-password.html?token=${token}`;

  await sendPasswordResetEmail({
    to: user.email,
    fullName: user.fullName,
    resetUrl
  });

  return res.json({
    success: true,
    message: "If this email exists, a reset link has been sent."
  });
}

export async function resetPassword(req, res) {
  const token = (req.body.token || "").trim();
  const newPassword = req.body.password || "";

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: "Token and new password are required" });
  }

  const resetDoc = await PasswordResetToken.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!resetDoc) {
    return res.status(400).json({ success: false, message: "Reset link is invalid or expired" });
  }

  const user = await User.findById(resetDoc.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  resetDoc.used = true;
  await resetDoc.save();

  return res.json({ success: true, message: "Password updated successfully" });
}\n
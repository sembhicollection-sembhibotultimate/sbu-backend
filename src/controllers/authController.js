import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createToken } from "../utils/createToken.js";

function sanitizeUser(user) {
  const clean = user.toObject ? user.toObject() : user;
  delete clean.passwordHash;
  return clean;
}

export const signup = async (req, res) => {
  const {
    fullName = "",
    email = "",
    password = "",
    couponCode = "",
    plan = "monthly"
  } = req.body;

  if (!email.trim() || !password.trim()) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    plan,
    couponUsed: couponCode?.trim() || ""
  });

  const token = createToken({ userId: user._id, email: user.email });
  res.json({ success: true, message: "Signup successful", token, user: sanitizeUser(user) });
};

export const login = async (req, res) => {
  const { email = "", password = "" } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const matches = await bcrypt.compare(password, user.passwordHash || "");
  if (!matches) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (user.status !== "active") {
    return res.status(403).json({ success: false, message: "User account is disabled" });
  }

  const token = createToken({ userId: user._id, email: user.email });
  res.json({ success: true, message: "Login successful", token, user: sanitizeUser(user) });
};

export const forgotPassword = async (req, res) => {
  const { email = "" } = req.body;
  if (!email.trim()) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.json({ success: true, message: "If the account exists, reset instructions can be sent." });
  }

  res.json({
    success: true,
    message: "Forgot password route is ready. Connect email reset delivery next."
  });
};

export const changePassword = async (req, res) => {
  const { currentPassword = "", newPassword = "" } = req.body;

  if (!newPassword.trim() || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }

  const user = await User.findById(req.user.userId);
  const matches = await bcrypt.compare(currentPassword, user.passwordHash || "");

  if (!matches) {
    return res.status(401).json({ success: false, message: "Current password is incorrect" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
};

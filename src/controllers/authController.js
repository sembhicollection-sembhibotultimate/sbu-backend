import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import License from "../models/License.js";
import LegalDocument from "../models/LegalDocument.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import { createToken } from "../utils/createToken.js";
import { buildAgreementPdfBuffer } from "../utils/pdfAgreement.js";
import { sendAgreementPdfEmail, sendPasswordResetEmail } from "../services/emailService.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";

function requiredAcceptance(body) {
  return [body.termsAccepted, body.privacyAccepted, body.refundAccepted, body.riskAccepted].every(Boolean);
}
function normalizePhone(phone = "") {
  return String(phone).replace(/\s+/g, "").trim();
}

export async function register(req, res) {
  const {
    fullName, email, password, phone, address, country,
    plan = "monthly", couponCode = "",
    termsAccepted, privacyAccepted, refundAccepted, riskAccepted,
    signatureDataUrl = "", signatureTypedName = ""
  } = req.body || {};

  if (!fullName || !email || !password || !phone || !address) {
    return res.status(400).json({ success: false, message: "Name, email, password, phone, and address are required" });
  }
  if (!requiredAcceptance(req.body)) {
    return res.status(400).json({ success: false, message: "All legal conditions must be accepted before signup" });
  }
  if (!signatureDataUrl && !signatureTypedName) {
    return res.status(400).json({ success: false, message: "Digital signature is required" });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanPhone = normalizePhone(phone);
  const existingByPhone = await User.findOne({ phone: cleanPhone, email: { $ne: cleanEmail } });
  if (existingByPhone) {
    return res.status(400).json({ success: false, message: "This mobile number is already registered" });
  }

  const exists = await User.findOne({ email: cleanEmail });

  if (exists) {
    const ok = await bcrypt.compare(password || "", exists.passwordHash);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Email already registered. Use the same password or login." });
    }

    exists.fullName = fullName;
    exists.phone = cleanPhone;
    exists.address = address;
    exists.country = country;
    exists.plan = plan;
    exists.couponUsed = couponCode?.trim()?.toUpperCase() || exists.couponUsed || "";
    exists.acceptance = {
      termsAccepted, privacyAccepted, refundAccepted, riskAccepted,
      signatureDataUrl, signatureTypedName,
      acceptedAt: new Date(),
      ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress || "",
      userAgent: req.headers["user-agent"] || ""
    };
    await exists.save();

    let license = await License.findOne({ userId: exists._id }).sort({ createdAt: -1 });
    if (!license) {
      license = await License.create({ userId: exists._id, licenseKey: generateLicenseKey(), plan, status: "inactive" });
    }

    const token = createToken(exists);
    return res.json({
      success: true,
      existingUser: true,
      message: "Email already registered. Continuing to checkout.",
      token,
      data: { user: { _id: exists._id, fullName: exists.fullName, email: exists.email, plan: exists.plan, avatarUrl: exists.avatarUrl || "" }, license }
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName, email: cleanEmail, passwordHash, phone: cleanPhone, address, country, plan,
    couponUsed: couponCode?.trim()?.toUpperCase() || "",
    acceptance: {
      termsAccepted, privacyAccepted, refundAccepted, riskAccepted,
      signatureDataUrl, signatureTypedName,
      acceptedAt: new Date(),
      ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress || "",
      userAgent: req.headers["user-agent"] || ""
    }
  });

  try {
    const legalDocs = await LegalDocument.find({ slug: { $in: ["privacy", "refund", "risk", "terms"] } }).sort({ slug: 1 });
    const pdfBuffer = await buildAgreementPdfBuffer({ user, legalDocs });
    await sendAgreementPdfEmail({ user, pdfBuffer });
  } catch (e) {
    console.warn("Agreement PDF/email skipped:", e.message);
  }

  const license = await License.create({
    userId: user._id,
    licenseKey: generateLicenseKey(),
    plan,
    status: "inactive"
  });

  const token = createToken(user);
  res.json({
    success: true,
    message: "Signup completed",
    token,
    data: { user: { _id: user._id, fullName: user.fullName, email: user.email, plan: user.plan, avatarUrl: user.avatarUrl || "" }, license }
  });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: email?.toLowerCase().trim() });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(400).json({ success: false, message: "Invalid password" });

  const token = createToken(user);
  res.json({
    success: true,
    token,
    data: { user: { _id: user._id, fullName: user.fullName, email: user.email, plan: user.plan, status: user.status, avatarUrl: user.avatarUrl || "" } }
  });
}

export async function requestPasswordReset(req, res) {
  const email = (req.body.email || "").toLowerCase().trim();
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
  }

  await PasswordResetToken.deleteMany({ userId: user._id });
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await PasswordResetToken.create({ userId: user._id, email: user.email, token, expiresAt });

  const resetUrl = `${process.env.FRONTEND_URL || "https://sembhibotultimate.com"}/reset-password.html?token=${token}`;
  await sendPasswordResetEmail({ to: user.email, fullName: user.fullName, resetUrl });

  return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
}

export async function resetPassword(req, res) {
  const token = (req.body.token || "").trim();
  const newPassword = req.body.password || "";
  if (!token || !newPassword) return res.status(400).json({ success: false, message: "Token and new password are required" });

  const resetDoc = await PasswordResetToken.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
  if (!resetDoc) return res.status(400).json({ success: false, message: "Reset link is invalid or expired" });

  const user = await User.findById(resetDoc.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  resetDoc.used = true;
  await resetDoc.save();

  return res.json({ success: true, message: "Password updated successfully" });
}

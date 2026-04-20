import bcrypt from "bcryptjs";
import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import SupportMessage from "../models/SupportMessage.js";
import Notification from "../models/Notification.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";
import { sendBulkEmail, sendLicenseIssuedEmail, sendSimpleEmail } from "../services/emailService.js";

function normalizePhone(phone = "") {
  return String(phone).replace(/\s+/g, "").trim();
}

export async function getUsers(req, res) {
  const data = await User.find().sort({ createdAt: -1 }).select("-passwordHash");
  res.json({ success: true, data });
}

export async function getUserDetail(req, res) {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const [licenses, payments, messages, notifications] = await Promise.all([
    License.find({ userId: user._id }).sort({ createdAt: -1 }),
    PaymentRecord.find({ userId: user._id }).sort({ createdAt: -1 }),
    SupportMessage.find({ userId: user._id }).sort({ createdAt: -1 }),
    Notification.find({ userId: user._id }).sort({ createdAt: -1 })
  ]);
  const acc = user.acceptance || {};
  res.json({
    success: true,
    data: {
      user, licenses, payments, messages, notifications,
      agreement: {
        acceptance: {
          terms: acc.termsAccepted, privacy: acc.privacyAccepted, refund: acc.refundAccepted, risk: acc.riskAccepted,
          acceptedAt: acc.acceptedAt, ip: acc.ipAddress, userAgent: acc.userAgent
        },
        signatureTypedName: acc.signatureTypedName || "",
        signatureImage: acc.signatureDataUrl || "",
        createdAt: user.createdAt
      }
    }
  });
}

export async function updateUser(req, res) {
  const update = { ...req.body };
  delete update.passwordHash;
  if (update.phone) {
    const existingByPhone = await User.findOne({ phone: normalizePhone(update.phone), _id: { $ne: req.params.id } });
    if (existingByPhone) return res.status(400).json({ success: false, message: "This mobile number is already registered" });
    update.phone = normalizePhone(update.phone);
  }
  if (update.password) {
    update.passwordHash = await bcrypt.hash(update.password, 10);
    delete update.password;
  }
  const data = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select("-passwordHash");
  res.json({ success: true, data });
}

export async function toggleUserStatus(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const nextStatus = user.status === "active" ? "disabled" : "active";
  user.status = nextStatus;
  await user.save();
  await License.updateMany({ userId: user._id }, { status: nextStatus === "active" ? "active" : "inactive" });
  res.json({ success: true, data: user });
}

export async function deleteUser(req, res) {
  await Promise.all([
    License.deleteMany({ userId: req.params.id }),
    PaymentRecord.deleteMany({ userId: req.params.id }),
    SupportMessage.deleteMany({ userId: req.params.id }),
    Notification.deleteMany({ userId: req.params.id }),
    User.findByIdAndDelete(req.params.id)
  ]);
  res.json({ success: true });
}

export async function createLicenseForUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const { plan = user.plan || "monthly" } = req.body || {};
  const data = await License.create({
    userId: req.params.id,
    licenseKey: generateLicenseKey(),
    status: "active",
    plan
  });
  user.status = "active";
  user.plan = plan;
  await user.save();
  await sendLicenseIssuedEmail({
    to: user.email, fullName: user.fullName, licenseKey: data.licenseKey, plan,
    portalUrl: process.env.PORTAL_URL || "https://sembhibotultimate.com/portal.html"
  });
  res.json({ success: true, data });
}

export async function getLicenses(req, res) {
  const data = await License.find().populate("userId", "fullName email").sort({ createdAt: -1 });
  res.json({ success: true, data });
}

export async function getUserLicenses(req, res) {
  const data = await License.find({ userId: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, data });
}

export async function updateLicense(req, res) {
  const id = req.params.licenseId || req.params.id;
  const data = await License.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data });
}

export async function deleteLicense(req, res) {
  const id = req.params.licenseId || req.params.id;
  await License.findByIdAndDelete(id);
  res.json({ success: true });
}

export async function sendMessageToUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const { subject, message } = req.body;
  await sendSimpleEmail({
    to: user.email, subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7">${message}</div>`,
    text: message
  });
  await Notification.create({ userId: user._id, title: subject, message, type: "admin_message" });
  res.json({ success: true, message: "Email sent" });
}

export async function sendBulkMessageToUsers(req, res) {
  const { subject, message } = req.body;
  const users = await User.find({ status: "active" }, "email _id");
  const recipients = users.map((u) => u.email).filter(Boolean);
  await sendBulkEmail({
    recipients, subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7">${message}</div>`,
    text: message
  });
  if (users.length) {
    await Notification.insertMany(users.map(u => ({ userId: u._id, title: subject, message, type: "admin_message" })));
  }
  res.json({ success: true, message: "Bulk email sent", count: recipients.length });
}

export async function getMessages(req, res) {
  const data = await SupportMessage.find().sort({ createdAt: -1 });
  res.json({ success: true, data });
}

export async function resolveMessage(req, res) {
  const data = await SupportMessage.findByIdAndUpdate(
    req.params.messageId,
    { status: "resolved", resolvedAt: new Date(), adminNotes: req.body.adminNotes || "" },
    { new: true }
  );
  res.json({ success: true, data });
}

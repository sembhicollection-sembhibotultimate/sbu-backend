import bcrypt from "bcryptjs";
import User from "../models/User.js";
import License from "../models/License.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";
import { sendCustomMessage, sendLicenseIssuedEmail } from "../services/emailService.js";

function portalUrl() {
  return process.env.PORTAL_URL || process.env.STRIPE_BILLING_PORTAL_RETURN_URL || "https://sembhibotultimate.com/portal.html";
}

export async function getUsers(req, res) {
  const data = await User.find().sort({ createdAt: -1 }).select("-passwordHash");
  res.json({ success: true, data });
}

export async function getUserDetails(req, res) {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const licenses = await License.find({ userId: user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { user, licenses } });
}

export async function updateUser(req, res) {
  const update = { ...req.body };
  delete update.passwordHash;

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
    User.findByIdAndDelete(req.params.id)
  ]);
  res.json({ success: true });
}

export async function createLicenseForUser(req, res) {
  const { plan = "monthly", productName = "Sembhi Bot Ultimate", status = "active", expiresAt = null } = req.body || {};
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const data = await License.create({
    userId: req.params.id,
    licenseKey: generateLicenseKey(),
    status,
    plan,
    productName,
    expiresAt
  });

  await sendLicenseIssuedEmail({
    to: user.email,
    fullName: user.fullName,
    licenseKey: data.licenseKey,
    plan,
    portalUrl: portalUrl()
  });

  res.json({ success: true, data });
}

export async function getLicenses(req, res) {
  const data = await License.find().populate("userId", "fullName email phone country status").sort({ createdAt: -1 });
  res.json({ success: true, data });
}

export async function updateLicense(req, res) {
  const data = await License.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!data) return res.status(404).json({ success: false, message: "License not found" });
  res.json({ success: true, data });
}

export async function deleteLicense(req, res) {
  await License.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}

export async function sendMessageToUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const { subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ success: false, message: "Subject and message are required" });

  await sendCustomMessage({
    to: user.email,
    subject,
    messageHtml: `<div style="font-family:Arial,sans-serif;line-height:1.65;"><h2>Sembhi Bot Ultimate</h2><p>Hello ${user.fullName || "Member"},</p><div>${message}</div></div>`
  });

  res.json({ success: true, message: "Message sent" });
}

export async function sendBulkMessage(req, res) {
  const { subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ success: false, message: "Subject and message are required" });

  const users = await User.find({ status: { $ne: "disabled" } }).select("email fullName");
  for (const user of users) {
    await sendCustomMessage({
      to: user.email,
      subject,
      messageHtml: `<div style="font-family:Arial,sans-serif;line-height:1.65;"><h2>Sembhi Bot Ultimate</h2><p>Hello ${user.fullName || "Member"},</p><div>${message}</div></div>`
    });
  }

  res.json({ success: true, message: `Bulk message queued for ${users.length} users` });
}

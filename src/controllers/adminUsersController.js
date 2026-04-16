import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import SupportMessage from "../models/SupportMessage.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";
import {
  sendBulkEmail,
  sendLicenseIssuedEmail,
  sendSimpleEmail
} from "../services/emailService.js";

function mapAgreement(user) {
  return {
    acceptance: user.acceptance || {},
    agreementPdfFileName: user.agreementPdfFileName || "",
    signatureTypedName: user.signatureTypedName || "",
    signatureImage: user.signatureImage || "",
    createdAt: user.createdAt
  };
}

export async function getUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  const licenses = await License.find({}, "userId status plan licenseKey");
  const byUser = new Map();

  for (const lic of licenses) {
    const key = String(lic.userId || "");
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key).push(lic);
  }

  const data = users.map((user) => ({
    ...user.toObject(),
    licenses: byUser.get(String(user._id)) || []
  }));

  res.json({ success: true, data });
}

export async function getUserDetail(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const [licenses, payments, messages] = await Promise.all([
    License.find({ userId: user._id }).sort({ createdAt: -1 }),
    PaymentRecord.find({ userId: user._id }).sort({ createdAt: -1 }),
    SupportMessage.find({ userId: user._id }).sort({ createdAt: -1 })
  ]);

  res.json({
    success: true,
    data: {
      user,
      licenses,
      payments,
      messages,
      agreement: mapAgreement(user)
    }
  });
}

export async function updateUser(req, res) {
  const allowed = ["fullName", "email", "phone", "country", "address", "plan", "status", "couponUsed"];
  const body = {};
  for (const key of allowed) {
    if (key in req.body) body[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true
  });

  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  res.json({ success: true, data: user });
}

export async function toggleUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.status = user.status === "active" ? "inactive" : "active";
  await user.save();

  await License.updateMany(
    { userId: user._id },
    { $set: { status: user.status === "active" ? "active" : "inactive" } }
  );

  res.json({ success: true, data: user });
}

export async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  await Promise.all([
    License.deleteMany({ userId: user._id }),
    PaymentRecord.deleteMany({ userId: user._id }),
    SupportMessage.deleteMany({ userId: user._id }),
    User.findByIdAndDelete(user._id)
  ]);

  res.json({ success: true, message: "User deleted" });
}

export async function createLicenseForUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const {
    productName = "Sembhi Bot Ultimate",
    plan = user.plan || "monthly",
    sendEmail = true
  } = req.body || {};

  const validFrom = new Date();
  const validUntil = new Date(validFrom);
  validUntil.setMonth(validUntil.getMonth() + 1);

  const license = await License.create({
    userId: user._id,
    email: user.email,
    licenseKey: generateLicenseKey("SBU"),
    productName,
    plan,
    status: "active",
    activatedDevices: 0,
    maxDevices: 1,
    machineId: "",
    machineName: "",
    validFrom,
    validUntil,
    hwid: ""
  });

  user.status = "active";
  await user.save();

  if (sendEmail && user.email) {
    await sendLicenseIssuedEmail({
      to: user.email,
      fullName: user.fullName,
      licenseKey: license.licenseKey,
      plan,
      portalUrl: process.env.PORTAL_URL || "https://sembhibotultimate.com/portal.html"
    });
  }

  res.json({ success: true, data: license });
}

export async function getUserLicenses(req, res) {
  const licenses = await License.find({ userId: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: licenses });
}

export async function updateLicense(req, res) {
  const allowed = ["status", "plan", "productName", "maxDevices", "validUntil"];
  const body = {};
  for (const key of allowed) {
    if (key in req.body) body[key] = req.body[key];
  }

  const license = await License.findByIdAndUpdate(req.params.licenseId, body, {
    new: true,
    runValidators: true
  });

  if (!license) return res.status(404).json({ success: false, message: "License not found" });
  res.json({ success: true, data: license });
}

export async function deleteLicense(req, res) {
  await License.findByIdAndDelete(req.params.licenseId);
  res.json({ success: true, message: "License deleted" });
}

export async function sendMessageToUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const { subject, message } = req.body;
  await sendSimpleEmail({
    to: user.email,
    subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7">${message}</div>`,
    text: message
  });

  res.json({ success: true, message: "Email sent" });
}

export async function sendBulkMessageToUsers(req, res) {
  const { subject, message } = req.body;
  const users = await User.find({ status: "active" }, "email");
  const recipients = users.map((u) => u.email).filter(Boolean);

  await sendBulkEmail({
    recipients,
    subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7">${message}</div>`,
    text: message
  });

  res.json({ success: true, message: "Bulk email sent", count: recipients.length });
}

export async function getSupportMessages(req, res) {
  const messages = await SupportMessage.find().sort({ createdAt: -1 });
  res.json({ success: true, data: messages });
}

export async function resolveSupportMessage(req, res) {
  const message = await SupportMessage.findById(req.params.messageId);
  if (!message) return res.status(404).json({ success: false, message: "Message not found" });

  message.status = "resolved";
  message.resolvedAt = new Date();
  message.adminNotes = req.body.adminNotes || message.adminNotes;
  await message.save();

  res.json({ success: true, data: message });
}

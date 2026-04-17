import bcrypt from "bcryptjs";
import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import SupportMessage from "../models/SupportMessage.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";
import { sendBulkEmail, sendLicenseIssuedEmail, sendSimpleEmail } from "../services/emailService.js";

export async function getUsers(req, res) {
  const data = await User.find().sort({ createdAt: -1 }).select("-passwordHash");
  res.json({ success: true, data });
}

export async function getUserDetail(req, res) {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const [licenses, payments, messages] = await Promise.all([
    License.find({ userId: user._id }).sort({ createdAt: -1 }),
    PaymentRecord.find({ userId: user._id }).sort({ createdAt: -1 }),
    SupportMessage.find({ userId: user._id }).sort({ createdAt: -1 })
  ]);

  const acceptance = user.acceptance || {};
  res.json({
    success: true,
    data: {
      user,
      licenses,
      payments,
      messages,
      agreement: {
        acceptance: {
          terms: acceptance.termsAccepted,
          privacy: acceptance.privacyAccepted,
          refund: acceptance.refundAccepted,
          risk: acceptance.riskAccepted,
          acceptedAt: acceptance.acceptedAt,
          ip: acceptance.ipAddress,
          userAgent: acceptance.userAgent
        },
        signatureTypedName: acceptance.signatureTypedName || "",
        signatureImage: acceptance.signatureDataUrl || "",
        createdAt: user.createdAt
      }
    }
  });
}

export async function updateUser(req, res) {
  const update = { ...req.body };
  delete update.passwordHash;

  if (update.password) {
    update.passwordHash = await bcrypt.hash(update.password, 10);
    delete update.password;
  }

  const data = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true
  }).select("-passwordHash");
  res.json({ success: true, data });
}

export async function toggleUserStatus(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const nextStatus = user.status === "active" ? "inactive" : "active";
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
    User.findByIdAndDelete(req.params.id)
  ]);
  res.json({ success: true });
}

export async function createLicenseForUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const { plan = user.plan || "monthly", productName = "Sembhi Bot Ultimate", sendEmail = true } = req.body || {};
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const data = await License.create({
    userId: req.params.id,
    licenseKey: generateLicenseKey("SBU"),
    productName,
    status: "active",
    plan,
    hwid: "",
    expiresAt
  });

  user.status = "active";
  await user.save();

  if (sendEmail && user.email) {
    await sendLicenseIssuedEmail({
      to: user.email,
      fullName: user.fullName,
      licenseKey: data.licenseKey,
      plan,
      portalUrl: process.env.PORTAL_URL || "https://sembhibotultimate.com/portal.html"
    });
  }

  res.json({ success: true, data });
}

export async function getLicenses(req, res) {
  const data = await License.find().sort({ createdAt: -1 });
  res.json({ success: true, data });
}

export async function getUserLicenses(req, res) {
  const data = await License.find({ userId: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, data });
}

export async function updateLicense(req, res) {
  const data = await License.findByIdAndUpdate(req.params.licenseId || req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  res.json({ success: true, data });
}

export async function deleteLicense(req, res) {
  await License.findByIdAndDelete(req.params.licenseId || req.params.id);
  res.json({ success: true });
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

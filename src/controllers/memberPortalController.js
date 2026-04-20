import bcrypt from "bcryptjs";
import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import SupportMessage from "../models/SupportMessage.js";
import DownloadItem from "../models/DownloadItem.js";
import LearningVideo from "../models/LearningVideo.js";
import Notification from "../models/Notification.js";
import { sendSimpleEmail } from "../services/emailService.js";

function normalizePhone(phone = "") {
  return String(phone).replace(/\s+/g, "").trim();
}

export async function getPortalData(req, res) {
  const email = (req.query.email || req.headers["x-user-email"] || "").toLowerCase().trim();
  if (!email) return res.status(400).json({ success: false, message: "Email required" });
  const user = await User.findOne({ email }).select("-passwordHash");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const [licenses, payments, downloads, videos, messages, notifications] = await Promise.all([
    License.find({ userId: user._id }).sort({ createdAt: -1 }),
    PaymentRecord.find({ userId: user._id }).sort({ createdAt: -1 }),
    DownloadItem.find({ enabled: true }).sort({ sortOrder: 1, createdAt: 1 }),
    LearningVideo.find({ enabled: true }).sort({ sortOrder: 1, createdAt: 1 }),
    SupportMessage.find({ userId: user._id }).sort({ createdAt: -1 }),
    Notification.find({ userId: user._id }).sort({ createdAt: -1 })
  ]);

  res.json({ success: true, data: { user, licenses, payments, downloads, videos, messages, notifications } });
}

export async function updatePortalProfile(req, res) {
  const email = (req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const newPhone = normalizePhone(req.body.phone || "");
  if (newPhone) {
    const existingByPhone = await User.findOne({ phone: newPhone, _id: { $ne: user._id } });
    if (existingByPhone) {
      return res.status(400).json({ success: false, message: "This mobile number is already registered" });
    }
    user.phone = newPhone;
  }

  ["fullName","country","address"].forEach(key => { if (key in req.body) user[key] = req.body[key]; });
  if (req.body.password && String(req.body.password).trim()) {
    user.passwordHash = await bcrypt.hash(String(req.body.password).trim(), 10);
  }
  await user.save();

  res.json({ success: true, data: { fullName: user.fullName, phone: user.phone, address: user.address, country: user.country } });
}

export async function updateAvatar(req, res) {
  const email = (req.body.email || req.query.email || "").toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (!req.file) return res.status(400).json({ success: false, message: "Image file required" });
  user.avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  await user.save();
  res.json({ success: true, data: { avatarUrl: user.avatarUrl } });
}

export async function createSupportMessage(req, res) {
  const { email, subject, message, type = "general" } = req.body;
  const cleanEmail = email?.toLowerCase().trim();
  const user = await User.findOne({ email: cleanEmail });

  const doc = await SupportMessage.create({
    userId: user?._id || null,
    email: cleanEmail,
    fullName: user?.fullName || "",
    subject,
    message,
    type
  });

  await sendSimpleEmail({
    to: process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || process.env.EMAIL_USER,
    subject: `New member message: ${subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7">
        <h3>New member message</h3>
        <p><strong>Name:</strong> ${user?.fullName || ""}</p>
        <p><strong>Email:</strong> ${cleanEmail}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div><strong>Message:</strong><br>${message}</div>
      </div>
    `
  });

  res.json({ success: true, data: doc });
}

export async function markNotificationRead(req, res) {
  const data = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  res.json({ success: true, data });
}

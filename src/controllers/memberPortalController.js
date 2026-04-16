import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import SupportMessage from "../models/SupportMessage.js";
import DownloadItem from "../models/DownloadItem.js";
import LearningVideo from "../models/LearningVideo.js";
import { sendAdminNotificationEmail } from "../services/emailService.js";

export async function getMemberPortal(req, res) {
  const email = (req.query.email || req.headers["x-user-email"] || "").toLowerCase().trim();
  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  const user = await User.findOne({ email }).select("-passwordHash");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const [licenses, payments, downloads, videos, messages] = await Promise.all([
    License.find({ userId: user._id }).sort({ createdAt: -1 }),
    PaymentRecord.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20),
    DownloadItem.find({ enabled: true }).sort({ sortOrder: 1, createdAt: 1 }),
    LearningVideo.find({ enabled: true }).sort({ sortOrder: 1, createdAt: 1 }),
    SupportMessage.find({ userId: user._id }).sort({ createdAt: -1 })
  ]);

  res.json({ success: true, data: { user, licenses, payments, downloads, videos, messages } });
}

export async function updateMemberProfile(req, res) {
  const email = (req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ email }).select("-passwordHash");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.fullName = req.body.fullName ?? user.fullName;
  user.phone = req.body.phone ?? user.phone;
  user.address = req.body.address ?? user.address;
  user.country = req.body.country ?? user.country;
  await user.save();

  res.json({ success: true, data: user });
}

export async function createPortalMessage(req, res) {
  const email = (req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ email });

  const doc = await SupportMessage.create({
    userId: user?._id || null,
    email,
    fullName: user?.fullName || "",
    subject: req.body.subject || "Portal message",
    message: req.body.message || "",
    type: req.body.type || "general"
  });

  await sendAdminNotificationEmail({
    subject: `New member message: ${doc.subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7">
        <h3>New member message</h3>
        <p><strong>Name:</strong> ${doc.fullName || ""}</p>
        <p><strong>Email:</strong> ${doc.email}</p>
        <p><strong>Type:</strong> ${doc.type}</p>
        <p><strong>Subject:</strong> ${doc.subject}</p>
        <div>${doc.message}</div>
      </div>
    `
  });

  res.json({ success: true, data: doc });
}

export async function seedPortalResources(req, res) {
  const downloads = [
    { title: "Download Bot Files", description: "Main product download package", url: "/downloads/sbu-bot.zip", sortOrder: 1, enabled: true },
    { title: "Setup Guide", description: "Step-by-step installation guide", url: "/downloads/setup-guide.pdf", sortOrder: 2, enabled: true },
    { title: "Release Notes", description: "Latest changes and updates", url: "/downloads/release-notes.pdf", sortOrder: 3, enabled: true }
  ];
  const videos = [
    { title: "Getting Started", description: "Portal and installation walkthrough", url: "https://www.youtube.com/", sortOrder: 1, enabled: true },
    { title: "License Setup", description: "How to activate your bot license", url: "https://www.youtube.com/", sortOrder: 2, enabled: true },
    { title: "Risk and Workflow", description: "Educational workflow overview", url: "https://www.youtube.com/", sortOrder: 3, enabled: true }
  ];

  for (const item of downloads) {
    await DownloadItem.updateOne({ title: item.title }, { $setOnInsert: item }, { upsert: true });
  }
  for (const item of videos) {
    await LearningVideo.updateOne({ title: item.title }, { $setOnInsert: item }, { upsert: true });
  }

  res.json({ success: true, message: "Portal resources seeded" });
}

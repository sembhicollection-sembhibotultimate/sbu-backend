import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import SupportMessage from "../models/SupportMessage.js";
import DownloadItem from "../models/DownloadItem.js";
import LearningVideo from "../models/LearningVideo.js";
import { sendAdminNotificationEmail } from "../services/emailService.js";

export async function getPortalData(req, res) {
  const email = req.query.email || req.headers["x-user-email"];
  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const [licenses, payments, downloads, videos, messages] = await Promise.all([
    License.find({ userId: user._id }).sort({ createdAt: -1 }),
    PaymentRecord.find({ userId: user._id }).sort({ createdAt: -1 }),
    DownloadItem.find({ enabled: true }).sort({ sortOrder: 1, createdAt: 1 }),
    LearningVideo.find({ enabled: true }).sort({ sortOrder: 1, createdAt: 1 }),
    SupportMessage.find({ userId: user._id }).sort({ createdAt: -1 })
  ]);

  res.json({
    success: true,
    data: { user, licenses, payments, downloads, videos, messages }
  });
}

export async function updatePortalProfile(req, res) {
  const email = req.body.email;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const allowed = ["fullName", "phone", "country", "address"];
  for (const key of allowed) {
    if (key in req.body) user[key] = req.body[key];
  }
  await user.save();

  res.json({ success: true, data: user });
}

export async function createSupportMessage(req, res) {
  const { email, subject, message, type = "general" } = req.body;
  const user = await User.findOne({ email });

  const doc = await SupportMessage.create({
    userId: user?._id || null,
    email,
    fullName: user?.fullName || "",
    subject,
    message,
    type
  });

  await sendAdminNotificationEmail({
    subject: `New member message: ${subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7">
        <h3>New member message</h3>
        <p><strong>Name:</strong> ${user?.fullName || ""}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div>${message}</div>
      </div>
    `
  });

  res.json({ success: true, data: doc });
}

export async function seedMemberResources(req, res) {
  const downloads = [
    {
      title: "Download Bot Files",
      description: "Main product download package",
      url: "/downloads/sbu-bot.zip",
      sortOrder: 1,
      enabled: true
    },
    {
      title: "Setup Guide",
      description: "Step-by-step installation guide",
      url: "/downloads/setup-guide.pdf",
      sortOrder: 2,
      enabled: true
    },
    {
      title: "Release Notes",
      description: "Latest changes and updates",
      url: "/downloads/release-notes.pdf",
      sortOrder: 3,
      enabled: true
    }
  ];

  const videos = [
    {
      title: "Getting Started",
      description: "Portal and installation walkthrough",
      url: "https://www.youtube.com/",
      sortOrder: 1,
      enabled: true
    },
    {
      title: "License Setup",
      description: "How to activate your bot license",
      url: "https://www.youtube.com/",
      sortOrder: 2,
      enabled: true
    },
    {
      title: "Risk and Workflow",
      description: "Educational workflow overview",
      url: "https://www.youtube.com/",
      sortOrder: 3,
      enabled: true
    }
  ];

  await Promise.all(downloads.map((item) => DownloadItem.updateOne(
    { title: item.title },
    { $setOnInsert: item },
    { upsert: true }
  )));

  await Promise.all(videos.map((item) => LearningVideo.updateOne(
    { title: item.title },
    { $setOnInsert: item },
    { upsert: true }
  )));

  res.json({ success: true, message: "Member resources seeded" });
}

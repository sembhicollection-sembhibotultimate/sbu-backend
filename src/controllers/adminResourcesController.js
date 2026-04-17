import path from "path";
import DownloadItem from "../models/DownloadItem.js";
import LearningVideo from "../models/LearningVideo.js";

function fileUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

export async function getDownloads(req, res) {
  const items = await DownloadItem.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data: items });
}

export async function createDownload(req, res) {
  const body = req.body || {};
  const url = req.file ? fileUrl(req, req.file.filename) : body.url;
  const fileName = req.file ? req.file.originalname : "";
  const item = await DownloadItem.create({
    title: body.title,
    description: body.description || "",
    url,
    fileName,
    sortOrder: Number(body.sortOrder || 1),
    enabled: String(body.enabled) !== "false"
  });
  res.json({ success: true, data: item });
}

export async function updateDownload(req, res) {
  const body = req.body || {};
  const update = {
    title: body.title,
    description: body.description || "",
    sortOrder: Number(body.sortOrder || 1),
    enabled: String(body.enabled) !== "false"
  };
  if (req.file) {
    update.url = fileUrl(req, req.file.filename);
    update.fileName = req.file.originalname;
  } else if (body.url) {
    update.url = body.url;
  }

  const item = await DownloadItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: "Download not found" });
  res.json({ success: true, data: item });
}

export async function deleteDownload(req, res) {
  await DownloadItem.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Download deleted" });
}

export async function getVideos(req, res) {
  const items = await LearningVideo.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data: items });
}

export async function createVideo(req, res) {
  const body = req.body || {};
  const item = await LearningVideo.create({
    title: body.title,
    description: body.description || "",
    url: body.url,
    thumbnailUrl: body.thumbnailUrl || "",
    sortOrder: Number(body.sortOrder || 1),
    enabled: String(body.enabled) !== "false"
  });
  res.json({ success: true, data: item });
}

export async function updateVideo(req, res) {
  const body = req.body || {};
  const item = await LearningVideo.findByIdAndUpdate(req.params.id, {
    title: body.title,
    description: body.description || "",
    url: body.url,
    thumbnailUrl: body.thumbnailUrl || "",
    sortOrder: Number(body.sortOrder || 1),
    enabled: String(body.enabled) !== "false"
  }, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: "Video not found" });
  res.json({ success: true, data: item });
}

export async function deleteVideo(req, res) {
  await LearningVideo.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Video deleted" });
}

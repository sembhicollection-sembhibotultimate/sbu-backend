import ReviewItem from "../models/ReviewItem.js";

export async function getPublicReviews(req, res) {
  const items = await ReviewItem.find({ enabled: true }).sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, data: items });
}

export async function getAdminReviews(req, res) {
  const items = await ReviewItem.find().sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, data: items });
}

export async function createReview(req, res) {
  const item = await ReviewItem.create(req.body);
  res.json({ success: true, data: item });
}

export async function updateReview(req, res) {
  const item = await ReviewItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: "Review not found" });
  res.json({ success: true, data: item });
}

export async function deleteReview(req, res) {
  await ReviewItem.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Review deleted" });
}

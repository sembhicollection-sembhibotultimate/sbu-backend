import OfferCard from "../models/OfferCard.js";

export async function getOffers(req, res) {
  const data = await OfferCard.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data });
}

export async function createOffer(req, res) {
  const data = await OfferCard.create(req.body);
  res.json({ success: true, data });
}

export async function updateOffer(req, res) {
  const data = await OfferCard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data });
}

export async function deleteOffer(req, res) {
  await OfferCard.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}

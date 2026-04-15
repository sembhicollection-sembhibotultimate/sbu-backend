import OfferCard from "../models/OfferCard.js";

export const getOffers = async (req, res) => {
  const offers = await OfferCard.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data: offers });
};

export const createOffer = async (req, res) => {
  const offer = await OfferCard.create(req.body);
  res.json({ success: true, data: offer });
};

export const updateOffer = async (req, res) => {
  const offer = await OfferCard.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  res.json({ success: true, data: offer });
};

export const deleteOffer = async (req, res) => {
  await OfferCard.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Offer deleted" });
};

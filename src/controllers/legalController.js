import LegalDocument from "../models/LegalDocument.js";

export async function getLegalDocs(req, res) {
  const docs = await LegalDocument.find({ enabled: true }).sort({ createdAt: 1 });
  res.json({ success: true, data: docs });
}

export async function getLegalDoc(req, res) {
  const doc = await LegalDocument.findOne({ slug: req.params.slug });
  if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
  res.json({ success: true, data: doc });
}

export async function updateLegalDoc(req, res) {
  const doc = await LegalDocument.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc });
}

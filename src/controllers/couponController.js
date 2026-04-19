import Coupon from "../models/Coupon.js";

function toCouponPayload(body) {
  return {
    title: body.title?.trim() || "",
    code: body.code?.trim().toUpperCase() || "",
    description: body.description?.trim() || "",
    discountType: body.discountType === "fixed" ? "fixed" : "percent",
    discountValue: Number(body.discountValue || 0),
    appliesTo: body.appliesTo?.trim() || "monthly",
    usageLimit: Number(body.usageLimit || 0),
    startDate: body.startDate ? new Date(body.startDate) : new Date(),
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    active: String(body.active) === "false" ? false : true,
    showOnHomepage: String(body.showOnHomepage) === "false" ? false : true,
    showCountdown: String(body.showCountdown) === "false" ? false : true,
    badgeText: body.badgeText?.trim() || "",
    offerLine: body.offerLine?.trim() || ""
  };
}

function serializeCoupon(coupon) {
  const now = new Date();
  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
  const msLeft = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  return {
    ...coupon.toObject(),
    isExpired: expiresAt ? expiresAt <= now : false,
    daysLeft
  };
}

export async function getCoupons(req, res) {
  const items = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: items.map(serializeCoupon) });
}

export async function createCoupon(req, res) {
  const payload = toCouponPayload(req.body);
  if (!payload.title || !payload.code || !payload.expiresAt) {
    return res.status(400).json({ success: false, message: "Title, code, and expiry are required" });
  }
  const item = await Coupon.create(payload);
  res.json({ success: true, data: serializeCoupon(item) });
}

export async function updateCoupon(req, res) {
  const payload = toCouponPayload(req.body);
  const item = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: "Coupon not found" });
  res.json({ success: true, data: serializeCoupon(item) });
}

export async function deleteCoupon(req, res) {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Coupon deleted" });
}

export async function validateCoupon(req, res) {
  const code = (req.body.code || "").trim().toUpperCase();
  const plan = req.body.plan || "monthly";
  const amount = Number(req.body.amount || 149);

  if (!code) {
    return res.json({
      success: true,
      message: "No coupon entered. Regular price will apply.",
      valid: true,
      finalAmount: amount,
      discountAmount: 0
    });
  }

  const coupon = await Coupon.findOne({ code });
  if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
  if (!coupon.active) return res.status(400).json({ success: false, message: "Coupon is inactive" });
  if (coupon.appliesTo && coupon.appliesTo !== plan) return res.status(400).json({ success: false, message: "Coupon does not apply to this plan" });

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) return res.status(400).json({ success: false, message: "Coupon is not active yet" });
  if (coupon.expiresAt && now > coupon.expiresAt) return res.status(400).json({ success: false, message: "Coupon has expired" });
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: "Coupon usage limit reached" });

  let discountAmount = 0;
  if (coupon.discountType === "percent") discountAmount = (amount * coupon.discountValue) / 100;
  else discountAmount = coupon.discountValue;

  const finalAmount = Math.max(0, Number((amount - discountAmount).toFixed(2)));

  res.json({
    success: true,
    valid: true,
    message: "Coupon applied successfully",
    data: serializeCoupon(coupon),
    finalAmount,
    discountAmount: Number(discountAmount.toFixed(2))
  });
}

export async function getHomepageOffer(req, res) {
  const now = new Date();
  const coupon = await Coupon.findOne({
    active: true,
    showOnHomepage: true,
    startDate: { $lte: now },
    expiresAt: { $gte: now }
  }).sort({ expiresAt: 1, createdAt: -1 });

  if (!coupon) return res.json({ success: true, data: null });
  res.json({ success: true, data: serializeCoupon(coupon) });
}

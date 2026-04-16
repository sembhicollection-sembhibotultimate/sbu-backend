import Coupon from "../models/Coupon.js";

function applyCoupon(coupon, amount) {
  if (!coupon) return { discountAmount: 0, finalAmount: amount };
  const discountAmount = coupon.type === "percent" ? (amount * coupon.value) / 100 : coupon.value;
  return { discountAmount, finalAmount: Math.max(0, amount - discountAmount) };
}

export async function getCoupons(req, res) {
  const data = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data });
}

export async function createCoupon(req, res) {
  const data = await Coupon.create(req.body);
  res.json({ success: true, data });
}

export async function updateCoupon(req, res) {
  const data = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data });
}

export async function deleteCoupon(req, res) {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}

export async function validateCoupon(req, res) {
  const { code = "", plan = "monthly", amount = 149 } = req.body || {};
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return res.json({
      success: true,
      valid: true,
      message: "No coupon applied",
      originalAmount: amount,
      finalAmount: amount,
      discountAmount: 0
    });
  }

  const coupon = await Coupon.findOne({ code: normalized, active: true });
  if (!coupon) return res.status(404).json({ success: false, valid: false, message: "Invalid coupon code" });
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ success: false, valid: false, message: "Coupon expired" });
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, valid: false, message: "Coupon usage limit reached" });
  if (!coupon.appliesTo.includes(plan)) return res.status(400).json({ success: false, valid: false, message: "Coupon not valid for this plan" });

  const calc = applyCoupon(coupon, amount);
  return res.json({
    success: true,
    valid: true,
    message: "Coupon applied successfully",
    originalAmount: amount,
    finalAmount: calc.finalAmount,
    discountAmount: calc.discountAmount,
    coupon
  });
}

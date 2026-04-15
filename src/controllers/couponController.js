import Coupon from "../models/Coupon.js";
import { resolveCoupon } from "../services/couponService.js";

export const getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: coupons });
};

export const createCoupon = async (req, res) => {
  const payload = { ...req.body };
  if (payload.code) payload.code = payload.code.toUpperCase().trim();
  const coupon = await Coupon.create(payload);
  res.json({ success: true, data: coupon });
};

export const updateCoupon = async (req, res) => {
  const payload = { ...req.body };
  if (payload.code) payload.code = payload.code.toUpperCase().trim();
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });
  res.json({ success: true, data: coupon });
};

export const deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Coupon deleted" });
};

export const validateCoupon = async (req, res) => {
  const { code, plan = "monthly", amount = 149 } = req.body;
  const result = await resolveCoupon({ code, plan, amount });

  if (!result.valid) {
    return res.status(400).json({ success: false, valid: false, message: result.message });
  }

  res.json({
    success: true,
    valid: true,
    message: result.coupon ? "Coupon applied successfully" : "No coupon applied",
    originalAmount: result.originalAmount,
    finalAmount: result.finalAmount,
    discountAmount: result.discountAmount,
    coupon: result.coupon
  });
};

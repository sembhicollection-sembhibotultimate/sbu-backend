import Coupon from "../models/Coupon.js";

export async function resolveCoupon({ code, plan = "monthly", amount = 149 }) {
  if (!code || !code.trim()) {
    return {
      valid: true,
      originalAmount: amount,
      finalAmount: amount,
      discountAmount: 0,
      coupon: null
    };
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: "Coupon expired" };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: "Coupon usage limit reached" };
  }

  if (!coupon.appliesTo.includes(plan)) {
    return { valid: false, message: "Coupon not valid for this plan" };
  }

  const discountAmount =
    coupon.type === "percent"
      ? (amount * coupon.value) / 100
      : coupon.value;

  return {
    valid: true,
    originalAmount: amount,
    finalAmount: Math.max(0, amount - discountAmount),
    discountAmount,
    coupon
  };
}

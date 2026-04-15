import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import PaymentRecord from "../models/PaymentRecord.js";
import { getStripe } from "../services/stripeService.js";

function applyCoupon(coupon, amount) {
  if (!coupon) return { amount, discount: 0 };
  const discount = coupon.type === "percent" ? (amount * coupon.value) / 100 : coupon.value;
  return { amount: Math.max(0, amount - discount), discount };
}

export async function createCheckoutSession(req, res) {
  const { email, plan = "monthly", couponCode = "" } = req.body || {};
  const stripe = getStripe();

  if (!stripe || !process.env.STRIPE_PRICE_MONTHLY) {
    return res.status(400).json({ success: false, message: "Stripe not configured" });
  }

  let amount = 149;
  let coupon = null;
  const normalizedCoupon = couponCode.trim().toUpperCase();

  if (normalizedCoupon) {
    coupon = await Coupon.findOne({ code: normalizedCoupon, active: true });
  }

  const calc = applyCoupon(coupon, amount);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: process.env.STRIPE_PRICE_MONTHLY, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${process.env.STRIPE_BILLING_PORTAL_RETURN_URL}?checkout=success`,
    cancel_url: `${process.env.STRIPE_BILLING_PORTAL_RETURN_URL}?checkout=cancelled`,
    metadata: {
      email,
      plan,
      couponCode: normalizedCoupon,
      previewFinalAmount: String(calc.amount)
    }
  });

  await PaymentRecord.create({
    customerEmail: email,
    stripeSessionId: session.id,
    amount: calc.amount,
    currency: "usd",
    plan,
    couponCode: normalizedCoupon,
    paymentStatus: "pending"
  });

  res.json({ success: true, url: session.url });
}

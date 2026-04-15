import PaymentRecord from "../models/PaymentRecord.js";
import User from "../models/User.js";
import { resolveCoupon } from "../services/couponService.js";
import stripe from "../services/stripeService.js";

const PLAN_CONFIG = {
  monthly: {
    amount: 149,
    label: "Sembhi Bot Ultimate Monthly"
  }
};

export const createCheckoutSession = async (req, res) => {
  const {
    email = "",
    fullName = "",
    plan = "monthly",
    couponCode = ""
  } = req.body;

  const selectedPlan = PLAN_CONFIG[plan] || PLAN_CONFIG.monthly;
  const amount = selectedPlan.amount;

  const couponResult = await resolveCoupon({ code: couponCode, plan, amount });
  if (!couponResult.valid) {
    return res.status(400).json({ success: false, message: couponResult.message });
  }

  const finalAmount = couponResult.finalAmount;
  const normalizedEmail = email.toLowerCase().trim();
  const user = normalizedEmail ? await User.findOne({ email: normalizedEmail }) : null;

  const record = await PaymentRecord.create({
    customerEmail: normalizedEmail,
    paymentStatus: "pending",
    amount: finalAmount,
    currency: "usd",
    plan,
    couponCode: couponCode?.trim().toUpperCase() || "",
    userId: user?._id || null
  });

  if (!stripe || !process.env.STRIPE_PRICE_MONTHLY) {
    return res.json({
      success: true,
      mode: "placeholder",
      message: "Stripe keys are not configured yet. Backend flow is ready.",
      data: {
        checkoutUrl: "#",
        paymentRecordId: record._id,
        finalAmount
      }
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: normalizedEmail || undefined,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_MONTHLY,
        quantity: 1
      }
    ],
    metadata: {
      fullName,
      email: normalizedEmail,
      plan,
      couponCode: couponCode?.trim().toUpperCase() || "",
      paymentRecordId: String(record._id),
      userId: user?._id ? String(user._id) : ""
    },
    success_url: `${process.env.FRONTEND_URL}/portal.html?checkout=success`,
    cancel_url: `${process.env.FRONTEND_URL}/signup.html?checkout=cancelled`
  });

  record.stripeSessionId = session.id;
  await record.save();

  res.json({
    success: true,
    data: {
      checkoutUrl: session.url,
      paymentRecordId: record._id,
      finalAmount
    }
  });
};

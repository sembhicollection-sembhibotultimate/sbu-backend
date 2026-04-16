import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import { getStripe } from "../services/stripeService.js";

export async function getPortalSummary(req, res) {
  const [user, licenses, payments] = await Promise.all([
    User.findById(req.user.userId).select("-passwordHash"),
    License.find({ userId: req.user.userId }).sort({ createdAt: -1 }),
    PaymentRecord.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(10)
  ]);

  res.json({ success: true, data: { user, licenses, payments } });
}

export async function updateProfile(req, res) {
  const { fullName, phone, address, country } = req.body || {};
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { fullName, phone, address, country },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  res.json({ success: true, data: user });
}

export async function cancelSubscription(req, res) {
  const user = await User.findById(req.user.userId);
  const stripe = getStripe();

  if (stripe && user?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (error) {
      console.warn("Stripe cancel warning:", error.message);
    }
  }

  await Promise.all([
    User.findByIdAndUpdate(req.user.userId, { status: "inactive" }),
    License.updateMany({ userId: req.user.userId }, { status: "inactive" })
  ]);

  res.json({ success: true, message: "Subscription cancelled. Billing stopped and license disabled." });
}

export async function resumeSubscription(req, res) {
  const user = await User.findById(req.user.userId);
  const stripe = getStripe();

  if (stripe && process.env.STRIPE_PRICE_MONTHLY) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_MONTHLY, quantity: 1 }],
      success_url: `${process.env.STRIPE_BILLING_PORTAL_RETURN_URL}?resumed=1`,
      cancel_url: `${process.env.STRIPE_BILLING_PORTAL_RETURN_URL}?resume_cancelled=1`,
      customer_email: user.email,
      metadata: { userId: String(user._id), action: "resume" }
    });

    return res.json({ success: true, checkoutUrl: session.url });
  }

  res.json({ success: false, message: "Stripe resume flow not configured yet" });
}

export async function createBillingPortal(req, res) {
  const user = await User.findById(req.user.userId);
  const stripe = getStripe();

  if (!stripe || !user?.stripeCustomerId) {
    return res.status(400).json({ success: false, message: "Billing portal not available" });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: process.env.STRIPE_BILLING_PORTAL_RETURN_URL
  });

  res.json({ success: true, url: session.url });
}

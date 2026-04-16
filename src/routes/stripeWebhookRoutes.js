import express from "express";
import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import Coupon from "../models/Coupon.js";
import { getStripe } from "../services/stripeService.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";
import { sendLicenseIssuedEmail } from "../services/emailService.js";

const router = express.Router();

router.get("/webhook", (req, res) => {
  res.json({ success: true, message: "Stripe webhook endpoint is ready. Stripe must call this route with POST." });
});

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send("Stripe webhook not configured");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email || session.metadata?.email;
      let user = await User.findOne({ email });

      if (user) {
        user.stripeCustomerId = session.customer || user.stripeCustomerId;
        user.status = "active";
        if (session.subscription) user.stripeSubscriptionId = session.subscription;
        await user.save();

        let license = await License.findOne({ userId: user._id }).sort({ createdAt: -1 });
        if (!license) {
          license = await License.create({
            userId: user._id,
            licenseKey: generateLicenseKey(),
            status: "active",
            plan: user.plan,
            productName: "Sembhi Bot Ultimate"
          });
        } else {
          license.status = "active";
          license.plan = user.plan || license.plan;
          await license.save();
        }

        const rec = await PaymentRecord.findOne({ stripeSessionId: session.id });
        if (rec) {
          rec.userId = user._id;
          rec.customerEmail = email;
          rec.stripeCustomerId = session.customer || "";
          rec.stripeSubscriptionId = session.subscription || "";
          rec.paymentStatus = "paid";
          await rec.save();
        }

        const couponCode = session.metadata?.couponCode?.trim()?.toUpperCase();
        if (couponCode) {
          await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
        }

        await sendLicenseIssuedEmail({
          to: user.email,
          fullName: user.fullName,
          licenseKey: license.licenseKey,
          plan: user.plan,
          portalUrl: process.env.PORTAL_URL || `${process.env.FRONTEND_URL}/portal.html`
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const user = await User.findOne({ stripeSubscriptionId: subscription.id });
      if (user) {
        user.status = "inactive";
        await user.save();
        await License.updateMany({ userId: user._id }, { status: "inactive" });
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      await PaymentRecord.create({
        stripeCustomerId: invoice.customer || "",
        stripeSubscriptionId: invoice.subscription || "",
        amount: Number(invoice.amount_paid || 0) / 100,
        currency: invoice.currency || "usd",
        paymentStatus: "paid"
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Webhook processing error");
  }
});

export default router;

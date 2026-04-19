import express from "express";
import Stripe from "stripe";
import PaymentRecord from "../models/PaymentRecord.js";
import { createOrRenewLicenseFromPayment, deactivateLicenseBySubscriptionId } from "../services/licenseService.js";
import { sendLicenseIssuedEmail } from "../services/emailService.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook signature error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const email = session.customer_details?.email || session.customer_email || session.metadata?.email || "";
        const fullName = session.customer_details?.name || session.metadata?.fullName || "";
        const stripeCustomerId = session.customer || "";
        const stripeSubscriptionId = session.subscription || "";
        const plan = session.metadata?.plan || "monthly";

        const { user, license } = await createOrRenewLicenseFromPayment({
          email, stripeCustomerId, stripeSubscriptionId, plan
        });

        await PaymentRecord.create({
          userId: user._id,
          customerEmail: email,
          stripeSessionId: session.id,
          stripeCustomerId,
          stripeSubscriptionId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || "usd",
          plan,
          couponCode: session.metadata?.couponCode || "",
          paymentStatus: "paid"
        });

        await sendLicenseIssuedEmail({
          to: email,
          fullName,
          licenseKey: license.licenseKey,
          plan,
          portalUrl: process.env.PORTAL_URL || "https://sembhibotultimate.com/portal.html"
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const email = invoice.customer_email || invoice.customer_details?.email || "";
        const stripeCustomerId = invoice.customer || "";
        const stripeSubscriptionId = invoice.subscription || "";
        if (email && stripeSubscriptionId) {
          await createOrRenewLicenseFromPayment({
            email, stripeCustomerId, stripeSubscriptionId, plan: "monthly"
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await deactivateLicenseBySubscriptionId(subscription.id);
        break;
      }

      default:
        break;
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return res.status(500).json({ received: false, message: error.message });
  }
});

router.get("/webhook", (req, res) => {
  res.json({ success: true, message: "Stripe webhook endpoint is ready. Use POST from Stripe." });
});

export default router;

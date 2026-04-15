import express from "express";
import Stripe from "stripe";
import PaymentRecord from "../models/PaymentRecord.js";
import { createOrRenewSubscriptionLicense, deactivateLicenseBySubscriptionId } from "../services/licenseService.js";
import { sendLicenseEmail } from "../services/emailService.js";

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
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          session.metadata?.email ||
          "";
        const fullName = session.customer_details?.name || session.metadata?.fullName || "";
        const stripeCustomerId = session.customer || "";
        const stripeSubscriptionId = session.subscription || "";
        const plan = session.metadata?.plan || "monthly";

        const { user, license } = await createOrRenewSubscriptionLicense({
          email,
          stripeCustomerId,
          stripeSubscriptionId,
          plan
        });

        await PaymentRecord.create({
          userId: user._id,
          customerEmail: email,
          stripeSessionId: session.id,
          stripeCustomerId,
          stripeSubscriptionId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || "usd",
          paymentStatus: "paid"
        });

        await sendLicenseEmail({
          to: email,
          fullName,
          licenseKey: license.licenseKey,
          portalUrl: process.env.PORTAL_URL || "https://sembhibotultimate.com/portal.html"
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const email = invoice.customer_email || invoice.customer_details?.email || "";
        const stripeCustomerId = invoice.customer || "";
        const stripeSubscriptionId = invoice.subscription || "";
        if (stripeSubscriptionId && email) {
          await createOrRenewSubscriptionLicense({
            email,
            stripeCustomerId,
            stripeSubscriptionId,
            plan: "monthly"
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await deactivateLicenseBySubscriptionId(subscription.id);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        if (subscription.status === "canceled" || subscription.cancel_at_period_end) {
          await deactivateLicenseBySubscriptionId(subscription.id);
        }
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

export default router;

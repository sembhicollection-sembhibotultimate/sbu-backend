const express = require('express');
const Stripe = require('stripe');
const User = require('../models/User');
const License = require('../models/License');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const WebhookEvent = require('../models/WebhookEvent');

const {
  findOrCreateUser,
  getActiveOrLatestLicenseByEmail,
  createLicenseForUser,
  renewExistingLicense
} = require('../services/licenseService');

const { sendLicenseEmail } = require('../services/emailService');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getPlanFromStripeObject(obj) {
  const line = obj?.lines?.data?.[0];
  return (
    line?.description ||
    line?.price?.nickname ||
    line?.plan?.nickname ||
    obj?.metadata?.plan ||
    'Monthly'
  );
}

function getInvoiceEmail(invoice) {
  return (
    invoice?.customer_email ||
    invoice?.customer_details?.email ||
    invoice?.receipt_email ||
    ''
  ).toLowerCase().trim();
}

function getValidDaysFromEnv() {
  return Number(
    process.env.DEFAULT_LICENSE_DURATION_DAY ||
    process.env.DEFAULT_LICENSE_DURATION_DAYS ||
    30
  );
}

async function isAlreadyProcessed(stripeEventId) {
  const exists = await WebhookEvent.findOne({ stripeEventId });
  return !!exists;
}

async function markProcessed(stripeEventId, eventType, note = '') {
  await WebhookEvent.create({
    stripeEventId,
    eventType,
    status: 'processed',
    note
  });
}

async function markFailed(stripeEventId, eventType, note = '') {
  await WebhookEvent.findOneAndUpdate(
    { stripeEventId },
    {
      stripeEventId,
      eventType,
      status: 'failed',
      note
    },
    { upsert: true, new: true }
  );
}

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Stripe webhook verify failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (await isAlreadyProcessed(event.id)) {
      return res.json({ received: true, duplicate: true });
    }

    // --------------------------------------------------
    // 1) checkout.session.completed
    // --------------------------------------------------
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const email =
        session?.customer_details?.email?.toLowerCase()?.trim() ||
        session?.customer_email?.toLowerCase()?.trim() ||
        '';

      const name = session?.customer_details?.name || 'User';
      const customerId = session?.customer || '';
      const sessionId = session?.id || '';
      const subscriptionId = session?.subscription || '';
      const amountTotal = session?.amount_total || 0;
      const currency = session?.currency || 'usd';
      const paymentIntentId = session?.payment_intent || '';
      const orderId = `ORD-${Date.now()}`;
      const plan = session?.metadata?.plan || 'Monthly';

      if (!email) {
        await markProcessed(event.id, event.type, 'Skipped checkout event because email missing');
        return res.json({ received: true, skipped: true });
      }

      const user = await findOrCreateUser({
        email,
        name,
        stripeCustomerId: customerId
      });

      const existingCheckoutPayment = await Payment.findOne({
        stripeSessionId: sessionId
      });

      if (!existingCheckoutPayment) {
        await Payment.create({
          userId: user._id,
          email,
          stripeCustomerId: customerId,
          stripeSessionId: sessionId,
          stripePaymentIntentId: paymentIntentId,
          stripeSubscriptionId: subscriptionId,
          stripeEventId: event.id,
          amountTotal,
          currency,
          status: session?.payment_status === 'paid' ? 'paid' : 'pending',
          paymentType: 'checkout',
          plan,
          orderId,
          rawSnapshot: session
        });
      }

      await AuditLog.create({
        eventType: 'checkout_session_completed',
        email,
        status: 'success',
        details: `Stripe checkout completed for ${email}`
      });

      await markProcessed(event.id, event.type, 'checkout session stored');
      return res.json({ received: true });
    }

    // --------------------------------------------------
    // 2) invoice.paid / invoice.payment_succeeded
    // --------------------------------------------------
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;

      const email = getInvoiceEmail(invoice);
      const customerId = invoice?.customer || '';
      const invoiceId = invoice?.id || '';
      const subscriptionId = invoice?.subscription || '';
      const paymentIntentId = invoice?.payment_intent || '';
      const amountTotal = invoice?.amount_paid || 0;
      const currency = invoice?.currency || 'usd';
      const orderId = `ORD-${Date.now()}`;
      const plan = getPlanFromStripeObject(invoice);

      if (!email) {
        await markProcessed(event.id, event.type, 'Skipped invoice paid event because email missing');
        return res.json({ received: true, skipped: true });
      }

      const customerName =
        invoice?.customer_name ||
        invoice?.customer_details?.name ||
        'User';

      const user = await findOrCreateUser({
        email,
        name: customerName,
        stripeCustomerId: customerId
      });

      let license =
        (subscriptionId
          ? await License.findOne({ stripeSubscriptionId: subscriptionId }).sort({ createdAt: -1 })
          : null) ||
        await getActiveOrLatestLicenseByEmail(email);

      const existingInvoicePayment = await Payment.findOne({
        stripeInvoiceId: invoiceId
      });

      if (!existingInvoicePayment) {
        const paymentDoc = await Payment.create({
          userId: user._id,
          email,
          stripeCustomerId: customerId,
          stripeInvoiceId: invoiceId,
          stripePaymentIntentId: paymentIntentId,
          stripeSubscriptionId: subscriptionId,
          stripeEventId: event.id,
          amountTotal,
          currency,
          status: 'paid',
          paymentType: license ? 'subscription_renewal' : 'subscription_initial',
          plan,
          orderId,
          rawSnapshot: invoice
        });

        if (!license) {
          license = await createLicenseForUser({
            user,
            email,
            plan,
            orderId,
            stripeSessionId: subscriptionId || invoiceId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            validDays: getValidDaysFromEnv()
          });

          paymentDoc.licenseId = license._id;
          await paymentDoc.save();

          await AuditLog.create({
            eventType: 'license_auto_created',
            email,
            status: 'success',
            details: `Auto-created license ${license.licenseKey} from invoice ${invoiceId}`
          });

          try {
            await sendLicenseEmail({
              to: email,
              name: user.name || 'User',
              licenseKey: license.licenseKey,
              validUntil: license.validUntil,
              plan: license.plan
            });

            await AuditLog.create({
              eventType: 'email_sent',
              email,
              status: 'success',
              details: `License email sent for ${license.licenseKey}`
            });
          } catch (emailError) {
            console.error('❌ Email send failed:', emailError.message);

            await AuditLog.create({
              eventType: 'email_failed',
              email,
              status: 'failed',
              details: emailError.message
            });
          }
        } else {
          license = await renewExistingLicense({
            license,
            days: getValidDaysFromEnv(),
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripeSessionId: subscriptionId || invoiceId
          });

          paymentDoc.licenseId = license._id;
          await paymentDoc.save();

          await AuditLog.create({
            eventType: 'license_auto_renewed',
            email,
            status: 'success',
            details: `License ${license.licenseKey} renewed from invoice ${invoiceId}`
          });
        }
      }

      await markProcessed(event.id, event.type, 'invoice paid processed');
      return res.json({ received: true });
    }

    // --------------------------------------------------
    // 3) invoice.payment_failed
    // --------------------------------------------------
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const email = getInvoiceEmail(invoice);
      const customerId = invoice?.customer || '';
      const invoiceId = invoice?.id || '';
      const subscriptionId = invoice?.subscription || '';
      const paymentIntentId = invoice?.payment_intent || '';
      const amountTotal = invoice?.amount_due || 0;
      const currency = invoice?.currency || 'usd';
      const plan = getPlanFromStripeObject(invoice);

      if (email) {
        const user = await User.findOne({ email });

        await Payment.findOneAndUpdate(
          { stripeInvoiceId: invoiceId },
          {
            $set: {
              userId: user?._id || null,
              email,
              stripeCustomerId: customerId,
              stripeInvoiceId: invoiceId,
              stripePaymentIntentId: paymentIntentId,
              stripeSubscriptionId: subscriptionId,
              stripeEventId: event.id,
              amountTotal,
              currency,
              status: 'failed',
              paymentType: 'subscription_renewal',
              plan,
              rawSnapshot: invoice
            }
          },
          { upsert: true, new: true }
        );

        await AuditLog.create({
          eventType: 'payment_failed',
          email,
          status: 'failed',
          details: `Stripe payment failed for invoice ${invoiceId}`
        });
      }

      await markProcessed(event.id, event.type, 'invoice payment failed stored');
      return res.json({ received: true });
    }

    // --------------------------------------------------
    // 4) customer.subscription.deleted
    // --------------------------------------------------
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const subscriptionId = subscription?.id || '';

      const license = subscriptionId
        ? await License.findOne({ stripeSubscriptionId: subscriptionId }).sort({ createdAt: -1 })
        : null;

      if (license) {
        license.status = 'inactive';
        await license.save();

        await AuditLog.create({
          eventType: 'subscription_cancelled',
          email: license.email,
          status: 'success',
          details: `License ${license.licenseKey} set inactive after subscription deleted`
        });
      }

      await markProcessed(event.id, event.type, 'subscription deleted processed');
      return res.json({ received: true });
    }

    // --------------------------------------------------
    // others
    // --------------------------------------------------
    await markProcessed(event.id, event.type, 'ignored non-configured event');
    return res.json({ received: true, ignored: true });

  } catch (error) {
    console.error('❌ Webhook handler error:', error.message);

    await markFailed(event?.id || `failed-${Date.now()}`, event?.type || 'unknown', error.message).catch(() => {});

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

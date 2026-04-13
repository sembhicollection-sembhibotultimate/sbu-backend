const express = require('express');
const Stripe = require('stripe');
const User = require('../models/User');
const License = require('../models/License');
const Payment = require('../models/Payment');
const { generateLicenseKey, getLicenseExpiry } = require('../services/licenseService');
const { sendLicenseEmail } = require('../services/emailService');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe webhook verify failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email?.toLowerCase();
    const name = session.customer_details?.name || 'User';
    const customerId = session.customer || '';
    const sessionId = session.id;
    const amountTotal = session.amount_total || 0;
    const currency = session.currency || 'usd';
    const paymentIntentId = session.payment_intent || '';
    const orderId = `ORD-${Date.now()}`;

    if (!email) {
      console.error('No email found in Stripe session');
      return res.json({ received: true });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        stripeCustomerId: customerId
      });
    } else if (!user.stripeCustomerId && customerId) {
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const existingPayment = await Payment.findOne({ stripeSessionId: sessionId });
    if (!existingPayment) {
      await Payment.create({
        email,
        stripeCustomerId: customerId,
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        amountTotal,
        currency,
        status: 'paid',
        orderId
      });
    }

    let existingLicense = await License.findOne({ stripeSessionId: sessionId });
    if (!existingLicense) {
      const licenseKey = generateLicenseKey('SBU');
      const validUntil = getLicenseExpiry(process.env.DEFAULT_LICENSE_DURATION_DAYS || 30);

      existingLicense = await License.create({
        userId: user._id,
        email,
        licenseKey,
        productName: 'Sembhi Bot Ultimate',
        plan: 'Monthly',
        status: 'active',
        activatedDevices: 0,
        maxDevices: 1,
        orderId,
        stripeSessionId: sessionId,
        validFrom: new Date(),
        validUntil
      });

      try {
        await sendLicenseEmail({
          to: email,
          name,
          licenseKey,
          validUntil
        });
        console.log(`✅ License email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Email send failed:', emailError.message);
      }
    }
  }

  if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const email = invoice.customer_email?.toLowerCase();

    if (!email) {
      console.error('No email found in invoice event');
      return res.json({ received: true });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'User',
        email,
        stripeCustomerId: invoice.customer || ''
      });
    }

    const existingLicense = await License.findOne({ email, status: 'active' });
    if (!existingLicense) {
      const licenseKey = generateLicenseKey('SBU');
      const validUntil = getLicenseExpiry(process.env.DEFAULT_LICENSE_DURATION_DAYS || 30);
      const orderId = `ORD-${Date.now()}`;

      await License.create({
        userId: user._id,
        email,
        licenseKey,
        productName: 'Sembhi Bot Ultimate',
        plan: 'Monthly',
        status: 'active',
        activatedDevices: 0,
        maxDevices: 1,
        orderId,
        stripeSessionId: invoice.subscription || invoice.id,
        validFrom: new Date(),
        validUntil
      });

      try {
        await sendLicenseEmail({
          to: email,
          name: user.name || 'User',
          licenseKey,
          validUntil
        });
        console.log(`✅ License email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Email send failed:', emailError.message);
      }
    }
  }

  res.json({ received: true });
} catch (error) {
  console.error('❌ Webhook handler error:', error.message);
  res.status(500).json({ success: false, message: error.message });
}
});

module.exports = router;

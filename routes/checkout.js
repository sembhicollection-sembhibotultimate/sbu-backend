const express = require('express');
const Stripe = require('stripe');
const Coupon = require('../models/Coupon');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { customerEmail, couponCode = '' } = req.body || {};

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    const sessionPayload = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/portal/profile.html?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/auth/signup.html?payment=cancelled`
    };

    if (couponCode) {
      const code = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code, isActive: true });
      if (coupon) {
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return res.status(400).json({ error: 'Coupon has expired' });
        }
        if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) {
          return res.status(400).json({ error: 'Coupon redemption limit reached' });
        }
        if (coupon.stripeCouponId) {
          sessionPayload.discounts = [{ coupon: coupon.stripeCouponId }];
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);
    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

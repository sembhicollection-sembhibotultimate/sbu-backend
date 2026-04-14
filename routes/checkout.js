const express = require('express');
const Stripe = require('stripe');
const Coupon = require('../models/Coupon');
const AuditLog = require('../models/AuditLog');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { customerEmail, couponCode = '' } = req.body || {};

    if (!customerEmail) {
      return res.status(400).json({
        error: 'Customer email is required'
      });
    }

    const sessionPayload = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      success_url: `${process.env.CLIENT_URL}/portal/profile.html?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/auth/signup.html?payment=cancelled`
    };

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        active: true
      });

      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found or inactive' });
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Coupon has expired' });
      }

      if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
        return res.status(400).json({ error: 'Coupon redemption limit reached' });
      }

      if (!coupon.stripePromotionCodeId) {
        return res.status(400).json({ error: 'Coupon is not linked to Stripe promotion code' });
      }

      sessionPayload.discounts = [{ promotion_code: coupon.stripePromotionCodeId }];
      sessionPayload.allow_promotion_codes = false;
      sessionPayload.metadata = {
        couponCode: coupon.code
      };
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);

    await AuditLog.create({
      eventType: 'checkout_session_created',
      email: customerEmail.toLowerCase().trim(),
      status: 'success',
      details: couponCode
        ? `Checkout created with coupon ${couponCode.trim().toUpperCase()}`
        : 'Checkout created without coupon'
    }).catch(() => {});

    return res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error.message);
    return res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;

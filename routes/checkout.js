const express = require('express');
const Stripe = require('stripe');
const Coupon = require('../models/Coupon');
const AdminSetting = require('../models/AdminSetting');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getBasePrice() {
  const row = await AdminSetting.findOne({ key: 'monthly_price' });
  return Number(row?.value || 149);
}

async function getCouponDiscount(code, basePrice) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), isActive: true });
  if (!coupon) return null;
  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return null;
  if (coupon.expiresAt && now > coupon.expiresAt) return null;
  if (coupon.maxRedemptions > 0 && coupon.redeemedCount >= coupon.maxRedemptions) return null;
  let discountAmount = 0;
  if (coupon.discountType === 'percent') discountAmount = +(basePrice * (Number(coupon.discountValue || 0) / 100)).toFixed(2);
  else discountAmount = Math.min(basePrice, Number(coupon.discountValue || 0));
  const finalAmount = Math.max(0, +(basePrice - discountAmount).toFixed(2));
  return { coupon, discountAmount, finalAmount };
}

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { customerEmail, couponCode = '' } = req.body || {};
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/portal/profile.html?payment=success&email=${encodeURIComponent(customerEmail)}`,
      cancel_url: `${process.env.CLIENT_URL}/auth/signup.html?payment=cancelled&email=${encodeURIComponent(customerEmail)}`,
      metadata: { couponCode: couponCode || '' }
    };

    const basePrice = await getBasePrice();
    const couponInfo = await getCouponDiscount(couponCode, basePrice);
    if (couponInfo?.coupon?.stripePromotionCodeId) {
      sessionConfig.discounts = [{ promotion_code: couponInfo.coupon.stripePromotionCodeId }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return res.json({
      success: true,
      url: session.url,
      originalAmount: basePrice,
      discountAmount: couponInfo?.discountAmount || 0,
      finalAmount: couponInfo?.finalAmount || basePrice
    });
  } catch (error) {
    console.error('Create checkout session error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const Stripe = require('stripe');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { customerEmail } = req.body || {};

    if (!customerEmail) {
      return res.status(400).json({
        error: 'Customer email is required'
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL}/portal/profile.html?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/auth/signup.html?payment=cancelled`
    });

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

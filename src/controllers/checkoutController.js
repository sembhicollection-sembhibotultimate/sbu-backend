import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(req, res) {
  try {
    const { email, fullName = "", plan = "monthly", couponCode = "" } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_MONTHLY, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${process.env.FRONTEND_URL}/portal.html?checkout=success`,
      cancel_url: `${process.env.FRONTEND_URL}/signup.html?checkout=cancelled`,
      metadata: { email, fullName, plan, couponCode }
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("createCheckoutSession error:", error);
    return res.status(500).json({ success: false, message: "Unable to create checkout session" });
  }
}

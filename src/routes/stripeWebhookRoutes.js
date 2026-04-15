import express from "express";

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  return res.json({ success: true, message: "Stripe webhook placeholder route ready" });
});

export default router;

import mongoose from "mongoose";

const liveOfferBarSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    text: { type: String, default: "Limited-time launch offer" },
    couponCode: { type: String, default: "SBU80" },
    showCoupon: { type: Boolean, default: true },
    countdownEndsAt: { type: Date, default: null },
    ctaText: { type: String, default: "Claim Offer" },
    ctaLink: { type: String, default: "/signup.html" }
  },
  { timestamps: true }
);

export default mongoose.model("LiveOfferBar", liveOfferBarSchema);

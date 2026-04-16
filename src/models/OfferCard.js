import mongoose from "mongoose";

const offerCardSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    ctaText: { type: String, default: "Get Access" },
    ctaLink: { type: String, default: "/signup.html" },
    couponCode: { type: String, default: "" },
    showCoupon: { type: Boolean, default: false },
    discountBadge: { type: String, default: "" },
    priceLabel: { type: String, default: "$149/month" },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export default mongoose.model("OfferCard", offerCardSchema);

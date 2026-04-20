import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "Sembhi Bot Ultimate" },
    logoUrl: { type: String, default: "" },
    supportEmail: { type: String, default: "support@sembhibotultimate.com" },
    supportPhone: { type: String, default: "0432 563 568" },
    backgroundImageUrl: { type: String, default: "" },
    backgroundOpacity: { type: Number, default: 0.35 },
    heroHeadline: { type: String, default: "Sembhi Bot Ultimate — AI-Powered Futures Trading System" },
    heroSubtext: { type: String, default: "A premium NinjaTrader trading system built for speed, discipline, and smarter execution." },
    offerTitle: { type: String, default: "Limited-time launch offer" },
    offerCode: { type: String, default: "SBU80" },
    offerBadge: { type: String, default: "Special Offer" },
    sessionsEnabled: { type: Boolean, default: true },
    sessionsTitle: { type: String, default: "SBU Global Sessions" },
    sessionsSubtext: { type: String, default: "Track global market windows and stay aligned with live futures trading sessions." },
    socialLinks: {
      youtube: { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      telegram: { type: String, default: "" },
      discord: { type: String, default: "" }
    },
    theme: {
      primary: { type: String, default: "#D4AF37" },
      accent: { type: String, default: "#00C2FF" },
      bg: { type: String, default: "#05070B" },
      panel: { type: String, default: "#0B0F17" }
    }
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings || mongoose.model("SiteSettings", siteSettingsSchema);

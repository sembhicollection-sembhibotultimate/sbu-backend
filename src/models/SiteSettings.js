import mongoose from "mongoose";

const socialLinksSchema = new mongoose.Schema(
  {
    youtube: { type: String, default: "" },
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    telegram: { type: String, default: "" },
    discord: { type: String, default: "" }
  },
  { _id: false }
);

const themeSchema = new mongoose.Schema(
  {
    primary: { type: String, default: "#D4AF37" },
    accent: { type: String, default: "#00C2FF" },
    bg: { type: String, default: "#05070B" },
    panel: { type: String, default: "#0B0F17" }
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "Sembhi Bot Ultimate" },
    logoUrl: { type: String, default: "" },
    supportEmail: { type: String, default: "support@sembhibotultimate.com" },
    supportPhone: { type: String, default: "0432 563 568" },
    backgroundImageUrl: { type: String, default: "" },
    backgroundOpacity: { type: Number, default: 0.35 },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    theme: { type: themeSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export default mongoose.model("SiteSettings", siteSettingsSchema);

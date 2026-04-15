import mongoose from "mongoose";

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, default: "" },
    answer: { type: String, default: "" }
  },
  { _id: false }
);

const reviewItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    text: { type: String, default: "" },
    rating: { type: Number, default: 5 }
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" }
  },
  { _id: false }
);

const sectionToggleSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    content: { type: String, default: "" }
  },
  { _id: false }
);

const homeSectionsSchema = new mongoose.Schema(
  {
    header: {
      enabled: { type: Boolean, default: true },
      announcementText: { type: String, default: "" }
    },
    hero: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: "Professional futures trading software" },
      title: { type: String, default: "Sembhi Bot Ultimate" },
      subtitle: { type: String, default: "Advanced futures trading software with professional workflow, licensing, and support." },
      primaryCtaText: { type: String, default: "Get Access" },
      primaryCtaLink: { type: String, default: "/signup.html" },
      secondaryCtaText: { type: String, default: "View Features" },
      secondaryCtaLink: { type: String, default: "#offers" }
    },
    about: { type: sectionToggleSchema, default: () => ({ title: "Built for serious futures workflow" }) },
    offers: { type: sectionToggleSchema, default: () => ({ title: "Platform Access" }) },
    workflow: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "How It Works" },
      subtitle: { type: String, default: "Simple onboarding from checkout to software access." },
      steps: { type: [stepSchema], default: [] }
    },
    training: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Training & Support" },
      subtitle: { type: String, default: "Educational guidance and onboarding resources." },
      items: { type: [stepSchema], default: [] }
    },
    reviews: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "User Feedback" },
      subtitle: { type: String, default: "What members say about the platform experience." },
      items: { type: [reviewItemSchema], default: [] }
    },
    faq: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Frequently Asked Questions" },
      subtitle: { type: String, default: "Clear answers before you join." },
      items: { type: [faqItemSchema], default: [] }
    },
    footer: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Sembhi Bot Ultimate" },
      content: { type: String, default: "Professional futures trading software and educational platform access." }
    }
  },
  { timestamps: true }
);

export default mongoose.model("HomeSections", homeSectionsSchema);

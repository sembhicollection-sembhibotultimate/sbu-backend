import mongoose from "mongoose";

const listItemSchema = new mongoose.Schema({ title: String, description: String }, { _id: false });
const reviewSchema = new mongoose.Schema({ name: String, text: String, rating: Number }, { _id: false });
const faqSchema = new mongoose.Schema({ question: String, answer: String }, { _id: false });

const homeSectionsSchema = new mongoose.Schema(
  {
    hero: {
      eyebrow: { type: String, default: "Professional futures trading software" },
      title: { type: String, default: "Sembhi Bot Ultimate" },
      subtitle: { type: String, default: "Structured software access, portal control, and licensing workflow." },
      primaryCtaText: { type: String, default: "Get Access" },
      primaryCtaLink: { type: String, default: "/signup.html" },
      secondaryCtaText: { type: String, default: "View Features" },
      secondaryCtaLink: { type: String, default: "#offers" }
    },
    about: {
      title: { type: String, default: "Built for serious workflow" },
      content: { type: String, default: "One clean SaaS flow for software access, education, and licensing." }
    },
    workflow: {
      title: { type: String, default: "How it works" },
      items: { type: [listItemSchema], default: [{ title: "Join", description: "Create your account." }, { title: "Checkout", description: "Secure Stripe billing flow." }, { title: "Portal", description: "Manage account and license." }] }
    },
    training: {
      title: { type: String, default: "Training & support" },
      items: { type: [listItemSchema], default: [{ title: "Setup Help", description: "Onboarding support." }, { title: "Member Access", description: "Portal-guided workflow." }] }
    },
    reviews: {
      title: { type: String, default: "Reviews" },
      items: { type: [reviewSchema], default: [{ name: "Member", text: "Clean onboarding and portal.", rating: 5 }] }
    },
    faq: {
      title: { type: String, default: "FAQ" },
      items: { type: [faqSchema], default: [{ question: "Is a coupon required?", answer: "No. Blank coupon still allows checkout." }] }
    }
  },
  { timestamps: true }
);

export default mongoose.model("HomeSections", homeSectionsSchema);

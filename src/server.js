import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { seedDefaults } from "./utils/seedDefaults.js";

import authRoutes from "./routes/authRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import legalRoutes from "./routes/legalRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import portalRoutes from "./routes/portalRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminResourcesRoutes from "./routes/adminResourcesRoutes.js";
import memberPortalRoutes from "./routes/memberPortalRoutes.js";
import licenseRoutes from "./routes/licenseRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import stripeWebhookRoutes from "./routes/stripeWebhookRoutes.js";

dotenv.config();
const app = express();

await connectDB();
try {
  await seedDefaults();
} catch (err) {
  console.warn("Seed defaults skipped:", err.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(v => v.trim()) : "*",
    credentials: true
  })
);

app.use("/api/stripe", stripeWebhookRoutes);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", message: "SBU backend running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/member", memberPortalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminResourcesRoutes);
app.use("/api/license", licenseRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Server error" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`SBU backend running on port ${PORT}`));

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
import licenseRoutes from "./routes/licenseRoutes.js";
import stripeWebhookRoutes from "./routes/stripeWebhookRoutes.js";

dotenv.config();
const app = express();

await connectDB();
try {
  await seedDefaults();
} catch (err) {
  console.warn("Seed defaults skipped:", err.message);
}

app.use("/api/stripe", stripeWebhookRoutes);

const allowedOrigins = (process.env.FRONTEND_URL || "https://sembhibotultimate.com,https://www.sembhibotultimate.com,http://localhost:3000,http://127.0.0.1:5500")
  .split(",")
  .map(v => v.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/https?:\/\/(www\.)?sembhibotultimate\.com$/i.test(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    message: "SBU backend running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/license", licenseRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server error"
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`SBU backend running on port ${PORT}`);
});

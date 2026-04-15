import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import stripeWebhookRoutes from "./routes/stripeWebhookRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import portalRoutes from "./routes/portalRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import licenseRoutes from "./routes/licenseRoutes.js";

dotenv.config();
const app = express();

await connectDB();

app.use("/api/stripe", stripeWebhookRoutes);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", message: "SBU backend running" });
});

app.use("/api/cms", cmsRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/portal", portalRoutes);
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

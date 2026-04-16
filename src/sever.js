import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";

import stripeWebhookRoutes from "./routes/stripeWebhookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUsersRoutes from "./routes/adminUsersRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import portalRoutes from "./routes/portalRoutes.js";
import memberPortalRoutes from "./routes/memberPortalRoutes.js";
import licenseRoutes from "./routes/licenseRoutes.js";

dotenv.config();

const app = express();

await connectDB();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

if (!allowedOrigins.includes("http://localhost:3000")) {
  allowedOrigins.push("http://localhost:3000");
}
if (!allowedOrigins.includes("http://127.0.0.1:5500")) {
  allowedOrigins.push("http://127.0.0.1:5500");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

/*
  IMPORTANT:
  Stripe webhook route MUST stay before express.json()
*/
app.use("/api/stripe", stripeWebhookRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    message: "SBU backend running"
  });
});

/*
  Main API routes
*/
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUsersRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/member", memberPortalRoutes);
app.use("/api/license", licenseRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("MongoDB connected");
  console.log(`SBU backend running on port ${PORT}`);
});
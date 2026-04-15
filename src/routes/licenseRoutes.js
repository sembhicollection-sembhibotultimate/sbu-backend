import express from "express";
import { validateLicense } from "../controllers/licenseController.js";

const router = express.Router();

// Bot normally POST request karega
router.post("/validate", validateLicense);

// Optional GET health-style test
router.get("/validate", (req, res) => {
  res.json({
    success: true,
    message: "License validate route ready. Use POST with licenseKey."
  });
});

export default router;

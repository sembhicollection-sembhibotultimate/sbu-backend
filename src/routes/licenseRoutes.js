import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { validateLicense, listLicenses, createLicense, updateLicense, removeLicense } from "../controllers/licenseController.js";

const router = express.Router();

router.post("/validate", validateLicense);
router.get("/validate", (req, res) => {
  res.json({
    success: true,
    message: "License validate route ready. Use POST with licenseKey."
  });
});

router.get("/", adminAuth, listLicenses);
router.post("/", adminAuth, createLicense);
router.put("/:id", adminAuth, updateLicense);
router.delete("/:id", adminAuth, removeLicense);

export default router;

import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { getLicenses, updateLicense, deleteLicense, validateLicense } from "../controllers/licenseController.js";

const router = express.Router();

router.get("/", adminAuth, getLicenses);
router.put("/:id", adminAuth, updateLicense);
router.delete("/:id", adminAuth, deleteLicense);
router.post("/validate", validateLicense);

export default router;

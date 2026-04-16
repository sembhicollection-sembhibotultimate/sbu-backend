import express from "express";
import { validateLicense } from "../controllers/licenseController.js";
const router = express.Router();
router.post("/validate", validateLicense);
export default router;

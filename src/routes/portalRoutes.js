import express from "express";
import { auth } from "../middleware/auth.js";
import { cancelSubscription, createBillingPortal, getPortalSummary, resumeSubscription, updateProfile } from "../controllers/portalController.js";

const router = express.Router();
router.get("/summary", auth, getPortalSummary);
router.put("/profile", auth, updateProfile);
router.post("/cancel-subscription", auth, cancelSubscription);
router.post("/resume-subscription", auth, resumeSubscription);
router.post("/billing-portal", auth, createBillingPortal);
export default router;

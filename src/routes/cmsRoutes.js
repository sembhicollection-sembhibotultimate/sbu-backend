import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getCmsBundle,
  updateSiteSettings,
  updateHomeSections,
  updateLiveOfferBar
} from "../controllers/cmsController.js";

const router = express.Router();

router.get("/bundle", getCmsBundle);
router.put("/site-settings", adminAuth, updateSiteSettings);
router.put("/home-sections", adminAuth, updateHomeSections);
router.put("/live-offer-bar", adminAuth, updateLiveOfferBar);

export default router;

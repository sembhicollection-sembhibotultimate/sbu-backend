import express from "express";
import {
  createSupportMessage,
  getPortalData,
  seedMemberResources,
  updatePortalProfile
} from "../controllers/memberPortalController.js";

const router = express.Router();

router.get("/portal", getPortalData);
router.put("/portal/profile", updatePortalProfile);
router.post("/portal/message", createSupportMessage);
router.post("/portal/seed-resources", seedMemberResources);

export default router;

import express from "express";
import {
  createSupportMessage,
  getPortalData,
  updatePortalProfile
} from "../controllers/memberPortalController.js";

const router = express.Router();

router.get("/portal", getPortalData);
router.put("/portal/profile", updatePortalProfile);
router.post("/portal/message", createSupportMessage);

export default router;

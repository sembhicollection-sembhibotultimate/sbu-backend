import express from "express";
import {
  getMemberPortal,
  updateMemberProfile,
  createPortalMessage,
  seedPortalResources
} from "../controllers/memberPortalController.js";

const router = express.Router();

router.get("/portal", getMemberPortal);
router.put("/portal/profile", updateMemberProfile);
router.post("/portal/message", createPortalMessage);
router.post("/portal/seed-resources", seedPortalResources);

export default router;

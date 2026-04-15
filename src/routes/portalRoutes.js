import express from "express";
import { auth } from "../middleware/auth.js";
import { getPortalProfile, updatePortalProfile } from "../controllers/portalController.js";

const router = express.Router();

router.get("/profile", auth, getPortalProfile);
router.put("/profile", auth, updatePortalProfile);

export default router;

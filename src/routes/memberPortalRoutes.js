import express from "express";
import multer from "multer";
import {
  createSupportMessage,
  getPortalData,
  markNotificationRead,
  updateAvatar,
  updatePortalProfile
} from "../controllers/memberPortalController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "src/uploads",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`.replace(/\s+/g, "-"))
});
const upload = multer({ storage });

router.get("/portal", getPortalData);
router.put("/portal/profile", updatePortalProfile);
router.post("/portal/avatar", upload.single("file"), updateAvatar);
router.post("/portal/message", createSupportMessage);
router.patch("/portal/notifications/:id/read", markNotificationRead);

export default router;

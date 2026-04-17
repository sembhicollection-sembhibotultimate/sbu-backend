import express from "express";
import multer from "multer";
import path from "path";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getDownloads,
  createDownload,
  updateDownload,
  deleteDownload,
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo
} from "../controllers/adminResourcesController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "src/uploads",
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname}`.replace(/\s+/g, "-");
    cb(null, safe);
  }
});
const upload = multer({ storage });

router.use(adminAuth);

router.get("/downloads", getDownloads);
router.post("/downloads", upload.single("file"), createDownload);
router.put("/downloads/:id", upload.single("file"), updateDownload);
router.delete("/downloads/:id", deleteDownload);

router.get("/videos", getVideos);
router.post("/videos", createVideo);
router.put("/videos/:id", updateVideo);
router.delete("/videos/:id", deleteVideo);

export default router;

import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getPublicReviews,
  getAdminReviews,
  createReview,
  updateReview,
  deleteReview
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", getPublicReviews);
router.get("/admin", adminAuth, getAdminReviews);
router.post("/admin", adminAuth, createReview);
router.put("/admin/:id", adminAuth, updateReview);
router.delete("/admin/:id", adminAuth, deleteReview);

export default router;

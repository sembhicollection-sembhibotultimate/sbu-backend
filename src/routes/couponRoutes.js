import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  getHomepageOffer,
  updateCoupon,
  validateCoupon
} from "../controllers/couponController.js";

const router = express.Router();

router.get("/homepage-offer", getHomepageOffer);
router.post("/validate", validateCoupon);

router.get("/", adminAuth, getCoupons);
router.post("/", adminAuth, createCoupon);
router.put("/:id", adminAuth, updateCoupon);
router.delete("/:id", adminAuth, deleteCoupon);

export default router;

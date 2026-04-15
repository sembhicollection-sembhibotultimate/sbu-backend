import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from "../controllers/couponController.js";

const router = express.Router();

router.get("/", adminAuth, getCoupons);
router.post("/", adminAuth, createCoupon);
router.put("/:id", adminAuth, updateCoupon);
router.delete("/:id", adminAuth, deleteCoupon);
router.post("/validate", validateCoupon);

export default router;

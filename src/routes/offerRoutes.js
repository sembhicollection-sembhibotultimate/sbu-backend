import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { createOffer, deleteOffer, getOffers, updateOffer } from "../controllers/offerController.js";
const router = express.Router();
router.get("/", getOffers);
router.post("/", adminAuth, createOffer);
router.put("/:id", adminAuth, updateOffer);
router.delete("/:id", adminAuth, deleteOffer);
export default router;

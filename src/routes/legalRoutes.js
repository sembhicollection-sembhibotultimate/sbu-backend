import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { getLegalDoc, getLegalDocs, updateLegalDoc } from "../controllers/legalController.js";

const router = express.Router();
router.get("/", getLegalDocs);
router.get("/:slug", getLegalDoc);
router.put("/:slug", adminAuth, updateLegalDoc);
export default router;

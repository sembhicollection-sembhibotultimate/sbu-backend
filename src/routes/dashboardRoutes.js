import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();
router.get("/summary", adminAuth, getDashboardSummary);

export default router;

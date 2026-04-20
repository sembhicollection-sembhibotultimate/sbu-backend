import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { getDashboardSummary, exportDashboardCsv } from "../controllers/dashboardController.js";
const router = express.Router();
router.get("/summary", adminAuth, getDashboardSummary);
router.get("/export.csv", adminAuth, exportDashboardCsv);
export default router;

import express from "express";
import { signup, login, forgotPassword, changePassword } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/change-password", auth, changePassword);

export default router;

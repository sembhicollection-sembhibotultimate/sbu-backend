import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getUsers,
  getUserDetail,
  updateUser,
  toggleUserStatus,
  deleteUser,
  createLicenseForUser
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", adminAuth, getUsers);
router.get("/users/:id", adminAuth, getUserDetail);
router.put("/users/:id", adminAuth, updateUser);
router.patch("/users/:id/toggle-status", adminAuth, toggleUserStatus);
router.post("/users/:id/licenses", adminAuth, createLicenseForUser);
router.delete("/users/:id", adminAuth, deleteUser);

export default router;

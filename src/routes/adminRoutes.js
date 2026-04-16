import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  createLicenseForUser,
  deleteLicense,
  deleteUser,
  getLicenses,
  getUserDetails,
  getUsers,
  sendBulkMessage,
  sendMessageToUser,
  toggleUserStatus,
  updateLicense,
  updateUser
} from "../controllers/adminUserController.js";

const router = express.Router();
router.post("/messages/bulk", adminAuth, sendBulkMessage);
router.get("/users", adminAuth, getUsers);
router.get("/users/:id", adminAuth, getUserDetails);
router.put("/users/:id", adminAuth, updateUser);
router.post("/users/:id/toggle-status", adminAuth, toggleUserStatus);
router.delete("/users/:id", adminAuth, deleteUser);
router.post("/users/:id/licenses", adminAuth, createLicenseForUser);
router.post("/users/:id/send-message", adminAuth, sendMessageToUser);
router.get("/licenses", adminAuth, getLicenses);
router.put("/licenses/:id", adminAuth, updateLicense);
router.delete("/licenses/:id", adminAuth, deleteLicense);
export default router;

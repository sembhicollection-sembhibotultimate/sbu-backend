import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  createLicenseForUser,
  deleteLicense,
  deleteUser,
  getLicenses,
  getMessages,
  getUserDetail,
  getUserLicenses,
  getUsers,
  resolveMessage,
  sendBulkMessage,
  sendMessageToUser,
  toggleUserStatus,
  updateLicense,
  updateUser,
  updateUserLicense
} from "../controllers/adminUserController.js";

const router = express.Router();

router.get("/users", adminAuth, getUsers);
router.get("/users/:id", adminAuth, getUserDetail);
router.put("/users/:id", adminAuth, updateUser);
router.patch("/users/:id/toggle", adminAuth, toggleUserStatus);
router.post("/users/:id/toggle-status", adminAuth, toggleUserStatus);
router.delete("/users/:id", adminAuth, deleteUser);

router.post("/users/:id/license", adminAuth, createLicenseForUser);
router.post("/users/:id/licenses", adminAuth, createLicenseForUser);
router.get("/users/:id/licenses", adminAuth, getUserLicenses);
router.put("/users/:id/licenses/:licenseId", adminAuth, updateUserLicense);
router.delete("/users/:id/licenses/:licenseId", adminAuth, deleteUserLicense);

router.post("/users/:id/message", adminAuth, sendMessageToUser);
router.post("/bulk-message", adminAuth, sendBulkMessage);

router.get("/messages", adminAuth, getMessages);
router.patch("/messages/:messageId/resolve", adminAuth, resolveMessage);

router.get("/licenses", adminAuth, getLicenses);
router.put("/licenses/:id", adminAuth, updateLicense);
router.delete("/licenses/:id", adminAuth, deleteLicense);

export default router;

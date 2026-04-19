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
  sendBulkMessageToUsers,
  sendMessageToUser,
  toggleUserStatus,
  updateLicense,
  updateUser
} from "../controllers/adminUserController.js";

const router = express.Router();
router.use(adminAuth);

router.get("/users", getUsers);
router.get("/users/:id", getUserDetail);
router.put("/users/:id", updateUser);
router.patch("/users/:id/toggle", toggleUserStatus);
router.post("/users/:id/toggle-status", toggleUserStatus);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/license", createLicenseForUser);
router.post("/users/:id/licenses", createLicenseForUser);
router.get("/users/:id/licenses", getUserLicenses);
router.post("/users/:id/message", sendMessageToUser);

router.post("/bulk-message", sendBulkMessageToUsers);

router.get("/messages", getMessages);
router.patch("/messages/:messageId/resolve", resolveMessage);

router.get("/licenses", getLicenses);
router.put("/licenses/:id", updateLicense);
router.put("/users/:id/licenses/:licenseId", updateLicense);
router.delete("/licenses/:id", deleteLicense);
router.delete("/users/:id/licenses/:licenseId", deleteLicense);

export default router;

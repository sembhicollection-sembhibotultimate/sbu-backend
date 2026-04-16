import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  createLicenseForUser,
  deleteLicense,
  deleteUser,
  getSupportMessages,
  getUserDetail,
  getUserLicenses,
  getUsers,
  resolveSupportMessage,
  sendBulkMessageToUsers,
  sendMessageToUser,
  toggleUser,
  updateLicense,
  updateUser
} from "../controllers/adminUsersController.js";

const router = express.Router();

router.use(adminAuth);

router.get("/users", getUsers);
router.get("/users/:id", getUserDetail);
router.put("/users/:id", updateUser);
router.patch("/users/:id/toggle", toggleUser);
router.delete("/users/:id", deleteUser);

router.post("/users/:id/license", createLicenseForUser);
router.get("/users/:id/licenses", getUserLicenses);
router.put("/users/:id/licenses/:licenseId", updateLicense);
router.delete("/users/:id/licenses/:licenseId", deleteLicense);

router.post("/users/:id/message", sendMessageToUser);
router.post("/bulk-message", sendBulkMessageToUsers);

router.get("/messages", getSupportMessages);
router.patch("/messages/:messageId/resolve", resolveSupportMessage);

export default router;

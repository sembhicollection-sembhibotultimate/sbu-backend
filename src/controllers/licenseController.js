import License from "../models/License.js";
import User from "../models/User.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";
import { sendLicenseIssuedEmail } from "../services/emailService.js";

export const validateLicense = async (req, res) => {
  try {
    const { licenseKey, machineId, hwid } = req.body;
    const finalMachineId = machineId || hwid || "";

    if (!licenseKey || !licenseKey.trim()) {
      return res.status(400).json({
        success: false,
        message: "License key is required",
        status: "inactive",
        allowTrading: false
      });
    }

    const cleanKey = licenseKey.trim();

    if (process.env.OWNER_LICENSE_KEY && cleanKey === process.env.OWNER_LICENSE_KEY) {
      return res.json({
        success: true,
        message: "Owner license valid",
        status: "active",
        plan: "owner",
        isOwner: true,
        allowTrading: true,
        machineLocked: false,
        valid: true
      });
    }

    const license = await License.findOne({ licenseKey: cleanKey });
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "License not found",
        status: "inactive",
        allowTrading: false,
        valid: false
      });
    }

    if (license.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "License is not active",
        status: license.status || "inactive",
        allowTrading: false,
        valid: false
      });
    }

    const expiryField = license.expiresAt || license.validUntil;
    if (expiryField && new Date(expiryField) < new Date()) {
      return res.status(403).json({
        success: false,
        message: "License expired",
        status: "expired",
        allowTrading: false,
        valid: false
      });
    }

    const savedMachine = license.machineId || license.machineName || license.hwid || "";

    if (!savedMachine && finalMachineId) {
      license.machineId = finalMachineId;
      license.hwid = finalMachineId;
      license.activatedDevices = (license.activatedDevices || 0) + 1;
      license.lastValidatedAt = new Date();
      await license.save();

      return res.json({
        success: true,
        message: "License activated and machine bound",
        status: "active",
        plan: license.plan || "monthly",
        isOwner: !!license.isOwner,
        allowTrading: true,
        machineLocked: true,
        valid: true
      });
    }

    if (savedMachine && finalMachineId && savedMachine !== finalMachineId) {
      return res.status(403).json({
        success: false,
        message: "License is locked to another machine",
        status: "machine_mismatch",
        allowTrading: false,
        valid: false
      });
    }

    license.lastValidatedAt = new Date();
    await license.save();

    return res.json({
      success: true,
      message: "License valid",
      status: "active",
      plan: license.plan || "monthly",
      isOwner: !!license.isOwner,
      allowTrading: true,
      machineLocked: !!savedMachine,
      valid: true
    });
  } catch (error) {
    console.error("validateLicense error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during license validation",
      status: "error",
      allowTrading: false,
      valid: false
    });
  }
};

export const listLicenses = async (req, res) => {
  const data = await License.find().populate("userId", "fullName email").sort({ createdAt: -1 });
  res.json({ success: true, data });
};

export const createLicense = async (req, res) => {
  const { userId = "", productName = "Sembhi Bot Ultimate", plan = "monthly", status = "active", hwid = "", expiresAt = "" } = req.body || {};
  let user = null;
  if (userId) user = await User.findById(userId);
  const item = await License.create({
    userId: user?._id || undefined,
    productName,
    plan,
    status,
    hwid,
    licenseKey: generateLicenseKey("SBU"),
    expiresAt: expiresAt ? new Date(expiresAt) : undefined
  });

  if (user?.email) {
    try:
      pass
    except:
      pass
  }

  if (user?.email) {
    try {
      await sendLicenseIssuedEmail({
        to: user.email,
        fullName: user.fullName || "",
        licenseKey: item.licenseKey,
        plan,
        portalUrl: process.env.PORTAL_URL || "https://sembhibotultimate.com/portal.html"
      });
    } catch (e) {
      console.warn("license email skipped:", e.message);
    }
  }

  res.json({ success: true, message: "License created", data: item });
};

export const updateLicense = async (req, res) => {
  const payload = { ...req.body };
  if (payload.expiresAt === "") payload.expiresAt = null;
  const data = await License.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!data) return res.status(404).json({ success: false, message: "License not found" });
  res.json({ success: true, message: "License updated", data });
};

export const removeLicense = async (req, res) => {
  await License.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "License deleted" });
};

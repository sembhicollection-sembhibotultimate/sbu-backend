import License from "../models/License.js";

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

    // OWNER KEY DIRECT ALLOW
    if (
      process.env.OWNER_LICENSE_KEY &&
      cleanKey === process.env.OWNER_LICENSE_KEY
    ) {
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

    // NORMAL LICENSE CHECK
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

    // Expiry check
    if (license.validUntil && new Date(license.validUntil) < new Date()) {
      return res.status(403).json({
        success: false,
        message: "License expired",
        status: "expired",
        allowTrading: false,
        valid: false
      });
    }

    // HWID / Machine lock check
    const savedMachine =
      license.machineId || license.machineName || license.hwid || "";

    // If no machine stored yet, first activation binds it
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

    // If machine exists, it must match
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

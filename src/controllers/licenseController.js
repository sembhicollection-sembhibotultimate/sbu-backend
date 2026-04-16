import License from "../models/License.js";

export async function validateLicense(req, res) {
  const { licenseKey, hwid = "" } = req.body || {};
  const license = await License.findOne({ licenseKey });

  if (!license) return res.status(404).json({ success: false, message: "License not found" });
  if (license.status !== "active") return res.status(403).json({ success: false, message: "License inactive" });

  if (!license.hwid && hwid) {
    license.hwid = hwid;
  } else if (license.hwid && hwid && license.hwid !== hwid) {
    return res.status(403).json({ success: false, message: "License already active on another machine" });
  }

  license.lastValidatedAt = new Date();
  await license.save();

  res.json({ success: true, message: "License valid" });
}

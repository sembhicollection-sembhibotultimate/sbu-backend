import License from "../models/License.js";

export const getLicenses = async (req, res) => {
  const licenses = await License.find().populate("userId", "fullName email status plan").sort({ createdAt: -1 });
  res.json({ success: true, data: licenses });
};

export const updateLicense = async (req, res) => {
  const payload = {
    status: req.body.status,
    plan: req.body.plan,
    productName: req.body.productName,
    hwid: req.body.hwid,
    expiresAt: req.body.expiresAt
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const license = await License.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  res.json({ success: true, message: "License updated", data: license });
};

export const deleteLicense = async (req, res) => {
  await License.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "License deleted" });
};

export const validateLicense = async (req, res) => {
  const { licenseKey = "", hwid = "" } = req.body;
  const license = await License.findOne({ licenseKey: licenseKey.trim() });

  if (!license || license.status !== "active") {
    return res.status(401).json({ success: false, valid: false, message: "License invalid or inactive" });
  }

  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    return res.status(401).json({ success: false, valid: false, message: "License expired" });
  }

  if (!license.hwid && hwid) {
    license.hwid = hwid;
  } else if (license.hwid && hwid && license.hwid !== hwid) {
    return res.status(401).json({ success: false, valid: false, message: "License locked to another machine" });
  }

  license.lastValidatedAt = new Date();
  await license.save();

  res.json({
    success: true,
    valid: true,
    message: "License active",
    data: {
      productName: license.productName,
      plan: license.plan,
      expiresAt: license.expiresAt,
      hwid: license.hwid
    }
  });
};

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import License from "../models/License.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";

export async function getUsers(req, res) {
  const data = await User.find().sort({ createdAt: -1 }).select("-passwordHash");
  res.json({ success: true, data });
}

export async function updateUser(req, res) {
  const update = { ...req.body };
  delete update.passwordHash;

  if (update.password) {
    update.passwordHash = await bcrypt.hash(update.password, 10);
    delete update.password;
  }

  const data = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select("-passwordHash");
  res.json({ success: true, data });
}

export async function toggleUserStatus(req, res) {
  const user = await User.findById(req.params.id);
  const nextStatus = user.status === "active" ? "disabled" : "active";
  user.status = nextStatus;
  await user.save();

  await License.updateMany({ userId: user._id }, { status: nextStatus === "active" ? "active" : "inactive" });

  res.json({ success: true, data: user });
}

export async function deleteUser(req, res) {
  await Promise.all([
    License.deleteMany({ userId: req.params.id }),
    User.findByIdAndDelete(req.params.id)
  ]);
  res.json({ success: true });
}

export async function createLicenseForUser(req, res) {
  const { plan = "monthly" } = req.body || {};
  const data = await License.create({
    userId: req.params.id,
    licenseKey: generateLicenseKey(),
    status: "active",
    plan
  });
  res.json({ success: true, data });
}

export async function getLicenses(req, res) {
  const data = await License.find().populate("userId", "fullName email").sort({ createdAt: -1 });
  res.json({ success: true, data });
}

export async function updateLicense(req, res) {
  const data = await License.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data });
}

export async function deleteLicense(req, res) {
  await License.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}

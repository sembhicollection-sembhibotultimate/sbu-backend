import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";

export const getUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select("-passwordHash");
  res.json({ success: true, data: users });
};

export const getUserDetail = async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  const licenses = await License.find({ userId: req.params.id }).sort({ createdAt: -1 });
  const payments = await PaymentRecord.find({ userId: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { user, licenses, payments } });
};

export const updateUser = async (req, res) => {
  const payload = {
    fullName: req.body.fullName,
    status: req.body.status,
    plan: req.body.plan,
    couponUsed: req.body.couponUsed,
    profile: req.body.profile
  };

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).select("-passwordHash");
  res.json({ success: true, message: "User updated", data: user });
};

export const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  user.status = user.status === "active" ? "disabled" : "active";
  await user.save();
  res.json({ success: true, message: `User ${user.status}`, data: { status: user.status } });
};

export const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await License.deleteMany({ userId: req.params.id });
  await PaymentRecord.deleteMany({ userId: req.params.id });
  res.json({ success: true, message: "User deleted" });
};

export const createLicenseForUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const license = await License.create({
    userId: user._id,
    licenseKey: generateLicenseKey("SBU"),
    productName: req.body.productName || "Sembhi Bot Ultimate",
    status: req.body.status || "active",
    plan: req.body.plan || user.plan || "monthly",
    expiresAt: req.body.expiresAt || null
  });

  res.json({ success: true, message: "License created", data: license });
};

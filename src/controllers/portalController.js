import User from "../models/User.js";
import License from "../models/License.js";
import PaymentRecord from "../models/PaymentRecord.js";

export const getPortalProfile = async (req, res) => {
  const user = await User.findById(req.user.userId).select("-passwordHash");
  const licenses = await License.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  const payments = await PaymentRecord.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(10);

  res.json({
    success: true,
    data: { user, licenses, payments }
  });
};

export const updatePortalProfile = async (req, res) => {
  const update = {
    fullName: req.body.fullName?.trim() || "",
    profile: {
      phone: req.body.profile?.phone?.trim() || "",
      country: req.body.profile?.country?.trim() || "",
      address: req.body.profile?.address?.trim() || ""
    }
  };

  const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true }).select("-passwordHash");
  res.json({ success: true, message: "Profile updated", data: user });
};

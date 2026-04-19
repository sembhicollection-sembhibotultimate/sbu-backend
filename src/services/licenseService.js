import User from "../models/User.js";
import License from "../models/License.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";

export async function createOrRenewLicenseFromPayment({
  email,
  stripeCustomerId = "",
  stripeSubscriptionId = "",
  plan = "monthly",
  productName = "Sembhi Bot Ultimate"
}) {
  if (!email) throw new Error("Email is required");

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error("User not found for payment email");

  let license = null;
  if (stripeSubscriptionId) {
    license = await License.findOne({ stripeSubscriptionId });
  }
  if (!license) {
    license = await License.findOne({ userId: user._id, productName });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  if (!license) {
    license = await License.create({
      userId: user._id,
      licenseKey: generateLicenseKey("SBU"),
      productName,
      status: "active",
      plan,
      hwid: "",
      stripeCustomerId,
      stripeSubscriptionId,
      expiresAt
    });
  } else {
    license.status = "active";
    license.plan = plan;
    license.productName = productName;
    if (stripeCustomerId) license.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) license.stripeSubscriptionId = stripeSubscriptionId;
    license.expiresAt = expiresAt;
    await license.save();
  }

  user.status = "active";
  user.plan = plan;
  if (stripeCustomerId) user.stripeCustomerId = stripeCustomerId;
  if (stripeSubscriptionId) user.stripeSubscriptionId = stripeSubscriptionId;
  await user.save();

  return { user, license };
}

export async function deactivateLicenseBySubscriptionId(subscriptionId) {
  if (!subscriptionId) return null;
  const license = await License.findOne({ stripeSubscriptionId: subscriptionId });
  if (!license) return null;

  license.status = "inactive";
  await license.save();

  const user = await User.findById(license.userId);
  if (user) {
    user.status = "inactive";
    await user.save();
  }

  return license;
}

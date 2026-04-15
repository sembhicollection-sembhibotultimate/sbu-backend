import License from "../models/License.js";
import User from "../models/User.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";

export async function createOrRenewSubscriptionLicense({
  email,
  stripeCustomerId = "",
  stripeSubscriptionId = "",
  productName = "Sembhi Bot Ultimate",
  plan = "monthly",
  months = 1
}) {
  if (!email) throw new Error("Email is required to create a license");

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      fullName: email.split("@")[0],
      email,
      status: "active",
      plan
    });
  } else {
    user.plan = plan;
    user.status = "active";
    if (stripeCustomerId) user.stripeCustomerId = stripeCustomerId;
    await user.save();
  }

  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setMonth(validUntil.getMonth() + months);

  let license = await License.findOne({
    $or: [
      ...(stripeSubscriptionId ? [{ stripeSubscriptionId }] : []),
      { userId: user._id, productName }
    ]
  });

  if (!license) {
    license = await License.create({
      userId: user._id,
      email,
      licenseKey: generateLicenseKey("SBU"),
      productName,
      plan,
      status: "active",
      activatedDevices: 0,
      maxDevices: 1,
      machineId: "",
      machineName: "",
      validFrom: now,
      validUntil,
      stripeCustomerId,
      stripeSubscriptionId,
      hwid: ""
    });
  } else {
    license.status = "active";
    license.plan = plan;
    license.validFrom = now;
    license.validUntil = validUntil;
    if (stripeCustomerId) license.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) license.stripeSubscriptionId = stripeSubscriptionId;
    await license.save();
  }

  return { user, license };
}

export async function deactivateLicenseBySubscriptionId(subscriptionId) {
  if (!subscriptionId) return null;

  const license = await License.findOne({ stripeSubscriptionId: subscriptionId });
  if (!license) return null;

  license.status = "inactive";
  await license.save();

  if (license.userId) {
    const user = await User.findById(license.userId);
    if (user) {
      user.status = "inactive";
      await user.save();
    }
  }

  return license;
}

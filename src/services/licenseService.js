import License from "../models/License.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";

export async function createLicenseForUser({ userId, productName = "Sembhi Bot Ultimate", plan = "monthly" }) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  return License.create({
    userId,
    licenseKey: generateLicenseKey(),
    productName,
    plan,
    status: "active",
    expiresAt
  });
}

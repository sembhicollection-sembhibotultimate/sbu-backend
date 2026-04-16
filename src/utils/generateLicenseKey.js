import crypto from "crypto";

export function generateLicenseKey(prefix = "SBU") {
  const chunk = () => crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${chunk()}-${chunk()}-${chunk()}`;
}

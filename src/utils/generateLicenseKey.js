import crypto from "crypto";

export function generateLicenseKey() {
  const raw = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `SBU-${raw.slice(0, 6)}-${raw.slice(6, 12)}-${raw.slice(12, 18)}`;
}

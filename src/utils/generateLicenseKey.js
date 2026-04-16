import crypto from "crypto";

export function generateLicenseKey(prefix = "SBU") {
  const part = () => crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${part()}-${part()}-${part()}`;
}

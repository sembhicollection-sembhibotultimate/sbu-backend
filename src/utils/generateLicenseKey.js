export function generateLicenseKey() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SBU-${part()}-${part()}-${part()}-${part()}`;
}

const crypto = require('crypto');

function generateLicenseKey(prefix = 'SBU') {
  const p1 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const p2 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const p3 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const p4 = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${p1}-${p2}-${p3}-${p4}`;
}

function getLicenseExpiry(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 30));
  return d;
}

module.exports = { generateLicenseKey, getLicenseExpiry };

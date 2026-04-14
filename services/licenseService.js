const crypto = require('crypto');
const User = require('../models/User');
const License = require('../models/License');

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

function extendFromBaseDate(baseDate, days) {
  const d = new Date(baseDate || new Date());
  d.setDate(d.getDate() + Number(days || 30));
  return d;
}

async function findOrCreateUser({
  email,
  name = 'User',
  stripeCustomerId = ''
}) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    throw new Error('Email is required for findOrCreateUser');
  }

  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      name,
      email: normalizedEmail,
      stripeCustomerId
    });
    return user;
  }

  let changed = false;

  if (!user.name && name) {
    user.name = name;
    changed = true;
  }

  if (!user.stripeCustomerId && stripeCustomerId) {
    user.stripeCustomerId = stripeCustomerId;
    changed = true;
  }

  if (changed) {
    await user.save();
  }

  return user;
}

async function getActiveOrLatestLicenseByEmail(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!normalizedEmail) return null;

  let license = await License.findOne({
    email: normalizedEmail,
    status: 'active'
  }).sort({ createdAt: -1 });

  if (!license) {
    license = await License.findOne({
      email: normalizedEmail
    }).sort({ createdAt: -1 });
  }

  return license;
}

async function createLicenseForUser({
  user,
  email,
  plan = 'Monthly',
  orderId = '',
  stripeSessionId = '',
  stripeCustomerId = '',
  stripeSubscriptionId = '',
  validDays = 30
}) {
  const normalizedEmail = String(email || user?.email || '').toLowerCase().trim();
  if (!user?._id || !normalizedEmail) {
    throw new Error('User and email are required to create license');
  }

  const licenseKey = generateLicenseKey('SBU');
  const validUntil = getLicenseExpiry(validDays);

  const license = await License.create({
    userId: user._id,
    email: normalizedEmail,
    licenseKey,
    productName: 'Sembhi Bot Ultimate',
    plan,
    status: 'active',
    activatedDevices: 0,
    maxDevices: 1,
    machineId: '',
    machineName: '',
    orderId,
    stripeSessionId,
    stripeCustomerId,
    stripeSubscriptionId,
    validFrom: new Date(),
    validUntil
  });

  return license;
}

async function renewExistingLicense({
  license,
  days = 30,
  stripeSubscriptionId = '',
  stripeCustomerId = '',
  stripeSessionId = ''
}) {
  if (!license) {
    throw new Error('License is required for renewal');
  }

  const now = new Date();
  const baseDate =
    license.validUntil && new Date(license.validUntil) > now
      ? new Date(license.validUntil)
      : now;

  license.validUntil = extendFromBaseDate(baseDate, days);
  license.status = 'active';

  if (stripeSubscriptionId) license.stripeSubscriptionId = stripeSubscriptionId;
  if (stripeCustomerId) license.stripeCustomerId = stripeCustomerId;
  if (stripeSessionId) license.stripeSessionId = stripeSessionId;

  await license.save();
  return license;
}

module.exports = {
  generateLicenseKey,
  getLicenseExpiry,
  extendFromBaseDate,
  findOrCreateUser,
  getActiveOrLatestLicenseByEmail,
  createLicenseForUser,
  renewExistingLicense
};

const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const License = require('../models/License');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const { sendLicenseEmail } = require('../services/emailService');
const { generateLicenseKey, getLicenseExpiry } = require('../services/licenseService');

const router = express.Router();

// USERS
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/user/:id/disable', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    await AuditLog.create({
      eventType: 'user_disabled',
      email: user.email,
      status: 'success',
      details: `Admin disabled user ${user._id}`
    });

    res.json({ success: true, message: 'User disabled successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/user/:id/enable', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    await AuditLog.create({
      eventType: 'user_enabled',
      email: user.email,
      status: 'success',
      details: `Admin enabled user ${user._id}`
    });

    res.json({ success: true, message: 'User enabled successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/user/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await License.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    await AuditLog.create({
      eventType: 'user_deleted',
      email: user.email,
      status: 'success',
      details: `Admin deleted user ${user._id} and related licenses`
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE LICENSE DIRECTLY FROM USER ROW
router.post('/user/:id/create-license', adminAuth, async (req, res) => {
  try {
    const { plan = 'Monthly', validDays = 30 } = req.body || {};

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const licenseKey = generateLicenseKey('SBU');
    const validUntil = getLicenseExpiry(validDays);

    const license = await License.create({
      userId: user._id,
      email: user.email,
      licenseKey,
      productName: 'Sembhi Bot Ultimate',
      plan,
      status: 'active',
      activatedDevices: 0,
      maxDevices: 1,
      machineId: '',
      machineName: '',
      orderId: `ADMIN-${Date.now()}`,
      stripeSessionId: `admin-manual-${Date.now()}`,
      validFrom: new Date(),
      validUntil
    });

    await AuditLog.create({
      eventType: 'license_manual_created',
      email: user.email,
      status: 'success',
      details: `Admin created license ${license.licenseKey} from user row`
    });

    res.json({
      success: true,
      message: 'License created successfully',
      license
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// RESEND LICENSE EMAIL FROM USER ROW
router.post('/user/:id/resend-email', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const license = await License.findOne({ email: user.email, status: 'active' }).sort({ createdAt: -1 });
    if (!license) {
      return res.status(404).json({ success: false, message: 'No active license found for this user' });
    }

    await sendLicenseEmail({
      to: user.email,
      name: user.name || 'User',
      licenseKey: license.licenseKey,
      validUntil: license.validUntil
    });

    await AuditLog.create({
      eventType: 'email_resent',
      email: user.email,
      status: 'success',
      details: `License email resent for ${license.licenseKey}`
    });

    res.json({ success: true, message: 'License email resent successfully' });
  } catch (error) {
    await AuditLog.create({
      eventType: 'email_resend_failed',
      email: '',
      status: 'failed',
      details: error.message
    }).catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
});

// LICENSES
router.get('/licenses', adminAuth, async (req, res) => {
  try {
    const licenses = await License.find().sort({ createdAt: -1 });
    res.json({ success: true, licenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/license/create', adminAuth, async (req, res) => {
  try {
    const { userId, email, licenseKey, plan, validUntil } = req.body || {};

    if (!userId || !email || !licenseKey) {
      return res.status(400).json({
        success: false,
        message: 'userId, email and licenseKey are required'
      });
    }

    const exists = await License.findOne({ licenseKey: String(licenseKey).trim().toUpperCase() });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'License key already exists'
      });
    }

    const license = await License.create({
      userId,
      email: String(email).toLowerCase().trim(),
      licenseKey: String(licenseKey).trim().toUpperCase(),
      productName: 'Sembhi Bot Ultimate',
      plan: plan || 'Monthly',
      status: 'active',
      activatedDevices: 0,
      maxDevices: 1,
      machineId: '',
      machineName: '',
      orderId: `MANUAL-${Date.now()}`,
      stripeSessionId: `manual-${Date.now()}`,
      validFrom: new Date(),
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await AuditLog.create({
      eventType: 'license_manual_created',
      email: String(email).toLowerCase().trim(),
      status: 'success',
      details: `Manual license created: ${license.licenseKey}`
    });

    res.json({ success: true, message: 'Manual license created successfully', license });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/license/:id/renew', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.body || {};
    const license = await License.findById(req.params.id);

    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    const baseDate =
      license.validUntil && new Date(license.validUntil) > new Date()
        ? new Date(license.validUntil)
        : new Date();

    baseDate.setDate(baseDate.getDate() + Number(days));
    license.validUntil = baseDate;
    license.status = 'active';
    await license.save();

    await AuditLog.create({
      eventType: 'license_renewed',
      email: license.email,
      status: 'success',
      details: `License renewed by ${days} days`
    });

    res.json({ success: true, message: 'License renewed successfully', license });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/license/:id/activate', adminAuth, async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    license.status = 'active';
    await license.save();

    await AuditLog.create({
      eventType: 'license_activated',
      email: license.email,
      status: 'success',
      details: `License activated: ${license.licenseKey}`
    });

    res.json({ success: true, message: 'License activated successfully', license });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/license/:id/deactivate', adminAuth, async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    license.status = 'inactive';
    await license.save();

    await AuditLog.create({
      eventType: 'license_deactivated',
      email: license.email,
      status: 'success',
      details: `License deactivated: ${license.licenseKey}`
    });

    res.json({ success: true, message: 'License deactivated successfully', license });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/license/:id/reset-machine', adminAuth, async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    license.machineId = '';
    license.machineName = '';
    license.activatedDevices = 0;
    license.lastValidatedAt = null;
    await license.save();

    await AuditLog.create({
      eventType: 'license_machine_reset',
      email: license.email,
      status: 'success',
      details: `Machine reset for ${license.licenseKey}`
    });

    res.json({ success: true, message: 'Machine reset successful', license });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/license/:id', adminAuth, async (req, res) => {
  try {
    const existing = await License.findById(req.params.id);
    await License.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      eventType: 'license_deleted',
      email: existing?.email || '',
      status: 'success',
      details: `Admin deleted license ${existing?.licenseKey || req.params.id}`
    });

    res.json({ success: true, message: 'License deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PAYMENTS
router.get('/payments', adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// LOGS
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

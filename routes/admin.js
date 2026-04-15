const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const License = require('../models/License');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const Coupon = require('../models/Coupon');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const {
  sendLicenseEmail,
  sendTemplateEmail
} = require('../services/emailService');
const {
  generateLicenseKey,
  getLicenseExpiry
} = require('../services/licenseService');

const router = express.Router();

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/user/:id', adminAuth, async (req, res) => {
  try {
    const { name, firstName, lastName, email, mobile, address, isActive } = req.body || {};
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (typeof name === 'string') user.name = name.trim();
    if (typeof firstName === 'string') user.firstName = firstName.trim();
    if (typeof lastName === 'string') user.lastName = lastName.trim();
    if (typeof email === 'string' && email.trim()) user.email = email.trim().toLowerCase();
    if (typeof mobile === 'string') user.mobile = mobile.trim();
    if (typeof address === 'string') user.address = address.trim();
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    await AuditLog.create({
      eventType: 'user_updated',
      email: user.email,
      status: 'success',
      details: `Admin updated user ${user._id}`
    });

    res.json({ success: true, message: 'User updated successfully', user });
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

    res.json({ success: true, message: 'License created successfully', license });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/user/:id/resend-email', adminAuth, async (req, res) => {
  let user = null;

  try {
    user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const license = await License.findOne({
      email: user.email,
      status: 'active'
    }).sort({ createdAt: -1 });

    if (!license) {
      return res.status(404).json({
        success: false,
        message: 'No active license found for this user'
      });
    }

    await sendLicenseEmail({
      to: user.email,
      name: user.name || 'User',
      licenseKey: license.licenseKey,
      validUntil: license.validUntil,
      plan: license.plan || 'Monthly'
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
      email: user?.email || '',
      status: 'failed',
      details: error.message
    }).catch(() => {});

    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * TEST EMAIL ROUTE
 * Use this once Hostinger SMTP env is updated.
 * URL:
 * GET /api/admin/test-email
 */
router.get('/test-email', adminAuth, async (req, res) => {
  try {
    const testTo = process.env.FROM_EMAIL;
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@sembhibotultimate.com';

    await sendTemplateEmail({
      to: testTo,
      templateKey: 'license_issue',
      variables: {
        name: 'Test User',
        licenseKey: 'SBU-TEST-1234-5678',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU'),
        plan: 'Premium'
      },
      fallbackSubject: 'SBU SMTP Test Email',
      fallbackBody:
        'Hello {name},\n\nThis is a successful SMTP test from Sembhi Bot Ultimate.\n\nLicense Key: {licenseKey}\nPlan: {plan}\nValid Until: {validUntil}\n\nFor support contact: ' +
        supportEmail
    });

    await AuditLog.create({
      eventType: 'test_email_sent',
      email: testTo,
      status: 'success',
      details: `SMTP test email sent to ${testTo}`
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      sentTo: testTo
    });
  } catch (error) {
    await AuditLog.create({
      eventType: 'test_email_failed',
      email: process.env.FROM_EMAIL || '',
      status: 'failed',
      details: error.message
    }).catch(() => {});

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/licenses', adminAuth, async (req, res) => {
  try {
    const licenses = await License.find().sort({ createdAt: -1 });
    res.json({ success: true, licenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/license/:id', adminAuth, async (req, res) => {
  try {
    const { email, plan, status, maxDevices, validUntil, machineName } = req.body || {};
    const license = await License.findById(req.params.id);

    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    if (typeof email === 'string' && email.trim()) license.email = email.trim().toLowerCase();
    if (typeof plan === 'string') license.plan = plan.trim();
    if (typeof status === 'string') license.status = status.trim();
    if (typeof maxDevices === 'number') license.maxDevices = maxDevices;
    if (typeof validUntil === 'string' && validUntil) license.validUntil = new Date(validUntil);
    if (typeof machineName === 'string') license.machineName = machineName.trim();

    await license.save();

    await AuditLog.create({
      eventType: 'license_updated',
      email: license.email,
      status: 'success',
      details: `Admin updated license ${license.licenseKey}`
    });

    res.json({ success: true, message: 'License updated successfully', license });
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

router.get('/payments', adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/logs', adminAuth, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/coupons', adminAuth, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/coupons', adminAuth, async (req, res) => {
  try {
    const { code, name, discountType = 'percent', discountValue = 0, maxRedemptions = null, expiresAt = null } = req.body || {};
    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'code and discountValue are required' });
    }
    const couponCode = String(code).trim().toUpperCase();
    const exists = await Coupon.findOne({ code: couponCode });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Coupon already exists' });
    }
    let stripeCouponId = '';
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripeCoupon = await stripe.coupons.create(
          discountType === 'percent'
            ? { percent_off: Number(discountValue), duration: 'once', name: name || couponCode, max_redemptions: maxRedemptions || undefined, redeem_by: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined }
            : { amount_off: Math.round(Number(discountValue) * 100), currency: 'usd', duration: 'once', name: name || couponCode, max_redemptions: maxRedemptions || undefined, redeem_by: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined }
        );
        stripeCouponId = stripeCoupon.id;
      }
    } catch (stripeError) {
      console.error('Stripe coupon create failed:', stripeError.message);
    }

    const coupon = await Coupon.create({
      code: couponCode,
      name: name || couponCode,
      discountType,
      discountValue: Number(discountValue),
      maxRedemptions: maxRedemptions || null,
      expiresAt: expiresAt || null,
      stripeCouponId,
      isActive: true
    });

    await AuditLog.create({ eventType: 'coupon_created', email: '', status: 'success', details: `Coupon created: ${coupon.code}` });
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/coupons/:id', adminAuth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    const { isActive, name, maxRedemptions, expiresAt } = req.body || {};
    if (typeof isActive === 'boolean') coupon.isActive = isActive;
    if (typeof name === 'string') coupon.name = name.trim();
    if (maxRedemptions !== undefined) coupon.maxRedemptions = maxRedemptions || null;
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt || null;
    await coupon.save();
    await AuditLog.create({ eventType: 'coupon_updated', email: '', status: 'success', details: `Coupon updated: ${coupon.code}` });
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/coupons/:id', adminAuth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await Coupon.findByIdAndDelete(req.params.id);
    await AuditLog.create({ eventType: 'coupon_deleted', email: '', status: 'success', details: `Coupon deleted: ${coupon.code}` });
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

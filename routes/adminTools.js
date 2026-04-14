const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const EmailTemplate = require('../models/EmailTemplate');
const AdminSetting = require('../models/AdminSetting');
const Payment = require('../models/Payment');
const License = require('../models/License');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// ---------- EMAIL TEMPLATES ----------
const DEFAULT_TEMPLATES = [
  {
    key: 'license_issue',
    name: 'License Issue',
    subject: 'Your Sembhi Bot Ultimate License',
    body: 'Hello {name},

Your payment was successful.

License Key: {licenseKey}
Plan: {plan}
Valid Until: {validUntil}

Thank you for choosing Sembhi Bot Ultimate.',
    isActive: true
  },
  {
    key: 'renewal',
    name: 'Renewal Reminder',
    subject: 'Renewal Reminder',
    body: 'Hello {name},\n\nYour plan {plan} is due for renewal soon.\n\nRegards,\nSBU Support',
    isActive: true
  },
  {
    key: 'disabled_account',
    name: 'Disabled Account',
    subject: 'Account Disabled Notice',
    body: 'Hello {name},\n\nYour account is currently disabled. Please contact support for help.\n\nRegards,\nSBU Support',
    isActive: true
  },
  {
    key: 'manual_support',
    name: 'Manual Support',
    subject: 'Support Update',
    body: 'Hello {name},\n\nWe are updating you regarding your support request.\n\nRegards,\nSBU Support',
    isActive: true
  }
];

router.post('/templates/seed', adminAuth, async (req, res) => {
  try {
    for (const item of DEFAULT_TEMPLATES) {
      await EmailTemplate.findOneAndUpdate(
        { key: item.key },
        { $setOnInsert: item },
        { upsert: true, new: true }
      );
    }

    await AuditLog.create({
      eventType: 'templates_seeded',
      email: '',
      status: 'success',
      details: 'Default email templates seeded'
    });

    return res.json({ success: true, message: 'Default templates seeded successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/templates', adminAuth, async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: 1 });
    return res.json({ success: true, templates });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/template/:key', adminAuth, async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({ key: req.params.key.trim() });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    return res.json({ success: true, template });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/template', adminAuth, async (req, res) => {
  try {
    const { key, name, subject, body, isActive = true } = req.body || {};
    if (!key || !name || !subject || !body) {
      return res.status(400).json({ success: false, message: 'key, name, subject and body are required' });
    }

    const exists = await EmailTemplate.findOne({ key: String(key).trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Template key already exists' });
    }

    const template = await EmailTemplate.create({
      key: String(key).trim(),
      name: String(name).trim(),
      subject: String(subject).trim(),
      body: String(body),
      isActive: Boolean(isActive)
    });

    await AuditLog.create({
      eventType: 'template_created',
      email: '',
      status: 'success',
      details: `Template created: ${template.key}`
    });

    return res.json({ success: true, message: 'Template created successfully', template });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/template/:id', adminAuth, async (req, res) => {
  try {
    const { name, subject, body, isActive } = req.body || {};
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    if (typeof name === 'string') template.name = name.trim();
    if (typeof subject === 'string') template.subject = subject.trim();
    if (typeof body === 'string') template.body = body;
    if (typeof isActive === 'boolean') template.isActive = isActive;

    await template.save();

    await AuditLog.create({
      eventType: 'template_updated',
      email: '',
      status: 'success',
      details: `Template updated: ${template.key}`
    });

    return res.json({ success: true, message: 'Template updated successfully', template });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ---------- ADMIN SETTINGS ----------
const DEFAULT_SETTINGS = [
  { key: 'business_name', value: 'Sembhi Bot Ultimate', category: 'branding' },
  { key: 'support_email', value: 'sembhibotultimate@gmail.com', category: 'contact' },
  { key: 'support_phone', value: '0432 563 568', category: 'contact' },
  { key: 'business_location', value: 'Melbourne, Australia', category: 'contact' },
  { key: 'default_currency', value: 'AUD', category: 'billing' }
];

router.post('/settings/seed', adminAuth, async (req, res) => {
  try {
    for (const item of DEFAULT_SETTINGS) {
      await AdminSetting.findOneAndUpdate(
        { key: item.key },
        { $setOnInsert: item },
        { upsert: true, new: true }
      );
    }

    await AuditLog.create({
      eventType: 'settings_seeded',
      email: '',
      status: 'success',
      details: 'Default admin settings seeded'
    });

    return res.json({ success: true, message: 'Default settings seeded successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/settings', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSetting.find().sort({ category: 1, key: 1 });
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/setting/:id', adminAuth, async (req, res) => {
  try {
    const { value } = req.body || {};
    const setting = await AdminSetting.findById(req.params.id);
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    setting.value = value;
    await setting.save();

    await AuditLog.create({
      eventType: 'setting_updated',
      email: '',
      status: 'success',
      details: `Setting updated: ${setting.key}`
    });

    return res.json({ success: true, message: 'Setting updated successfully', setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ---------- INVOICE AUTO-FILL HELPERS ----------
router.get('/invoice/payment/:id', adminAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const license = payment.email
      ? await License.findOne({ email: payment.email }).sort({ createdAt: -1 })
      : null;

    const user = payment.email
      ? await User.findOne({ email: payment.email.toLowerCase().trim() })
      : null;

    return res.json({
      success: true,
      invoiceData: {
        invoiceNumber: payment.orderId || payment._id,
        invoiceDate: payment.createdAt,
        customerName: user?.name || user?.firstName || 'Customer',
        customerEmail: payment.email || '',
        planName: license?.plan || 'Sembhi Bot Ultimate',
        licenseKey: license?.licenseKey || '',
        amount: `${payment.amountTotal || 0} ${payment.currency || ''}`.trim(),
        status: payment.status || 'Paid',
        notes: `Autofilled from payment ${payment._id}`
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/invoice/license/:id', adminAuth, async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    const user = license.email
      ? await User.findOne({ email: license.email.toLowerCase().trim() })
      : null;

    return res.json({
      success: true,
      invoiceData: {
        invoiceNumber: license.orderId || license._id,
        invoiceDate: license.createdAt,
        customerName: user?.name || user?.firstName || 'Customer',
        customerEmail: license.email || '',
        planName: license.plan || 'Sembhi Bot Ultimate',
        licenseKey: license.licenseKey || '',
        amount: '',
        status: license.status || 'Active',
        notes: `Autofilled from license ${license._id}`
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

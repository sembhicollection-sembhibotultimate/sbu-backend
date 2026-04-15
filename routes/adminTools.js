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
    subject: 'Your Sembhi Bot Ultimate License Is Ready',
    body: `Hello {name},

Thank you for your purchase of Sembhi Bot Ultimate.

Your payment has been received successfully, and your license is now ready to use.

License Key: {licenseKey}
Plan: {plan}
Valid Until: {validUntil}

Important:
- Please keep your license key secure.
- Use the same details during activation inside your bot.
- If you face any activation issue, contact support.

Thank you for choosing Sembhi Bot Ultimate.

Regards,
Sembhi Bot Ultimate Support`,
    isActive: true
  },
  {
    key: 'renewal',
    name: 'Renewal Reminder',
    subject: 'Your Sembhi Bot Ultimate Plan Is Due For Renewal',
    body: `Hello {name},

This is a friendly reminder that your Sembhi Bot Ultimate plan is due for renewal soon.

Plan: {plan}
Current Valid Until: {validUntil}

To avoid interruption in access, please renew your subscription before the expiry date.

If you need any help, our support team is here for you.

Regards,
Sembhi Bot Ultimate Support`,
    isActive: true
  },
  {
    key: 'payment_failed',
    name: 'Payment Failed',
    subject: 'Payment Failed For Your Sembhi Bot Ultimate Subscription',
    body: `Hello {name},

We were unable to process your latest subscription payment for Sembhi Bot Ultimate.

Plan: {plan}

Please update your payment method or complete the payment as soon as possible to avoid service interruption.

If you believe this was a mistake, please contact support.

Regards,
Sembhi Bot Ultimate Support`,
    isActive: true
  },
  {
    key: 'license_renewed',
    name: 'License Renewed',
    subject: 'Your Sembhi Bot Ultimate License Has Been Renewed',
    body: `Hello {name},

Your Sembhi Bot Ultimate subscription has been renewed successfully.

Plan: {plan}
Updated Valid Until: {validUntil}

Your license remains active, and no further action is required at this time.

Thank you for staying with Sembhi Bot Ultimate.

Regards,
Sembhi Bot Ultimate Support`,
    isActive: true
  },
  {
    key: 'disabled_account',
    name: 'Disabled Account',
    subject: 'Important Notice About Your Sembhi Bot Ultimate Account',
    body: `Hello {name},

Your Sembhi Bot Ultimate account is currently inactive or disabled.

If you think this happened by mistake, please contact support so we can review your account and help you restore access.

Regards,
Sembhi Bot Ultimate Support`,
    isActive: true
  },
  {
    key: 'manual_support',
    name: 'Manual Support',
    subject: 'Update From Sembhi Bot Ultimate Support',
    body: `Hello {name},

We are contacting you regarding your recent request.

Our support team is reviewing your issue and will guide you with the next steps as needed.

Thank you for your patience and support.

Regards,
Sembhi Bot Ultimate Support`,
    isActive: true
  },
  {
    key: 'welcome_signup',
    name: 'Welcome Signup',
    subject: 'Welcome To Sembhi Bot Ultimate',
    body: `Hello {name},

Welcome to Sembhi Bot Ultimate.

Your account has been created successfully. We are excited to have you with us.

You can now continue with your subscription, license activation, and platform access.

If you need help at any stage, please contact support.

Regards,
Sembhi Bot Ultimate Support`,
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


router.get('/settings-map', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSetting.find();
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    return res.json({ success: true, settings: map });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});

router.post('/settings/bulk', adminAuth, async (req, res) => {
  try {
    const payload = req.body?.settings || {};
    for (const [key, value] of Object.entries(payload)) {
      await AdminSetting.findOneAndUpdate({ key }, { key, value, category: 'cms' }, { upsert: true, new: true });
    }
    return res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
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

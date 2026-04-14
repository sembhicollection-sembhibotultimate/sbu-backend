const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');

const SMTP_HOST = String(process.env.SMTP_HOST || '').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = String(process.env.SMTP_USER || '').trim();
const SMTP_PASS = String(process.env.SMTP_PASS || '').trim();

const FROM_EMAIL = String(process.env.FROM_EMAIL || SMTP_USER || '').trim();
const FROM_NAME = String(process.env.FROM_NAME || 'Sembhi Bot Ultimate').trim();
const SUPPORT_EMAIL = String(
  process.env.SUPPORT_EMAIL || 'support@sembhibotultimate.com'
).trim();

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  requireTLS: true,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false
  }
});

function replaceVars(str = '', vars = {}) {
  let output = String(str || '');

  Object.keys(vars).forEach((key) => {
    const value =
      vars[key] === undefined || vars[key] === null ? '' : String(vars[key]);

    output = output.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    output = output.replace(
      new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'),
      value
    );
  });

  return output;
}

function nl2br(text = '') {
  return String(text).replace(/\n/g, '<br/>');
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildButtonHtml(label, url) {
  if (!label || !url) return '';

  return `
    <div style="margin:24px 0 8px 0;">
      <a href="${url}"
         style="display:inline-block;background:#f3c75f;color:#111111;text-decoration:none;
                padding:12px 20px;border-radius:10px;font-weight:700;font-size:14px;
                font-family:Arial,sans-serif;">
        ${escapeHtml(label)}
      </a>
    </div>
  `;
}

function getEmailShell({ title = 'Sembhi Bot Ultimate', bodyHtml = '' }) {
  return `
  <div style="margin:0;padding:0;background:#060606;">
    <div style="max-width:700px;margin:0 auto;padding:30px 16px;">
      <div style="background:#0d0d0d;border:1px solid #242424;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.35);">

        <div style="padding:24px;background:linear-gradient(135deg,#0d0d0d 0%,#171717 100%);border-bottom:1px solid #222;">
          <div style="font-family:Arial,sans-serif;font-size:28px;font-weight:800;color:#f3c75f;letter-spacing:0.4px;">
            ${escapeHtml(title)}
          </div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#9e9e9e;margin-top:6px;">
            Professional Trading Automation Platform
          </div>
        </div>

        <div style="padding:28px 24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.8;color:#f3f3f3;">
          ${bodyHtml}
        </div>

        <div style="padding:18px 24px;border-top:1px solid #222;background:#0a0a0a;">
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#9a9a9a;">
            This is an automated email from Sembhi Bot Ultimate.
          </div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#9a9a9a;margin-top:6px;">
            Support: ${escapeHtml(SUPPORT_EMAIL)}
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

function buildDefaultTemplateBody(text = '', options = {}) {
  const {
    buttonLabel = '',
    buttonUrl = '',
    title = 'Sembhi Bot Ultimate'
  } = options;

  const bodyHtml = `
    <div>${nl2br(escapeHtml(text))}</div>
    ${buildButtonHtml(buttonLabel, buttonUrl)}
  `;

  return getEmailShell({
    title,
    bodyHtml
  });
}

async function getTemplateByKey(key) {
  if (!key) return null;

  return EmailTemplate.findOne({
    key: String(key).trim(),
    isActive: true
  });
}

async function sendTemplateEmail({
  to,
  templateKey,
  variables = {},
  fallbackSubject = '',
  fallbackBody = '',
  customHtml = '',
  buttonLabel = '',
  buttonUrl = '',
  title = 'Sembhi Bot Ultimate'
}) {
  if (!to) {
    throw new Error('Recipient email is required');
  }

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
    throw new Error('Email configuration is incomplete');
  }

  const template = await getTemplateByKey(templateKey);

  const subject = template
    ? replaceVars(template.subject, variables)
    : replaceVars(fallbackSubject, variables);

  const body = template
    ? replaceVars(template.body, variables)
    : replaceVars(fallbackBody, variables);

  const html = customHtml
    ? customHtml
    : buildDefaultTemplateBody(body, {
        buttonLabel,
        buttonUrl,
        title
      });

  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html
  });

  console.log(`✅ Email sent to ${to} | messageId=${info.messageId}`);
  return info;
}

async function sendLicenseEmail({
  to,
  name,
  licenseKey,
  validUntil,
  plan = 'Monthly',
  portalUrl = ''
}) {
  return sendTemplateEmail({
    to,
    templateKey: 'license_issue',
    variables: {
      name: name || 'User',
      licenseKey: licenseKey || '',
      validUntil: validUntil
        ? new Date(validUntil).toLocaleDateString('en-AU')
        : '',
      plan: plan || 'Monthly',
      supportEmail: SUPPORT_EMAIL
    },
    fallbackSubject: 'Your Sembhi Bot Ultimate License Is Ready',
    fallbackBody:
      'Hello {name},\n\nThank you for your purchase of Sembhi Bot Ultimate.\n\nYour payment has been received successfully, and your license is now ready to use.\n\nLicense Key: {licenseKey}\nPlan: {plan}\nValid Until: {validUntil}\n\nPlease keep your license key secure.\n\nIf you need help, contact: {supportEmail}\n\nRegards,\nSembhi Bot Ultimate Support',
    buttonLabel: portalUrl ? 'Open Customer Portal' : '',
    buttonUrl: portalUrl || ''
  });
}

async function sendRenewalReminderEmail({
  to,
  name,
  plan = 'Monthly',
  validUntil,
  billingUrl = ''
}) {
  return sendTemplateEmail({
    to,
    templateKey: 'renewal',
    variables: {
      name: name || 'User',
      plan: plan || 'Monthly',
      validUntil: validUntil
        ? new Date(validUntil).toLocaleDateString('en-AU')
        : '',
      supportEmail: SUPPORT_EMAIL
    },
    fallbackSubject: 'Your Sembhi Bot Ultimate Plan Is Due For Renewal',
    fallbackBody:
      'Hello {name},\n\nThis is a friendly reminder that your Sembhi Bot Ultimate plan is due for renewal soon.\n\nPlan: {plan}\nCurrent Valid Until: {validUntil}\n\nPlease renew before expiry to avoid interruption.\n\nNeed help? Contact: {supportEmail}\n\nRegards,\nSembhi Bot Ultimate Support',
    buttonLabel: billingUrl ? 'Manage Billing' : '',
    buttonUrl: billingUrl || ''
  });
}

async function sendPaymentFailedEmail({
  to,
  name,
  plan = 'Monthly',
  billingUrl = ''
}) {
  return sendTemplateEmail({
    to,
    templateKey: 'payment_failed',
    variables: {
      name: name || 'User',
      plan: plan || 'Monthly',
      supportEmail: SUPPORT_EMAIL
    },
    fallbackSubject: 'Payment Failed For Your Sembhi Bot Ultimate Subscription',
    fallbackBody:
      'Hello {name},\n\nWe were unable to process your latest subscription payment for Sembhi Bot Ultimate.\n\nPlan: {plan}\n\nPlease update your payment method to avoid service interruption.\n\nNeed help? Contact: {supportEmail}\n\nRegards,\nSembhi Bot Ultimate Support',
    buttonLabel: billingUrl ? 'Update Payment Method' : '',
    buttonUrl: billingUrl || ''
  });
}

async function sendLicenseRenewedEmail({
  to,
  name,
  plan = 'Monthly',
  validUntil,
  portalUrl = ''
}) {
  return sendTemplateEmail({
    to,
    templateKey: 'license_renewed',
    variables: {
      name: name || 'User',
      plan: plan || 'Monthly',
      validUntil: validUntil
        ? new Date(validUntil).toLocaleDateString('en-AU')
        : '',
      supportEmail: SUPPORT_EMAIL
    },
    fallbackSubject: 'Your Sembhi Bot Ultimate License Has Been Renewed',
    fallbackBody:
      'Hello {name},\n\nYour Sembhi Bot Ultimate subscription has been renewed successfully.\n\nPlan: {plan}\nUpdated Valid Until: {validUntil}\n\nIf you need help, contact: {supportEmail}\n\nRegards,\nSembhi Bot Ultimate Support',
    buttonLabel: portalUrl ? 'Open Customer Portal' : '',
    buttonUrl: portalUrl || ''
  });
}

async function sendWelcomeSignupEmail({
  to,
  name,
  portalUrl = ''
}) {
  return sendTemplateEmail({
    to,
    templateKey: 'welcome_signup',
    variables: {
      name: name || 'User',
      supportEmail: SUPPORT_EMAIL
    },
    fallbackSubject: 'Welcome To Sembhi Bot Ultimate',
    fallbackBody:
      'Hello {name},\n\nWelcome to Sembhi Bot Ultimate.\n\nYour account has been created successfully.\n\nIf you need any help, contact: {supportEmail}\n\nRegards,\nSembhi Bot Ultimate Support',
    buttonLabel: portalUrl ? 'Open Customer Portal' : '',
    buttonUrl: portalUrl || ''
  });
}

module.exports = {
  sendTemplateEmail,
  sendLicenseEmail,
  sendRenewalReminderEmail,
  sendPaymentFailedEmail,
  sendLicenseRenewedEmail,
  sendWelcomeSignupEmail
};

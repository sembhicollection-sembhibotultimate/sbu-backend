const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');

const SMTP_HOST = String(process.env.SMTP_HOST || '').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = String(process.env.SMTP_USER || '').trim();
const SMTP_PASS = String(process.env.SMTP_PASS || '').trim();
const FROM_EMAIL = String(process.env.FROM_EMAIL || SMTP_USER || '').trim();
const FROM_NAME = String(process.env.FROM_NAME || 'Sembhi Bot Ultimate').trim();

const SMTP_SECURE =
  String(process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true'
    ? true
    : SMTP_PORT === 465;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  logger: false,
  debug: false
});

function replaceVars(str = '', vars = {}) {
  let output = String(str || '');

  Object.keys(vars).forEach((key) => {
    const value =
      vars[key] === undefined || vars[key] === null ? '' : String(vars[key]);

    output = output.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    output = output.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
  });

  return output;
}

function nl2br(text = '') {
  return String(text).replace(/\n/g, '<br/>');
}

function getEmailShell(innerHtml = '') {
  return `
  <div style="margin:0;padding:0;background:#060606;">
    <div style="max-width:680px;margin:0 auto;padding:32px 18px;">
      <div style="background:#0d0d0d;border:1px solid #262626;border-radius:18px;overflow:hidden;">
        
        <div style="padding:22px 24px;border-bottom:1px solid #222;background:linear-gradient(90deg,#0d0d0d,#151515);">
          <div style="font-family:Arial,sans-serif;font-size:26px;font-weight:800;color:#f1c75b;letter-spacing:0.3px;">
            Sembhi Bot Ultimate
          </div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#9b9b9b;margin-top:6px;">
            Professional Trading Automation Platform
          </div>
        </div>

        <div style="padding:28px 24px;font-family:Arial,sans-serif;color:#f2f2f2;font-size:15px;line-height:1.75;">
          ${innerHtml}
        </div>

        <div style="padding:18px 24px;border-top:1px solid #222;background:#0a0a0a;">
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#9a9a9a;">
            This is an automated email from Sembhi Bot Ultimate.
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

async function verifyEmailServer() {
  try {
    console.log('📨 SMTP check starting...');
    console.log(`SMTP_HOST=${SMTP_HOST || '(empty)'}`);
    console.log(`SMTP_PORT=${SMTP_PORT}`);
    console.log(`SMTP_SECURE=${SMTP_SECURE}`);
    console.log(`SMTP_USER=${SMTP_USER ? 'SET' : 'MISSING'}`);
    console.log(`SMTP_PASS=${SMTP_PASS ? 'SET' : 'MISSING'}`);
    console.log(`FROM_EMAIL=${FROM_EMAIL || '(empty)'}`);

    if (!SMTP_HOST) throw new Error('SMTP_HOST missing');
    if (!SMTP_PORT) throw new Error('SMTP_PORT missing');
    if (!SMTP_USER) throw new Error('SMTP_USER missing');
    if (!SMTP_PASS) throw new Error('SMTP_PASS missing');
    if (!FROM_EMAIL) throw new Error('FROM_EMAIL missing');

    await transporter.verify();
    console.log('✅ SMTP connected successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP verify failed:', error.message);
    return false;
  }
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
  fallbackBody = ''
}) {
  if (!to) {
    throw new Error('Recipient email is required');
  }

  const template = await getTemplateByKey(templateKey);

  const subject = template
    ? replaceVars(template.subject, variables)
    : replaceVars(fallbackSubject, variables);

  const body = template
    ? replaceVars(template.body, variables)
    : replaceVars(fallbackBody, variables);

  const html = getEmailShell(`
    <div style="white-space:normal;">
      ${nl2br(body)}
    </div>
  `);

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
  plan = 'Monthly'
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
      plan: plan || 'Monthly'
    },
    fallbackSubject: 'Your Sembhi Bot Ultimate License Is Ready',
    fallbackBody:
      'Hello {name},\n\nThank you for your purchase of Sembhi Bot Ultimate.\n\nYour payment has been received successfully, and your license is now ready to use.\n\nLicense Key: {licenseKey}\nPlan: {plan}\nValid Until: {validUntil}\n\nThank you for choosing Sembhi Bot Ultimate.'
  });
}

async function sendPaymentFailedEmail({
  to,
  name,
  plan = 'Monthly'
}) {
  return sendTemplateEmail({
    to,
    templateKey: 'payment_failed',
    variables: {
      name: name || 'User',
      plan: plan || 'Monthly'
    },
    fallbackSubject: 'Payment Failed For Your Sembhi Bot Ultimate Subscription',
    fallbackBody:
      'Hello {name},\n\nWe were unable to process your latest subscription payment for Sembhi Bot Ultimate.\n\nPlan: {plan}\n\nPlease update your payment method to avoid interruption.'
  });
}

async function sendRenewalReminderEmail({
  to,
  name,
  plan = 'Monthly',
  validUntil
}) {
  return sendTemplateEmail({
    to,
    templateKey: 'renewal',
    variables: {
      name: name || 'User',
      plan: plan || 'Monthly',
      validUntil: validUntil
        ? new Date(validUntil).toLocaleDateString('en-AU')
        : ''
    },
    fallbackSubject: 'Your Sembhi Bot Ultimate Plan Is Due For Renewal',
    fallbackBody:
      'Hello {name},\n\nYour plan {plan} is due for renewal soon.\n\nCurrent Valid Until: {validUntil}\n\nPlease renew in time to avoid interruption.'
  });
}

module.exports = {
  verifyEmailServer,
  sendTemplateEmail,
  sendLicenseEmail,
  sendPaymentFailedEmail,
  sendRenewalReminderEmail
};

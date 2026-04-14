const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function replaceVars(str = '', vars = {}) {
  let output = String(str || '');

  Object.keys(vars).forEach((key) => {
    const value = vars[key] === undefined || vars[key] === null ? '' : String(vars[key]);
    const regex1 = new RegExp(`\\{${key}\\}`, 'g');
    const regex2 = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    output = output.replace(regex1, value).replace(regex2, value);
  });

  return output;
}

function nl2br(text = '') {
  return String(text).replace(/\n/g, '<br/>');
}

async function getTemplateByKey(key) {
  if (!key) return null;
  return EmailTemplate.findOne({ key: String(key).trim(), isActive: true });
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

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;background:#0b0b0b;color:#f5f5f5;border:1px solid #2a2a2a;border-radius:14px;">
      <div style="font-size:24px;font-weight:700;color:#f5c542;margin-bottom:18px;">Sembhi Bot Ultimate</div>
      <div style="font-size:15px;line-height:1.7;color:#f1f1f1;">
        ${nl2br(body)}
      </div>
      <div style="margin-top:24px;font-size:12px;color:#999;">
        This is an automated email from Sembhi Bot Ultimate.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html
  });

  return true;
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
      validUntil: validUntil ? new Date(validUntil).toLocaleDateString() : '',
      plan: plan || 'Monthly'
    },
    fallbackSubject: 'Your Sembhi Bot Ultimate License',
    fallbackBody:
      'Hello {name},\n\nYour license key is: {licenseKey}\nPlan: {plan}\nValid Until: {validUntil}\n\nThank you.'
  });
}

module.exports = {
  sendLicenseEmail,
  sendTemplateEmail
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendLicenseEmail({ to, name, licenseKey, validUntil }) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
      <h2>Welcome to Sembhi Bot Ultimate</h2>
      <p>Hello ${name || 'User'},</p>
      <p>Your payment was successful. Your license key is below:</p>
      <div style="padding:15px;background:#111;color:#f5c542;font-size:18px;font-weight:bold;border-radius:8px;word-break:break-all;">
        ${licenseKey}
      </div>
      <p style="margin-top:15px;">Valid until: <strong>${new Date(validUntil).toLocaleDateString()}</strong></p>
      <p>Login to your member portal to view your active license.</p>
      <p>Regards,<br/>Sembhi Bot Ultimate Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: 'Your Sembhi Bot Ultimate License Key',
    html
  });
}

module.exports = { sendLicenseEmail };

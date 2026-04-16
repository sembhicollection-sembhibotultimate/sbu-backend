import nodemailer from "nodemailer";

function canSendEmail() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!canSendEmail()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendMail(options) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured. Email skipped.");
    return { sent: false };
  }
  await transporter.sendMail(options);
  return { sent: true };
}

export async function sendAgreementPdfEmail({ user, pdfBuffer }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
  return sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `New SBU signup agreement - ${user.fullName}`,
    text: `A new signup agreement was completed by ${user.fullName} (${user.email}). The PDF is attached.`,
    attachments: [
      {
        filename: `SBU-Agreement-${String(user.fullName || "User").replace(/\s+/g, "-")}.pdf`,
        content: pdfBuffer
      }
    ]
  });
}

export async function sendLicenseIssuedEmail({ to, fullName, licenseKey, plan = "monthly", portalUrl }) {
  return sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Your Sembhi Bot Ultimate license is ready",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.65;color:#111;max-width:680px;margin:auto;">
        <h2 style="margin-bottom:8px;">Sembhi Bot Ultimate</h2>
        <p>Hello ${fullName || "Member"},</p>
        <p>Your access has been activated.</p>
        <div style="padding:16px;border:1px solid #ddd;border-radius:12px;background:#fafafa;">
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>License Key:</strong> ${licenseKey}</p>
          <p><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
        </div>
        <p style="margin-top:18px;">Please keep this key private. This product is software and educational workflow support. It is not personal financial advice.</p>
      </div>
    `
  });
}

export async function sendCustomMessage({ to, subject, messageHtml }) {
  return sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: messageHtml
  });
}

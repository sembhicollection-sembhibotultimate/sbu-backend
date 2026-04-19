import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

async function sendMailSafe(payload) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("SMTP not configured. Email skipped.");
    return { skipped: true };
  }
  return transporter.sendMail(payload);
}

export async function sendAgreementPdfEmail({ user, pdfBuffer, to }) {
  return sendMailSafe({
    from: process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER,
    to: to || user?.email,
    subject: "User Agreement PDF",
    text: "User agreement attached.",
    attachments: [{ filename: "agreement.pdf", content: pdfBuffer }]
  });
}

export async function sendLicenseIssuedEmail({ to, fullName = "", licenseKey, plan = "monthly", portalUrl = "" }) {
  return sendMailSafe({
    from: process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER,
    to,
    subject: "Your Sembhi Bot Ultimate License",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111">
        <h2>Sembhi Bot Ultimate</h2>
        <p>Hello ${fullName || "Member"},</p>
        <p>Your access has been activated.</p>
        <p><strong>Plan:</strong> ${plan}</p>
        <p><strong>License Key:</strong> ${licenseKey}</p>
        <p><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
      </div>
    `
  });
}

export const sendLicenseEmail = sendLicenseIssuedEmail;

export async function sendSimpleEmail({ to, subject, html, text = "" }) {
  return sendMailSafe({
    from: process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER,
    to, subject, html, text
  });
}

export async function sendBulkEmail({ recipients, subject, html, text = "" }) {
  if (!Array.isArray(recipients) || recipients.length === 0) return { skipped: true };
  return sendMailSafe({
    from: process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER,
    bcc: recipients.join(","),
    subject, html, text
  });
}

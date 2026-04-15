import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendLicenseEmail({ to, fullName = "", licenseKey, portalUrl }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("SMTP not configured. Skipping license email.");
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2>Sembhi Bot Ultimate</h2>
      <p>Hello ${fullName || "Member"},</p>
      <p>Your access has been activated.</p>
      <p><strong>License Key:</strong> ${licenseKey}</p>
      <p><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
      <p>Keep this key private. This product is software and educational workflow support. It is not personal financial advice.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject: "Your Sembhi Bot Ultimate License",
    html
  });
}

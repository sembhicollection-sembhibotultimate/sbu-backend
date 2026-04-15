import nodemailer from "nodemailer";

function canSendEmail() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendAgreementPdfEmail({ user, pdfBuffer }) {
  if (!canSendEmail()) {
    console.warn("SMTP not configured. Agreement email skipped.");
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.SUPPORT_EMAIL;

  await transporter.sendMail({
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

  return { sent: true };
}

// V14 PATCH ADDITIONS
// Copy these exports into your existing src/services/emailService.js if needed.

export async function sendPasswordResetEmail({ to, fullName = "", resetUrl }) {
  return sendMailSafe({
    from: process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER,
    to,
    subject: "Reset your Sembhi Bot Ultimate password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111">
        <h2>Sembhi Bot Ultimate</h2>
        <p>Hello ${fullName || "Member"},</p>
        <p>We received a password reset request for your account.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#d7bc5a;color:#111;text-decoration:none;border-radius:999px;font-weight:bold">Reset Password</a></p>
        <p>If the button does not work, open this link:</p>
        <p>${resetUrl}</p>
        <p>This link expires in 30 minutes.</p>
      </div>
    `,
    text: `Reset your password here: ${resetUrl}`
  });
}\n
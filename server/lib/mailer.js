/**
 * Minimal "mailer": in dev, prints reset link to console.
 * You can later plug nodemailer with SMTP env vars.
 */
export async function sendResetEmail({ to, link }) {
  // If SMTP not configured, print to console
  if (!process.env.SMTP_HOST) {
    console.log("📧 Password reset link (dev):", link);
    console.log("   (Configure SMTP_* env vars to send real emails.)");
    return;
  }
  // Keeping this simple: no nodemailer dependency to avoid extra setup.
  // In production you should use nodemailer or an email provider API.
  console.log("SMTP configured but mailer not implemented in this template. Use nodemailer.");
  console.log("Reset link:", link);
}

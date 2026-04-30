import nodemailer from "nodemailer";

let transporter;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required email configuration: ${name}`);
  }
  return value;
}

function createTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = getRequiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendPasswordResetOtpEmail({ email, otp, fullName }) {
  const mailer = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "FinSync";

  await mailer.sendMail({
    from,
    to: email,
    subject: `Reset your ${appName} password`,
    text: `Hello ${fullName || "there"}, your ${appName} password reset OTP is ${otp}. It expires in 10 minutes.`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="background-color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <div style="padding: 40px 32px 20px 32px; text-align: center;">
            <img 
              src="./FinSync.png" 
              alt="${appName} Logo" 
              style="height: 42px; width: auto; margin-bottom: 24px; display: inline-block;"
            >
            <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">
              Password Reset
            </h2>
          </div>

          <div style="padding: 0 40px 40px 40px; color: #475569; font-size: 16px; line-height: 1.6;">
            <p style="margin-top: 0;">Hello ${fullName || "there"},</p>
            <p>We received a request to access your <strong>${appName}</strong> account. Please use the verification code below to reset your password:</p>
            
            <div style="margin: 32px 0; padding: 24px; background-color: #f1f5f9; border-radius: 12px; text-align: center;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 8px; font-weight: 600;">
                Verification Code
              </span>
              <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #059669; font-family: 'Courier New', Courier, monospace;">
                ${otp}
              </div>
            </div>

            <p style="font-size: 14px; margin-bottom: 0;">
              This code will expire in <span style="color: #e11d48; font-weight: 600;">10 minutes</span>. 
              If you did not request this, you can safely ignore this email and your password will remain unchanged.
            </p>
          </div>

          <div style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
            </p>
            <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
              <a href="/support" style="color: #6366f1; text-decoration: none;">Contact</a> 
              &nbsp; • &nbsp; 
              <a href="/help" style="color: #6366f1; text-decoration: none;">Privacy Policy</a>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #cbd5e1;">
          Sent to you because of a password reset request on your account.
        </div>
      </div>
    </body>
    </html>
  `,
  });
}

export async function sendSuperadminSignupAlertEmail({
  recipients,
  organizationName,
  adminEmail,
  planName,
  amount,
  transactionUuid,
  paidAt,
}) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return { sent: false, reason: "No recipients found" };
  }
  try {
    const mailer = createTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || "FinSync";
    const formattedAmount =
      amount !== undefined && amount !== null ? `NPR ${amount}` : "N/A";
    const paymentTimestamp = paidAt || new Date().toISOString();

    await mailer.sendMail({
      from,
      to: recipients.join(", "),
      subject: `[${appName}] New paid organization activated`,
      text: [
        `A payment has been completed and an admin account has been created in ${appName}.`,
        `Organization: ${organizationName || "N/A"}`,
        `Admin email: ${adminEmail || "N/A"}`,
        `Plan: ${planName || "N/A"}`,
        `Amount: ${formattedAmount}`,
        `Transaction ID: ${transactionUuid || "N/A"}`,
        `Paid at: ${paymentTimestamp}`,
      ].join("\n"),
      html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 16px;">New paid organization activated</h2>
        <p>A payment was completed and an admin account was provisioned in <strong>${appName}</strong>.</p>
        <table style="border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Organization</strong></td><td>${organizationName || "N/A"}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Admin email</strong></td><td>${adminEmail || "N/A"}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Plan</strong></td><td>${planName || "N/A"}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Amount</strong></td><td>${formattedAmount}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Transaction ID</strong></td><td>${transactionUuid || "N/A"}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Paid at</strong></td><td>${paymentTimestamp}</td></tr>
        </table>
      </div>
    `,
    });

    return { sent: true };
  } catch (error) {
    console.error("sendSuperadminSignupAlertEmail failed:", error.message);
    return { sent: false, reason: error.message };
  }
}

import nodemailer from "nodemailer";

let transporter;
const DEFAULT_EMAIL_LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1gbUZ6OjSyotrMX3Puhb0hWhc469c4-bT";

export function getEmailLogoMarkup(appName = "FinSync") {
  const logoUrl = process.env.EMAIL_LOGO_URL || DEFAULT_EMAIL_LOGO_URL;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
      <tr>
        <td style="background-color:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:10px 14px;">
          <img
            src="${logoUrl}"
            width="150"
            alt="${appName} logo"
            style="display:block; width:150px; max-width:150px; height:auto; border:0; outline:none; text-decoration:none;"
          >
        </td>
      </tr>
    </table>
  `;
}

export function getEmailHeaderMarkup({
  appName = "FinSync",
  title,
  subtitle = "",
  backgroundColor = "#1e293b",
  padding = "24px 28px",
}) {
  return `
    <td style="background-color:${backgroundColor}; padding:${padding};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle" style="padding:0 18px 0 0;">
            <p style="margin:0; color:#ffffff; font-size:20px; line-height:28px; font-weight:700;">${title}</p>
            ${
              subtitle
                ? `<p style="margin:6px 0 0 0; color:#cbd5e1; font-size:13px; line-height:18px;">${subtitle}</p>`
                : ""
            }
          </td>
          <td align="right" valign="middle" width="180" style="width:180px;">
            ${getEmailLogoMarkup(appName)}
          </td>
        </tr>
      </table>
    </td>
  `;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <style>
        @media only screen and (max-width: 620px) {
          .container { width: 100% !important; }
          .pad { padding-left: 20px !important; padding-right: 20px !important; }
          .otp { font-size: 30px !important; letter-spacing: 8px !important; }
        }
      </style>
    </head>
    <body style="margin:0; padding:0; background-color:#eef2ff; font-family:Arial, Helvetica, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2ff;">
        <tr>
          <td align="center" style="padding:28px 12px;">
            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:14px; border:1px solid #dbe2ff; overflow:hidden;">
              <tr>
                ${getEmailHeaderMarkup({
                  appName,
                  title: "Security Verification",
                  padding: "22px 28px",
                })}
              </tr>
              <tr>
                <td class="pad" style="padding:28px;">
                  <p style="margin:0 0 14px 0; color:#0f172a; font-size:16px; line-height:24px;">Hello ${fullName || "there"},</p>
                  <p style="margin:0 0 18px 0; color:#334155; font-size:15px; line-height:24px;">
                    We received a request to reset your <strong>${appName}</strong> password. Use the one-time code below to continue:
                  </p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
                    <tr>
                      <td align="center" style="background-color:#e0e7ff; border:1px dashed #4f46e5; border-radius:12px; padding:18px;">
                        <span class="otp" style="display:inline-block; color:#312e81; font-size:36px; line-height:40px; letter-spacing:10px; font-weight:700;">
                          ${otp}
                        </span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 12px 0; color:#475569; font-size:14px; line-height:22px;">
                    This code expires in <strong style="color:#0f172a;">10 minutes</strong>.
                  </p>
                  <p style="margin:0; color:#64748b; font-size:13px; line-height:21px;">
                    If you did not request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f8fafc; padding:16px 28px; border-top:1px solid #e2e8f0;">
                  <p style="margin:0; color:#94a3b8; font-size:12px; line-height:18px;">
                    For your security, never share this code with anyone.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
  subscriptionType,
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
    const isRenewal = String(subscriptionType || "signup").toLowerCase() === "upgrade";
    const subject = isRenewal
      ? `[${appName}] Subscription renewed: ${organizationName || "Organization"}`
      : `[${appName}] New paid organization activated`;
    const headline = isRenewal
      ? "Subscription renewed"
      : "New paid organization activated";
    const intro = isRenewal
      ? `A subscription renewal was completed in ${appName}.`
      : `A payment was completed and an admin account was provisioned in ${appName}.`;

    await mailer.sendMail({
      from,
      to: recipients.join(", "),
      subject,
      text: [
        isRenewal
          ? `A subscription renewal has been completed in ${appName}.`
          : `A payment has been completed and an admin account has been created in ${appName}.`,
        `Organization: ${organizationName || "N/A"}`,
        `Admin email: ${adminEmail || "N/A"}`,
        `Plan: ${planName || "N/A"}`,
        `Amount: ${formattedAmount}`,
        `Transaction ID: ${transactionUuid || "N/A"}`,
        `Paid at: ${paymentTimestamp}`,
      ].join("\n"),
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
          @media only screen and (max-width: 620px) {
            .container { width: 100% !important; }
            .pad { padding-left: 20px !important; padding-right: 20px !important; }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
          <tr>
            <td align="center" style="padding:28px 12px;">
              <table role="presentation" class="container" width="620" cellpadding="0" cellspacing="0" border="0" style="width:620px; max-width:620px; background-color:#ffffff; border:1px solid #dbe4f2; border-radius:14px; overflow:hidden;">
                <tr>
                  ${getEmailHeaderMarkup({
                    appName,
                    title: headline,
                    subtitle: `Subscription activity on ${appName}`,
                  })}
                </tr>
                <tr>
                  <td class="pad" style="padding:24px 28px 16px 28px;">
                    <p style="margin:0 0 10px 0; color:#0f172a; font-size:16px; line-height:24px;">Hello,</p>
                    <p style="margin:0; color:#475569; font-size:14px; line-height:22px;">${intro}</p>
                  </td>
                </tr>
                <tr>
                  <td class="pad" style="padding:0 28px 22px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
                      <tr>
                        <td style="padding:14px 16px; background-color:#f8fafc; color:#334155; font-size:13px; border-bottom:1px solid #e2e8f0;">Organization</td>
                        <td style="padding:14px 16px; background-color:#f8fafc; color:#0f172a; font-size:13px; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${organizationName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px; color:#334155; font-size:13px; border-bottom:1px solid #e2e8f0;">Admin email</td>
                        <td style="padding:14px 16px; color:#0f172a; font-size:13px; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${adminEmail || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px; color:#334155; font-size:13px; border-bottom:1px solid #e2e8f0;">Plan</td>
                        <td style="padding:14px 16px; color:#0f172a; font-size:13px; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${planName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px; color:#334155; font-size:13px; border-bottom:1px solid #e2e8f0;">Amount</td>
                        <td style="padding:14px 16px; color:#0f172a; font-size:13px; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px; color:#334155; font-size:13px; border-bottom:1px solid #e2e8f0;">Transaction ID</td>
                        <td style="padding:14px 16px; color:#1e40af; font-size:13px; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${transactionUuid || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 16px; color:#334155; font-size:13px;">Paid at</td>
                        <td style="padding:14px 16px; color:#0f172a; font-size:13px; font-weight:700; text-align:right;">${paymentTimestamp}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:15px 28px;">
                    <p style="margin:0; color:#94a3b8; font-size:12px; line-height:18px;">This is an automated subscription notification.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    });

    return { sent: true };
  } catch (error) {
    console.error("sendSuperadminSignupAlertEmail failed:", error.message);
    return { sent: false, reason: error.message };
  }
}

// Send notification to internal team about contact form submission
export async function sendContactNotificationToTeam({ recipient, payload }) {
  try {
    const mailer = createTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || "FinSync";
    const safeName = escapeHtml(payload.name);
    const safeEmail = escapeHtml(payload.email);
    const safeCompany = escapeHtml(payload.company || "N/A");
    const safeTopic = escapeHtml(payload.topic || "General");
    const safeMessage = escapeHtml(payload.message);

    await mailer.sendMail({
      from,
      to: recipient,
      subject: `[${appName}] New contact form submission: ${payload.topic || 'General'}`,
      text: `From: ${payload.name} <${payload.email}>\nCompany: ${payload.company || 'N/A'}\nTopic: ${payload.topic || 'General'}\n\n${payload.message}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <style>
            @media only screen and (max-width: 620px) {
              .container { width: 100% !important; }
              .pad { padding-left: 20px !important; padding-right: 20px !important; }
            }
          </style>
        </head>
        <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
            <tr>
              <td align="center" style="padding:28px 12px;">
                <table role="presentation" class="container" width="620" cellpadding="0" cellspacing="0" border="0" style="width:620px; max-width:620px; background-color:#ffffff; border:1px solid #dbe4f2; border-radius:14px; overflow:hidden;">
                  <tr>
                    ${getEmailHeaderMarkup({
                      appName,
                      title: "New contact form submission",
                      subtitle: `A new message was submitted from the ${appName} website.`,
                    })}
                  </tr>
                  <tr>
                    <td class="pad" style="padding:24px 28px 16px 28px;">
                      <p style="margin:0 0 10px 0; color:#0f172a; font-size:16px; line-height:24px;">Hello team,</p>
                      <p style="margin:0; color:#475569; font-size:14px; line-height:22px;">A visitor has sent a message through the contact form.</p>
                    </td>
                  </tr>
                  <tr>
                    <td class="pad" style="padding:0 28px 18px 28px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
                        <tr>
                          <td style="padding:14px 16px; background-color:#f8fafc; color:#334155; font-size:13px; border-bottom:1px solid #e2e8f0;">From</td>
                          <td style="padding:14px 16px; background-color:#f8fafc; color:#0f172a; font-size:13px; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${safeName}</td>
                        </tr>
                        <tr>
                          <td style="padding:14px 16px; color:#334155; font-size:13px; border-bottom:1px solid #e2e8f0;">Email</td>
                          <td style="padding:14px 16px; color:#1e40af; font-size:13px; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${safeEmail}</td>
                        </tr>
                        <tr>
                          <td style="padding:14px 16px; color:#334155; font-size:13px; border-bottom:1px solid #e2e8f0;">Company</td>
                          <td style="padding:14px 16px; color:#0f172a; font-size:13px; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${safeCompany}</td>
                        </tr>
                        <tr>
                          <td style="padding:14px 16px; color:#334155; font-size:13px;">Topic</td>
                          <td style="padding:14px 16px; color:#0f172a; font-size:13px; font-weight:700; text-align:right;">${safeTopic}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td class="pad" style="padding:0 28px 24px 28px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dbeafe; border-left:4px solid #3b82f6; background-color:#f8fbff; border-radius:8px;">
                        <tr>
                          <td style="padding:14px;">
                            <p style="margin:0 0 8px 0; color:#1e293b; font-size:13px; font-weight:700; line-height:20px;">Message</p>
                            <div style="white-space:pre-wrap; color:#334155; font-size:14px; line-height:22px;">${safeMessage}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:15px 28px;">
                      <p style="margin:0; color:#94a3b8; font-size:12px; line-height:18px;">This is an automated contact notification from ${appName}.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error('sendContactNotificationToTeam failed', err.message);
    return { sent: false, reason: err.message };
  }
}

// Send confirmation email to the person who submitted the contact form
export async function sendContactConfirmationEmail({ to, name }) {
  try {
    const mailer = createTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || 'FinSync';
    await mailer.sendMail({
      from,
      to,
      subject: `Thanks for contacting ${appName}`,
      text: `Hello ${name || ''},\n\nThanks for contacting ${appName}. Our team will get back to you within 24 hours.\n\n— ${appName} Support`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <style>
            @media only screen and (max-width: 620px) {
              .container { width: 100% !important; }
              .pad { padding-left: 20px !important; padding-right: 20px !important; }
            }
          </style>
        </head>
        <body style="margin:0; padding:0; background-color:#f8fafc; font-family:Arial, Helvetica, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;">
            <tr>
              <td align="center" style="padding:28px 12px;">
                <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                  <tr>
                    ${getEmailHeaderMarkup({
                      appName,
                      title: "We Received Your Message",
                      padding: "22px 28px",
                    })}
                  </tr>
                  <tr>
                    <td class="pad" style="padding:26px 28px;">
                      <p style="margin:0 0 12px 0; color:#0f172a; font-size:16px; line-height:24px;">Hi ${name || ''},</p>
                      <p style="margin:0 0 18px 0; color:#475569; font-size:14px; line-height:22px;">
                        Thanks for reaching out. Your message is in our queue and our team will get back to you within 24 hours.
                      </p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dbeafe; border-left:4px solid #3b82f6; background-color:#f8fbff; border-radius:8px;">
                        <tr>
                          <td style="padding:14px;">
                            <p style="margin:0; color:#1e293b; font-size:14px; line-height:22px;">
                              Your request has been safely received by <strong>${appName}</strong>. We appreciate your patience.
                            </p>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:18px 0 0 0; color:#64748b; font-size:13px; line-height:21px;">
                        You can reply to this email if you need to add more details.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:15px 28px;">
                      <p style="margin:0; color:#94a3b8; font-size:12px; line-height:18px;">This is an automated acknowledgment email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error('sendContactConfirmationEmail failed', err.message);
    return { sent: false, reason: err.message };
  }
}

// Send notification when a user or organization is disabled (manual or payment expiry)
export async function sendDisabledNotificationEmail({ to, name, orgName, disabledBy, reason, effectiveDate }) {
  try {
    const mailer = createTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || 'FinSync';

    const subject = orgName
      ? `[${appName}] Organization access disabled: ${orgName}`
      : `[${appName}] Account access disabled`;

    const textLines = [];
    if (orgName) textLines.push(`Organization: ${orgName}`);
    if (name) textLines.push(`User: ${name}`);
    if (disabledBy) textLines.push(`Disabled by: ${disabledBy}`);
    if (effectiveDate) textLines.push(`Effective: ${effectiveDate}`);
    if (reason) textLines.push(`Reason: ${reason}`);
    textLines.push('\nIf you believe this is an error, please contact support.');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
          @media only screen and (max-width: 620px) {
            .container { width: 100% !important; }
            .pad { padding-left: 20px !important; padding-right: 20px !important; }
            .cta { display: block !important; width: 100% !important; }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
          <tr>
            <td align="center" style="padding:28px 12px;">
              <table role="presentation" class="container" width="620" cellpadding="0" cellspacing="0" border="0" style="width:620px; max-width:620px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                <tr>
                  ${getEmailHeaderMarkup({
                    appName,
                    title: orgName ? 'Organization access disabled' : 'Account access disabled',
                    backgroundColor: "#0f172a",
                  })}
                </tr>
                <tr>
                  <td class="pad" style="padding:26px 28px 16px 28px;">
                    <p style="margin:0 0 12px 0; color:#0f172a; font-size:16px; line-height:24px;">Hello ${name || "there"},</p>
                    <p style="margin:0 0 16px 0; color:#475569; font-size:14px; line-height:22px;">
                      This is to inform you that ${orgName ? `the organization <strong>${orgName}</strong>` : `your account`} has been disabled.
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0; border:1px solid #fecaca; border-left:4px solid #dc2626; background-color:#fff7f7; border-radius:8px;">
                      <tr>
                        <td style="padding:14px;">
                          ${reason ? `<p style="margin:0; color:#991b1b; font-size:14px; line-height:22px;"><strong>Reason:</strong> ${reason}</p>` : `<p style="margin:0; color:#991b1b; font-size:14px; line-height:22px;">No specific reason was provided.</p>`}
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                      ${orgName ? `<tr><td style="padding:4px 8px 4px 0; color:#334155; font-size:13px;"><strong>Organization</strong></td><td style="color:#0f172a; font-size:13px;">${orgName}</td></tr>` : ''}
                      ${name ? `<tr><td style="padding:4px 8px 4px 0; color:#334155; font-size:13px;"><strong>User</strong></td><td style="color:#0f172a; font-size:13px;">${name}</td></tr>` : ''}
                      ${disabledBy ? `<tr><td style="padding:4px 8px 4px 0; color:#334155; font-size:13px;"><strong>Actioned by</strong></td><td style="color:#0f172a; font-size:13px;">${disabledBy}</td></tr>` : ''}
                      ${effectiveDate ? `<tr><td style="padding:4px 8px 4px 0; color:#334155; font-size:13px;"><strong>Effective</strong></td><td style="color:#0f172a; font-size:13px;">${effectiveDate}</td></tr>` : ''}
                    </table>
                    <p style="margin:0 0 18px 0; color:#475569; font-size:14px; line-height:22px;">
                      If you believe this action was made in error, please contact our support team.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="cta" align="center" style="background-color:#1d4ed8; border-radius:8px;">
                          <a href="mailto:${from}" style="display:inline-block; padding:12px 18px; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none;">
                            Contact Support
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:15px 28px;">
                    <p style="margin:0; color:#94a3b8; font-size:12px; line-height:18px;">This is an important account notification from ${appName}.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await mailer.sendMail({
      from,
      to,
      subject,
      text: textLines.join('\n'),
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error('sendDisabledNotificationEmail failed', err.message || err);
    return { sent: false, reason: err.message || String(err) };
  }
}

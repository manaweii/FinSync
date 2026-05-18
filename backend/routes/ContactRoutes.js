import express from 'express';
import nodemailer from 'nodemailer';
import { sendContactNotificationToTeam, sendContactConfirmationEmail } from '../services/emailService.js';

const router = express.Router();

// POST /api/contact/send
router.post('/contact/send', async (req, res) => {
  try {
    const { name, email, company, topic, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // recipient from environment
    const recipient = process.env.CONTACT_RECIPIENT_EMAIL || process.env.SMTP_USER;
    if (!recipient) {
      return res.status(500).json({ success: false, error: 'Contact recipient not configured on server' });
    }

    const payload = { name, email, company, topic, message };

    // Try using centralized email service
    try {
      const notify = await sendContactNotificationToTeam({ recipient, payload });
      const confirm = await sendContactConfirmationEmail({ to: email, name });

      const results = { notify, confirm };
      // If service indicates failure, fall back below
      if ((notify && notify.sent === false) || (confirm && confirm.sent === false)) {
        throw new Error('Email service reported failure');
      }

      return res.json({ success: true });
    } catch (serviceErr) {
      console.warn('emailService failed, falling back to local ethereal sender:', serviceErr.message);
      // fallback to older behavior using nodemailer and ethereal for dev
      const smtpHost = process.env.SMTP_HOST || process.env.MAIL_HOST;
      const smtpPort = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
      const smtpUser = process.env.SMTP_USER || process.env.MAIL_USER;
      const smtpPass = process.env.SMTP_PASS || process.env.MAIL_PASS;

      let transporter;
      if (smtpHost && smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      }

      const subject = `FinSync Contact: ${topic || 'General'} - ${name}`;
      const html = `
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Company:</strong> ${company || 'N/A'}</p>
      <p><strong>Topic:</strong> ${topic || 'General'}</p>
      <p><strong>Message:</strong> ${message}</p>
      <div style="white-space:pre-wrap;">${String(message).replace(/</g, '&lt;')}</div>
      <hr />
      <p>Sent via FinSync contact form</p>
    `;

      const info = await transporter.sendMail({
        from: `${name} <${email}>`,
        to: recipient,
        subject,
        html,
        text: String(message),
      });

      let previewUrl = null;
      if (nodemailer.getTestMessageUrl && info && info.messageId) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      // also try to send confirmation to submitter if possible via transporter
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER || recipient,
          to: email,
          subject: `Thanks for contacting ${process.env.APP_NAME || 'FinSync'}`,
          text: `Hi ${name || ''},\n\nThanks for reaching out. Our team has received your message and will reply within 24 hours.\n\n— ${process.env.APP_NAME || 'FinSync'} Support`,
          html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; line-height: 1.6;"><h2>Thanks for contacting ${process.env.APP_NAME || 'FinSync'}</h2><p>Hi ${name || ''},</p><p>Thanks for reaching out. Our team has received your message and will reply within 24 hours.</p><p>Best,<br/>The ${process.env.APP_NAME || 'FinSync'} team</p></div>`,
        });
      } catch (confirmErr) {
        console.warn('Failed to send confirmation email via fallback transporter:', confirmErr.message);
      }

      return res.json({ success: true, previewUrl });
    }
  } catch (err) {
    console.error('contact send error', err);
    return res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export default router;

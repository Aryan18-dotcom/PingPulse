import nodemailer from 'nodemailer';

export async function sendTelegramNotification(globalSettings, message) {
  const { botToken, chatId } = globalSettings?.telegram || {};
  if (!botToken || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('[Telegram Alert Error]:', err.message);
  }
}

export async function sendEmailNotification(globalSettings, subject, htmlContent) {
  const { smtpHost, smtpPort, smtpUser, smtpPass, recipientEmail } = globalSettings?.email || {};
  if (!smtpHost || !smtpUser || !smtpPass || !recipientEmail) return;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"SiteAliver Monitor" <${smtpUser}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    });
  } catch (err) {
    console.error('[Email Alert Error]:', err.message);
  }
}
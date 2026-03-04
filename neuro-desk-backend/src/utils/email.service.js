const { Resend } = require('resend');

const sendEmail = async (options) => {
  // Fallback: if no Resend key configured, log to console (dev mode)
  if (!process.env.RESEND_API_KEY) {
    console.log('--- Email Fallback (no RESEND_API_KEY set) ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    console.log('----------------------------------------------');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: `${process.env.FROM_NAME || 'NeuroDesk'} <onboarding@resend.dev>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  });

  if (error) {
    console.error('[Email] Resend error:', error);
    throw new Error(error.message);
  }

  console.log('[Email] Sent successfully:', data?.id);
};

module.exports = sendEmail;

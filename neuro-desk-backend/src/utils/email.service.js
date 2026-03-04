const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Fallback for development if no SMTP credentials
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
    console.log('--- Development Email Fallback ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    if (options.html) console.log(`HTML: ${options.html}`);
    console.log('---------------------------------');
    return;
  }

  // Use Gmail service shorthand — handles all host/port/TLS settings automatically
  // This is more reliable than manual SMTP config on cloud providers like Render
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,  // Handle self-signed cert issues in cloud environments
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'NeuroDesk'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;

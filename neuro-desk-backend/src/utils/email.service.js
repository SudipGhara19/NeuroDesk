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

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;

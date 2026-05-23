const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email with exponential backoff retry (up to 3 attempts).
 */
async function sendEmailWithRetry(mailOptions, retries = 3) {
  const isPlaceholder = !process.env.SMTP_PASS || process.env.SMTP_PASS.includes('xxxx') || process.env.SMTP_PASS === '';
  if (isPlaceholder) {
    console.log(`[Email] [MOCK] Successfully transmitted email to ${mailOptions.to} (subject: ${mailOptions.subject})`);
    return true;
  }
  const delays = [1000, 2000, 4000];
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      if (attempt < retries) {
        console.error(`[Email] Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delays[attempt]}ms...`);
        await new Promise(r => setTimeout(r, delays[attempt]));
      } else {
        console.error(`[Email] All ${retries + 1} attempts failed for ${mailOptions.to}: ${err.message}`);
        return false;
      }
    }
  }
}

module.exports = { sendEmailWithRetry };

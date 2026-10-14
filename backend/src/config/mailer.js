const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const sendResetPasswordEmail = async (toEmail, resetLink) => {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || `"Zen CRM" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Zen CRM — Đặt lại mật khẩu của bạn',
    html: `
      <h2>Yêu cầu đặt lại mật khẩu</h2>
      <p>Nhấn vào liên kết dưới đây để đặt lại mật khẩu (hết hạn sau 15 phút):</p>
      <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Đặt lại mật khẩu
      </a>
      <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `,
  });
};

module.exports = { transporter, sendResetPasswordEmail };

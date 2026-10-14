const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Gửi email đặt lại mật khẩu (SRS 3.14)
 * @param {string} toEmail 
 * @param {string} resetLink 
 * @param {string} userName
 */
const sendResetPasswordEmail = async (toEmail, resetLink, userName = 'Quý khách') => {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"Zen CRM" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Zen CRM — Hướng dẫn đặt lại mật khẩu tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #1e40af, #4338ca); color: #ffffff; padding: 12px 20px; border-radius: 10px; font-weight: bold; font-size: 20px; letter-spacing: 1px;">
            Zen CRM
          </div>
        </div>
        <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 12px;">Yêu cầu đặt lại mật khẩu</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Xin chào <strong>${userName}</strong>,<br>
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Zen CRM liên kết với địa chỉ email này.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            Đặt Lại Mật Khẩu
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          ⚠️ <em>Liên kết này có hiệu lực trong vòng <strong>15 phút</strong>. Sau thời gian này, bạn sẽ cần gửi lại yêu cầu mới.</em>
        </p>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Mật khẩu hiện tại của bạn vẫn được bảo mật an toàn.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Zen CRM Enterprise Platform &bull; Đây là email tự động, vui lòng không phản hồi.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { transporter, sendResetPasswordEmail };

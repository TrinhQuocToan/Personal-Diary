const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * @param {string} email - Email người nhận
 * @param {string} otp - Mã OTP
 */
const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    console.log("transporter",transporter);

    const mailOptions = {
        from: '"Personal Diary" <no-reply@personalDiary.com>',
        to: email,
        subject: "🔐 OTP Verification Code - Personal Diary",
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification - Personal Diary</title>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #222, #444); color: #FFD700; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
                .email-content { padding: 20px; color: #333; font-size: 16px; line-height: 1.6; }
                .otp-box { background-color: #FFD700; color: #222; font-size: 28px; font-weight: bold; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0; letter-spacing: 2px; }
                .footer { background-color: #222; color: #FFD700; padding: 15px; text-align: center; font-size: 14px; }
                .footer a { color: #FFD700; text-decoration: none; font-weight: bold; }
                .note { font-size: 14px; color: #888; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">Personal Diary - OTP Verification</div>
                <div class="email-content">
                    <p>Hello,</p>
                    <p>You have requested to verify your login or reset your password. Please enter the following OTP code to proceed:</p>
                    <div class="otp-box">${otp}</div>
                    <p>This OTP is valid for <strong>1 minute</strong>. Do not share this code with anyone.</p>
                    <p>If you did not request this verification, please ignore this email.</p>
                    <p class="note">For security reasons, never share your OTP with anyone, including our staff.</p>
                </div>
                <div class="footer">
                    &copy; 2025 Personal Diary | <a href="https://personaldiary.com">www.personalDiary.com</a>
                </div>
            </div>
        </body>
        </html>`,
    };


    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email has been sent to ${email}`);
};

module.exports = { sendOTPEmail };

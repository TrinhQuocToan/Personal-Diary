const nodemailer = require("nodemailer");

const sendOTPEmail = async (email, otp, context = "verification") => {
  try {
    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER || "kubinduong2002@gmail.com",
        pass: process.env.EMAIL_PASS || "wubr bysj fvrk rvju",
      },
    });

    // Customize email content based on context
    let subject, htmlContent;
    if (context === "password-reset") {
      subject = "Your OTP for Password Reset";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset OTP</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your Personal Diary account. Please use the following One-Time Password (OTP) to proceed:</p>
          <h3 style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 24px;">${otp}</h3>
          <p>This OTP is valid for 5 minutes. If you did not request a password reset, please ignore this email or contact support.</p>
          <p>Thank you,<br/>The Personal Diary Team</p>
        </div>
      `;
    } else {
      subject = "Your OTP for Account Verification";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Account Verification OTP</h2>
          <p>Hello,</p>
          <p>Thank you for registering with Personal Diary. Please use the following One-Time Password (OTP) to verify your account:</p>
          <h3 style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 24px;">${otp}</h3>
          <p>This OTP is valid for 5 minutes. If you did not register, please ignore this email or contact support.</p>
          <p>Thank you,<br/>The Personal Diary Team</p>
        </div>
      `;
    }

    // Email content
    const mailOptions = {
      from: `"Personal Diary" <${process.env.EMAIL_USER || "kubinduong2002@gmail.com"}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email} for ${context}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = { sendOTPEmail };
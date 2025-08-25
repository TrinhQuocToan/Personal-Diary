const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const UserToken = require("../models/userToken.model");
const { createAccessToken, createRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { sendOTPEmail } = require("../utils/emailsOTP");
const crypto = require("crypto");

const registerAccount = async (req, res) => {
    try {
        const { email, username, password, fullName, gender, dob } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
        const dobRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (!email || !username || !password || !fullName || !gender || !dob) {
            return res.status(400).json({ message: "Please enter complete information!" });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format!" });
        }
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: "Username must be at least 4 characters and contain only letters, numbers, or underscores!" });
        }
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters, including one uppercase, one lowercase, one number, and one special character!" });
        }
        if (!dobRegex.test(dob)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD!" });
        }
        if (!["Male", "Female", "Other"].includes(gender)) {
            return res.status(400).json({ message: "Invalid gender!" });
        }

        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (existingUser) {
            return res.status(400).json({
                message:
                    existingUser.email === email.toLowerCase()
                        ? "Email already exists"
                        : "Username already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email: email.toLowerCase(),
            username,
            password: hashedPassword,
            fullName,
            gender,
            dob,
            isVerified: false,
        });

        await newUser.save();

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
        newUser.otp = otp;
        newUser.otpExpiration = otpExpiration;
        await newUser.save();

        await sendOTPEmail(email, otp, "verification");

        const { password: _, ...userWithoutPassword } = newUser.toObject();
        return res.status(201).json({
            message: "Registration successful! Please verify your account with the OTP sent to your email.",
            user: userWithoutPassword,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const validationErrors = Object.values(error.errors).map(
                (err) => err.message
            );
            return res.status(400).json({
                message: "Validation error",
                errors: validationErrors,
            });
        }

        return res.status(500).json({
            message: "Error while registering",
            error: error.message,
        });
    }
};

const loginAccount = async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;
        const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!username || !password) {
            return res.status(400).json({ message: "Please enter complete information!" });
        }

        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: "Invalid username format!" });
        }
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Invalid password format!" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                message: "Account not registered!",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Username or password is incorrect!" });
        }

        // Gửi OTP mới cho mọi lần đăng nhập
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
        user.otp = otp;
        user.otpExpiration = otpExpiration;
        await user.save();

        await sendOTPEmail(user.email, otp, "verification");
        return res.status(403).json({
            message: "A new OTP has been sent to your email for verification.",
            email: user.email,
            rememberMe: !!rememberMe, // Gửi lại rememberMe để frontend sử dụng
        });

    } catch (error) {
        return res.status(500).json({ message: "Error while logging in", error: error.message });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { otp, email, rememberMe } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!otp || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: "Valid 6-digit OTP is required!" });
        }
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: "Valid email is required!" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "Account not found!" });
        }

        if (user.otp !== otp || user.otpExpiration < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP!" });
        }

        // Kích hoạt tài khoản nếu chưa được kích hoạt
        if (!user.isVerified) {
            user.isVerified = true;
        }

        // Xóa OTP sau khi xác thực
        user.otp = null;
        user.otpExpiration = null;
        await user.save();

        // Tạo token với thời gian hết hạn dựa trên rememberMe
        const accessToken = await createAccessToken({ id: user._id, role: user.role });
        const refreshToken = await createRefreshToken({ id: user._id }, rememberMe ? '7d' : '1h');
        await UserToken.findOneAndUpdate(
            { user: user._id },
            { re_token: refreshToken },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            message: user.isVerified ? "OTP verified successfully! Account activated and logged in." : "OTP verified successfully! Logged in.",
            accessToken,
            refreshToken,
            rememberMe: !!rememberMe,
        });
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: "Valid email is required!" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "Account not found!" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
        user.otp = otp;
        user.otpExpiration = otpExpiration;
        await user.save();

        await sendOTPEmail(email, otp, "password-reset");

        return res.status(200).json({ message: "OTP sent to your email. Please check your inbox." });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        console.log("Received reset password request:", { email, newPassword });

        if (!email || !emailRegex.test(email)) {
            console.log("Invalid email format:", email);
            return res.status(400).json({ message: "Valid email is required!" });
        }
        if (!newPassword || !confirmPassword || !passwordRegex.test(newPassword)) {
            console.log("Invalid password format:", newPassword);
            return res.status(400).json({ message: "Password must be at least 8 characters, including one uppercase, one lowercase, one number, and one special character!" });
        }
        if (newPassword !== confirmPassword) {
            console.log("Passwords do not match:", { newPassword, confirmPassword });
            return res.status(400).json({ message: "Confirmed password does not match!" });
        }

        const normalizedEmail = email.toLowerCase();
        console.log("Querying user with email:", normalizedEmail);

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log("No user found for email:", normalizedEmail);
            return res.status(404).json({ message: "Account not found!" });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            console.log("New password matches old password for user:", normalizedEmail);
            return res.status(400).json({ message: "New password cannot be the same as the old password!" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();
        console.log("Password reset successfully for user:", normalizedEmail);

        return res.json({ message: "Password changed successfully!" });
    } catch (error) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", error: error.message });
    }
};

const logOutAccount = async (req, res) => {
    try {
        const { re_token } = req.body;
        if (!re_token) {
            return res.status(400).json({ message: "You are not logged in or the token is invalid" });
        }

        const tokenDoc = await UserToken.findOne({ re_token });
        if (!tokenDoc) {
            return res.status(400).json({ message: "Token is invalid or expired" });
        }
        await UserToken.deleteOne({ _id: tokenDoc._id });
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return res.status(500).json({ message: "Error while logging out", error: error.message });
    }
};

const refreshToken = async (req, res) => {
    try {
        const headerCheck = req.get("x-api-key");
        if (headerCheck !== "refreshTokenCheck") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required" });
        }

        const userToken = await UserToken.findOne({
            re_token: refreshToken,
        }).populate("user");
        if (!userToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(403).json({ message: "Refresh token is invalid or expired" });
        }

        const accessToken = createAccessToken({
            id: userToken.user._id,
            role: userToken.user.role,
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken,
            refreshToken,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Please provide both old and new passwords" });
        }
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: "New password must be at least 8 characters, including one uppercase, one lowercase, one number, and one special character!" });
        }

        const user = await User.findById(req.account.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect old password" });
        }
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: "New password cannot be the same as the old password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();
        return res.json({ message: "Password changed successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error changing password", error: error.message });
    }
};

module.exports = {
    registerAccount,
    loginAccount,
    logOutAccount,
    refreshToken,
    forgotPassword,
    changePassword,
    verifyOTP,
    resetPassword,
};
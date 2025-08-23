import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Please enter your email!");
            setMessage("");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");
        try {
            const response = await axios.post("/api/forgot-password", { email });
            setMessage(response.data.message);
            setTimeout(() => {
                localStorage.setItem("forgotPasswordEmail", email);
                navigate("/verify-otp");
            }, 2000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong!";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full">
            {/* Left side */}
            <div className="w-1/2 bg-[#0a1734] flex flex-col justify-center px-20">
                <h1 className="text-white text-4xl font-bold mb-4">Hello! Ready to tell a new story today?</h1>
                <p className="text-gray-300 text-lg">We’re glad to have you here. Let’s get started!</p>
            </div>

            {/* Right side */}
            <div className="w-1/2 bg-gray-100 flex flex-col justify-center items-center px-10">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-10 h-10 bg-blue-600 rounded-full mb-4"></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password</h2>
                    <p className="text-gray-600 text-center max-w-md">
                        Please enter the email address associated with your account and we will email you a link to reset your password.
                    </p>
                </div>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Show error or success message */}
                {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
                {message && <p className="text-green-600 mb-2 text-sm">{message}</p>}

                <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="w-full max-w-md py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
                >
                    {loading ? "Sending..." : "Send OTP"}
                </button>

                <button
                    onClick={() => navigate("/login")}
                    className="w-full max-w-md mt-3 py-2 bg-blue-100 text-blue-600 font-medium rounded-md hover:bg-blue-200 transition"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
};

export default ForgotPassword;

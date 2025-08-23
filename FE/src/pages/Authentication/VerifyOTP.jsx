import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyOTP = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const otpInputs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev === 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (index, event) => {
        const value = event.target.value;
        if (/^[0-9]$/.test(value) || value === "") {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            setError("");
            setMessage("");

            if (value && index < otp.length - 1) {
                otpInputs.current[index + 1].focus();
            }

            if (newOtp.join("").length === 6) {
                verifyOtp(newOtp.join(""));
            }
        }
    };

    const handleKeyDown = (index, event) => {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            otpInputs.current[index - 1].focus();
        }
    };

    const verifyOtp = async (otpCode) => {
        try {
            const response = await axios.post("/api/verify-otp", { otp: otpCode });
            setMessage(response.data.message || "OTP verified successfully!");
            setError("");

            setTimeout(() => {
                navigate("/reset-password");
            }, 2000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong!";
            setError(errorMessage);
            setMessage("");
            setOtp(["", "", "", "", "", ""]);
            otpInputs.current[0].focus();
        }
    };

    const handleResendOtp = async () => {
        setCanResend(false);
        setCountdown(60);
        try {
            const email = localStorage.getItem("forgotPasswordEmail");
            await axios.post("/api/forgot-password", { email });

            setMessage("OTP has been resent to your email.");
            setError("");
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to resend OTP";
            setError(errorMessage);
            setMessage("");
            setCanResend(true);
        }
    };

    return (
        <div className="w-screen h-screen flex">
            <div className="w-1/2 bg-[#0d1b2a] text-white flex flex-col justify-center items-start px-16">
                <h1 className="text-4xl font-bold mb-4">Hello! Ready to tell a new story today?</h1>
                <p className="text-lg text-gray-300">We’re glad to have you here. Let’s get started!</p>
            </div>

            <div className="w-1/2 bg-[#f4f4f4] flex justify-center items-center">
                <div className="bg-white rounded-xl shadow-md p-10 w-full max-w-md text-center">
                    <div className="flex justify-center items-center mb-6">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            ●
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Verify-OTP</h2>
                    <p className="text-gray-600 mb-6">Enter the One-Time Password (OTP) sent to your email.</p>

                    <div className="flex justify-center gap-2 mb-4">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (otpInputs.current[index] = el)}
                                type="text"
                                value={digit}
                                onChange={(e) => handleChange(index, e)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                maxLength={1}
                                className="w-10 h-12 text-center text-2xl border rounded-md border-gray-300 focus:outline-none focus:border-blue-500"
                            />
                        ))}
                    </div>

                    {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                    {message && <p className="text-green-500 text-sm mb-2">{message}</p>}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleResendOtp}
                            disabled={!canResend}
                            className={`w-full py-2 rounded-md text-white font-semibold transition duration-300 ${canResend
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {canResend ? "Resend OTP" : `Resend in ${countdown}s`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default VerifyOTP;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdArrowBack, MdCheckCircle, MdError } from "react-icons/md";
import { userAPI } from "../../services/api";
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await userAPI.forgotPassword({ email });
      
      if (response.success) {
        setIsSubmitted(true);
        toast.success("OTP sent to your email!");
      } else {
        setError(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      await userAPI.verifyOTP(email, otpString);
      setIsOtpVerified(true);
      toast.success("OTP verified successfully!");
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(error.response?.data?.message || "Invalid OTP. Please try again.");
      toast.error(error.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!newPassword.trim()) {
      setError("New password is required");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const otpString = otp.join("");
      await userAPI.resetPassword(email, otpString, newPassword);
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      setError(error.response?.data?.message || "Failed to reset password. Please try again.");
      toast.error(error.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted && !isOtpVerified) {
    return (
      <div className="min-h-screen backcolor flex items-center justify-center pt-14 md:pt-16 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-6">
            <div className="text-center mb-5 sm:mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <MdCheckCircle size={32} className="text-green-600" />
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl font-bold text-gray-900 mb-2">
                Enter OTP
              </h2>
              
              <p className="text-gray-600 text-sm sm:text-sm">
                We've sent a 6-digit OTP to <strong>{email}</strong>. 
                Please enter the OTP below to verify your identity.
              </p>
              
              <form onSubmit={handleVerifyOtp} className="space-y-3 sm:space-y-4">
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  ))}
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm text-center">{error}</div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    setIsSubmitted(false);
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Send Another OTP
                </button>
                
                <Link
                  to="/login"
                  className="flex items-center justify-center w-full text-orange-600 hover:text-orange-700 font-medium py-2"
                >
                  <MdArrowBack size={20} className="mr-2" />
                  Back to Login
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isOtpVerified) {
    return (
      <div className="min-h-screen backcolor flex items-center justify-center pt-14 md:pt-16 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-6">
            <div className="text-center mb-5 sm:mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <MdCheckCircle size={32} className="text-green-600" />
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl font-bold text-gray-900 mb-2">
                Set New Password
              </h2>
              
              <p className="text-gray-600 text-sm sm:text-sm">
                OTP verified successfully! Please enter your new password.
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label htmlFor="newPassword" className="block text-sm md:text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm md:text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm" role="alert">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 text-white py-2 md:py-2 px-4 md:px-6 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-sm"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
                
                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-orange-500 hover:text-orange-600 text-xs sm:text-sm md:text-sm font-medium"
                  >
                    <MdArrowBack size={16} className="inline mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen backcolor flex items-center justify-center pt-14 md:pt-16 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-6">
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl font-bold text-gray-900">Forgot Password?</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-sm">No worries! Enter your email address and we'll send you an OTP code.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm md:text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm md:text-sm"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white py-2 md:py-2 px-4 md:px-6 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-sm"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </div>
              ) : (
                "Send OTP"
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-600 text-xs sm:text-sm md:text-sm font-medium"
              >
                <MdArrowBack size={16} className="inline mr-1" />
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  MdRestaurant,
  MdVisibility,
  MdVisibilityOff,
  MdInfo,
  MdBlock,
} from "react-icons/md";
import { restaurantAuthAPI } from "../../services/api";
import { useRestaurantAuth } from "../../context/RestaurantAuthContext";

const RestaurantLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginWithContext } = useRestaurantAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  useEffect(() => {
    if (location.state?.pending) {
      setSuccess(location.state?.message || "Your registration has been submitted. Please wait for admin approval.");
    }
  }, [location.state]);

  const validateForm = () => {
    if (!formData.email) {
      setError("Email is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAwaitingApproval(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use context login to update provider state immediately
      const response = await loginWithContext(formData);

      if (response.success) {
        if (response.data?.requiresApproval) {
          setSuccess("Login successful! Your account is pending admin approval. You will be notified once approved.");
          setAwaitingApproval(true);
        } else if (response.data?.token) {
          navigate("/restaurant/dashboard");
        }
      } else {
        setError(response.message || "Invalid email or password. Please try again.");
      }
    } catch (error) {
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen backcolor flex items-center justify-center pt-14 md:pt-16 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="text-center mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl font-bold text-gray-900">
                Restaurant Login
              </h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-sm">
                Sign in to your restaurant account
              </p>
            </div>
          {/rejected/i.test(error) && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <MdBlock className="text-red-600 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {!/rejected/i.test(error) && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <MdInfo className="text-yellow-600 mt-0.5" size={20} />
              <p className="text-sm text-yellow-800">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm md:text-sm font-medium text-gray-700 mb-1"
              >
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full px-3 pr-3 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm md:text-sm font-medium text-gray-700 mb-1"
              >
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 pr-10 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <MdVisibilityOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <MdVisibility className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || awaitingApproval || /rejected/i.test(error)}
              className="group relative w-full flex justify-center py-2 md:py-2 px-4 md:px-6 border border-transparent text-sm md:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 md:h-6 md:w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                /rejected/i.test(error) ? "Account Rejected" : (awaitingApproval ? "Awaiting Approval" : "Sign In")
              )}
            </button>
          </div>
          <div className="text-center">
            <Link to="/restaurant/forgot-password" className="text-blue-600 hover:text-blue-500 text-xs sm:text-sm md:text-sm font-medium">
              Forgot your password?
            </Link>
          </div>

          <hr className="my-5 sm:my-6 border-gray-200" />

          <div className="text-center">
            <p className="text-gray-600 text-sm md:text-sm">
              Don't have a restaurant account{" "}
              <a
                href="/restaurant/register"
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Sign up
              </a>
            </p>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestaurantLogin;

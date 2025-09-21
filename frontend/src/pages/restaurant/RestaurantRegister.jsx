import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdBusiness,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdVisibility,
  MdVisibilityOff,
  MdAccountBalance
} from "react-icons/md";
import { restaurantAPI } from "../../services/api";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.PROD
  ? "https://moodbite-food-delivery.onrender.com/api"
  : "http://localhost:5000/api";

const RestaurantRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    area: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    cuisine: "",
    imageUrl: "",
    // Bank Details
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: ""
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFetchingBankDetails, setIsFetchingBankDetails] = useState(false);
  const [bankValidationErrors, setBankValidationErrors] = useState({
    accountNumber: "",
    ifscCode: ""
  });

  const cuisines = [
    "Indian", "Italian", "Chinese", "Japanese", "Mexican", "Thai", 
    "American", "Mediterranean", "French", "Korean", "Pizza", "Biryani", 
    "Fast Food", "Desserts", "Beverages", "Multi-Cuisine"
  ];

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const validateBankField = (field, value) => {
    switch (field) {
      case "accountNumber":
        if (!value) return { type: "error", message: "Required" };
        if (!/^\d{9,18}$/.test(value))
          return { type: "error", message: "9-18 digits" };
        return { type: "success", message: "Valid" };
      case "ifscCode":
        if (!value) return { type: "error", message: "Required" };
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value))
          return { type: "error", message: "Invalid format" };
        return { type: "success", message: "Valid" };
      default:
        return { type: "", message: "" };
    }
  };

  const fetchBankDetailsFromIFSC = async (ifscCode, accountNumber) => {
    try {
      setIsFetchingBankDetails(true);
      
      const response = await fetch(`${API_BASE_URL}/balance/validate-bank-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumber, ifscCode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            bankName: result.data.bankName || '',
            accountHolderName: result.data.accountHolderName || 'Please enter account holder name manually'
          }
        }));
        
        // Clear validation errors
        setBankValidationErrors({
          accountNumber: "",
          ifscCode: ""
        });
      } else {
        // Show error message below the input
        setBankValidationErrors({
          accountNumber: "",
          ifscCode: "The provided account number and IFSC code combination could not be verified. Please verify your bank details and try again."
        });
      }
    } catch (error) {
      setBankValidationErrors({
        accountNumber: "",
        ifscCode: "Unable to verify bank account details. Please check your account number and IFSC code, then try again."
      });
    } finally {
      setIsFetchingBankDetails(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Restaurant name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.phone) {
      setError("Phone number is required");
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }
    if (!formData.address) {
      setError("Address is required");
      return false;
    }
    if (!formData.city) {
      setError("City is required");
      return false;
    }
    if (!formData.state) {
      setError("State is required");
      return false;
    }
    if (!formData.zipCode) {
      setError("ZIP Code is required");
      return false;
    }
    if (!formData.cuisine) {
      setError("Please select a cuisine type");
      return false;
    }
    
    const accountNumberValidation = validateBankField("accountNumber", formData.bankDetails.accountNumber);
    const ifscValidation = validateBankField("ifscCode", formData.bankDetails.ifscCode);
    
    if (accountNumberValidation.type === "error") {
      setError(accountNumberValidation.message);
      return false;
    }
    if (ifscValidation.type === "error") {
      setError(ifscValidation.message);
      return false;
    }
    if (!formData.bankDetails.accountHolderName.trim()) {
      setError("Account holder name is required");
      return false;
    }
    if (formData.bankDetails.accountHolderName === 'Please enter account holder name manually') {
      setError("Please enter the correct account holder name");
      return false;
    }
    if (!formData.bankDetails.bankName.trim()) {
      setError("Bank name is required - please verify your account number and IFSC code");
      return false;
    }
    if (formData.bankDetails.bankName === 'Bank Name Not Available' || formData.bankDetails.bankName === 'Please enter bank name manually') {
      setError("Please verify your account number and IFSC code to get the correct bank name");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const restaurantData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        location: {
          address: formData.address,
          area: formData.area,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: "India"
        },
        description: formData.description,
        cuisine: formData.cuisine,
        imageUrl: formData.imageUrl,
        bankDetails: {
          accountNumber: formData.bankDetails.accountNumber,
          ifscCode: formData.bankDetails.ifscCode.toUpperCase(),
          accountHolderName: formData.bankDetails.accountHolderName,
          bankName: formData.bankDetails.bankName
        }
      };

      const response = await restaurantAPI.registerRestaurant(restaurantData);

      if (response.success) {
        navigate("/restaurant/login", { 
          state: { pending: true, message: "Registration submitted successfully! Please wait for admin approval." }
        });
      } else {
        setError(response.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen backcolor flex items-center justify-center pt-14 md:pt-16 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg sm:max-w-xl md:max-w-xl space-y-5 md:space-y-6">
        <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 space-y-4">
            {/* Header */}
            <div className="text-center">
              <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                Restaurant Registration
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Register your restaurant to start accepting orders
              </p>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Restaurant Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MdBusiness className="mr-2" />
                Restaurant Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine Type *
                  </label>
                  <select
                    name="cuisine"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.cuisine}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select cuisine</option>
                    {cuisines.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your restaurant, specialties, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Image URL
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/restaurant-image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <MdPhone className="mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit phone number"
                    required
                  />
                </div>
              </div>
            </div>



            {/* Address Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <MdLocationOn className="mr-2" />
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete street address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area/Locality
                  </label>
                  <input
                    type="text"
                    name="area"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g., Andheri East"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    name="state"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select state</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="Enter ZIP code"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <MdEmail className="mr-2" />
                Account Security
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full px-3 md:px-4 py-2 md:py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="w-full px-3 md:px-4 py-2 md:py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <MdAccountBalance className="mr-2" />
                Bank Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    className={`w-full px-3 md:px-4 py-2 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-sm md:text-sm ${
                      bankValidationErrors.accountNumber
                        ? "border-red-300 focus:ring-red-500"
                        : validateBankField("accountNumber", formData.bankDetails.accountNumber).type === "error"
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-green-500"
                    }`}
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => {
                      const newAccountNumber = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({
                      ...prev,
                        bankDetails: { ...prev.bankDetails, accountNumber: newAccountNumber }
                      }));
                      
                      if (newAccountNumber.length >= 9 && formData.bankDetails.ifscCode.length >= 11) {
                        const accountValidation = validateBankField("accountNumber", newAccountNumber);
                        const ifscValidation = validateBankField("ifscCode", formData.bankDetails.ifscCode);
                        
                        if (accountValidation.type === "success" && ifscValidation.type === "success") {
                          fetchBankDetailsFromIFSC(formData.bankDetails.ifscCode, newAccountNumber);
                        }
                      }
                    }}
                    placeholder="Enter account number"
                    maxLength={18}
                    required
                  />
                  {bankValidationErrors.accountNumber && (
                    <p className="text-xs mt-1 text-red-500">
                      {bankValidationErrors.accountNumber}
                    </p>
                  )}
                  {formData.bankDetails.accountNumber && validateBankField("accountNumber", formData.bankDetails.accountNumber).type === "error" && (
                    <p className="text-xs mt-1 text-red-500">
                      {validateBankField("accountNumber", formData.bankDetails.accountNumber).message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    className={`w-full px-3 md:px-4 py-2 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-sm md:text-sm ${
                      bankValidationErrors.ifscCode
                        ? "border-red-300 focus:ring-red-500"
                        : validateBankField("ifscCode", formData.bankDetails.ifscCode).type === "error"
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-green-500"
                    }`}
                    value={formData.bankDetails.ifscCode}
                    onChange={(e) => {
                      const newIfscCode = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      setFormData(prev => ({
                      ...prev,
                        bankDetails: { ...prev.bankDetails, ifscCode: newIfscCode }
                      }));
                      
                      if (newIfscCode.length >= 11 && formData.bankDetails.accountNumber.length >= 9) {
                        const accountValidation = validateBankField("accountNumber", formData.bankDetails.accountNumber);
                        const ifscValidation = validateBankField("ifscCode", newIfscCode);
                        
                        if (accountValidation.type === "success" && ifscValidation.type === "success") {
                          fetchBankDetailsFromIFSC(newIfscCode, formData.bankDetails.accountNumber);
                        }
                      }
                    }}
                    placeholder="Enter IFSC code (e.g., SBIN0001234)"
                    maxLength={11}
                    required
                  />
                  {bankValidationErrors.ifscCode && (
                    <p className="text-xs mt-1 text-red-500">
                      {bankValidationErrors.ifscCode}
                    </p>
                  )}
                  {formData.bankDetails.ifscCode && validateBankField("ifscCode", formData.bankDetails.ifscCode).type === "error" && (
                    <p className="text-xs mt-1 text-red-500">
                      {validateBankField("ifscCode", formData.bankDetails.ifscCode).message}
                    </p>
                  )}
                </div>

                {formData.bankDetails.bankName && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.bankName}
                      disabled
                      className={`w-full px-3 md:px-4 py-2 md:py-2 border rounded-lg text-gray-600 bg-gray-50 cursor-not-allowed focus:outline-none text-sm md:text-sm ${
                        formData.bankDetails.bankName === 'Bank Name Not Available' || formData.bankDetails.bankName === 'Please enter bank name manually'
                          ? 'border-orange-300'
                          : 'border-green-300'
                      }`}
                      placeholder="Bank name will appear here"
                    />
                    {formData.bankDetails.bankName === 'Bank Name Not Available' || formData.bankDetails.bankName === 'Please enter bank name manually' ? (
                      <p className="text-xs mt-1 text-orange-500">
                        Bank name could not be verified. Please check your account number and IFSC code.
                      </p>
                    ) : (
                      <p className="text-xs mt-1 text-green-500">
                        ✓ Bank details verified successfully
                      </p>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountHolderName || ""}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value.toUpperCase() }
                      }));
                    }}
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm md:text-sm"
                    placeholder="Enter account holder name"
                    required
                  />
                  {formData.bankDetails.accountHolderName && formData.bankDetails.accountHolderName.includes('manually') && (
                    <p className="text-xs mt-1 text-orange-500">
                      Please enter the correct account holder name
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isFetchingBankDetails}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Registering...
                </div>
              ) : isFetchingBankDetails ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Verifying Bank Details...
                </div>
              ) : (
                "Register Restaurant"
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  to="/restaurant/login"
                  className="text-blue-500 hover:text-blue-600 font-semibold"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantRegister;

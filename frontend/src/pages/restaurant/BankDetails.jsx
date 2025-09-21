import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAccountBalance,
  MdEdit,
  MdSave,
  MdTrendingUp,
  MdPayment,
  MdHistory,
  MdInfo,
  MdSecurity,
  MdVerified
} from "react-icons/md";
import { restaurantAPI, balanceAPI } from "../../services/api";
import toast from "react-hot-toast";

const BankDetails = () => {
  const navigate = useNavigate();
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: "",
    isVerified: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingBankDetails, setIsFetchingBankDetails] = useState(false);
  const [bankValidationErrors, setBankValidationErrors] = useState({
    accountNumber: "",
    ifscCode: ""
  });
  const [restaurantInfo, setRestaurantInfo] = useState({
    totalEarnings: 0,
    pendingAmount: 0,
    lastPayout: null,
    totalOrders: 0,
    commissionRate: 0,
    nextPayoutDate: null
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      setIsLoading(true);
      
      // Load bank details and restaurant info
      const response = await balanceAPI.getRestaurantBalance();
      
      if (response.success) {
        if (response.data.bankDetails) {
          setBankDetails(response.data.bankDetails);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
        
        // Load restaurant information
        setRestaurantInfo({
          totalEarnings: response.data.totalEarnings || 0,
          pendingAmount: response.data.pendingAmount || 0,
          lastPayout: response.data.lastPayout || null,
          totalOrders: response.data.totalOrders || 0,
          commissionRate: 80, // Default to 80% (will be updated from API)
          nextPayoutDate: response.data.nextPayoutDate || null
        });
        
        // Load recent transactions
        if (response.data.recentTransactions) {
          setRecentTransactions(response.data.recentTransactions);
        }
      } else {
        setIsEditing(true);
      }

      // Load commission rates from backend
      try {
        const commissionResponse = await balanceAPI.getCommissionRates();
        if (commissionResponse.success) {
          setRestaurantInfo(prev => ({
            ...prev,
            commissionRate: commissionResponse.data.restaurant
          }));
        }
      } catch (commissionError) {
        console.error("Error loading commission rates:", commissionError);
        // Keep default commission rate if API fails
      }
      
    } catch (error) {
      console.error("Error loading bank details:", error);
      toast.error("Failed to load bank details");
    } finally {
      setIsLoading(false);
    }
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
      case "accountHolderName":
        if (!value) return { type: "error", message: "Required" };
        if (value === 'Please enter account holder name manually') return { type: "error", message: "Please enter name" };
        if (value.length < 2) return { type: "error", message: "Too short" };
        return { type: "success", message: "Valid" };
      default:
        return { type: "", message: "" };
    }
  };

  const fetchBankDetailsFromIFSC = async (ifscCode, accountNumber) => {
    try {
      setIsFetchingBankDetails(true);
      
      const response = await fetch(`${import.meta.env.PROD ? "https://moodbite-food-delivery.onrender.com/api" : "http://localhost:5000/api"}/balance/validate-bank-public`, {
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
        setBankDetails(prev => ({
          ...prev,
          bankName: result.data.bankName || '',
          accountHolderName: result.data.accountHolderName || 'Please enter account holder name manually'
        }));
        
        setBankValidationErrors({
          accountNumber: "",
          ifscCode: ""
        });
      } else {
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

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      
      const accountNumberValidation = validateBankField("accountNumber", bankDetails.accountNumber);
      const ifscValidation = validateBankField("ifscCode", bankDetails.ifscCode);
      const accountHolderValidation = validateBankField("accountHolderName", bankDetails.accountHolderName);

      if (
        accountNumberValidation.type === "error" ||
        ifscValidation.type === "error" ||
        accountHolderValidation.type === "error"
      ) {
        return;
      }

      const response = await balanceAPI.updateRestaurantBankDetails(bankDetails);

      if (response.success) {
        setIsEditing(false);
        toast.success("Bank details updated successfully");
        loadBankDetails();
      } else {
        toast.error(response.message || "Failed to update bank details");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update bank details");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your bank details? This action cannot be undone.")) {
      try {
        setIsUpdating(true);
        const response = await balanceAPI.deleteRestaurantBankDetails();

        if (response.success) {
          setBankDetails({
            accountNumber: "",
            ifscCode: "",
            accountHolderName: "",
            bankName: "",
            isVerified: false
          });
          setIsEditing(true);
          toast.success("Bank details deleted successfully");
        } else {
          toast.error(response.message || "Failed to delete bank details");
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete bank details");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <MdAccountBalance size={24} className="text-orange-600 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bank Details</h1>
                <p className="text-gray-600 text-sm">Manage your bank account details for payouts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Bank Details Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                  <MdSecurity size={20} className="text-blue-600" />
                </div>
                Bank Details
              </h3>
              <div className="flex space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 font-medium"
                  >
                    <MdEdit size={14} />
                    <span>{bankDetails.accountNumber ? 'Edit' : 'Add'}</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        loadBankDetails();
                      }}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating || isFetchingBankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName || bankDetails.accountHolderName === 'Please enter account holder name manually'}
                      className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-1 text-sm"
                    >
                      <MdSave size={14} />
                      <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Details Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => {
                    const newAccountNumber = e.target.value.replace(/\D/g, '');
                    setBankDetails(prev => ({
                      ...prev,
                      accountNumber: newAccountNumber
                    }));
                    
                    if (newAccountNumber.length >= 9 && bankDetails.ifscCode.length >= 11) {
                      const accountValidation = validateBankField("accountNumber", newAccountNumber);
                      const ifscValidation = validateBankField("ifscCode", bankDetails.ifscCode);
                      
                      if (accountValidation.type === "success" && ifscValidation.type === "success") {
                        fetchBankDetailsFromIFSC(bankDetails.ifscCode, newAccountNumber);
                      }
                    }
                  }}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-sm ${
                    !isEditing
                      ? "bg-gray-100 cursor-not-allowed"
                      : bankValidationErrors.accountNumber
                      ? "border-red-300 focus:ring-red-500"
                      : validateBankField("accountNumber", bankDetails.accountNumber).type === "error"
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-green-500"
                  }`}
                  placeholder="Enter account number"
                  maxLength={18}
                />
                {bankValidationErrors.accountNumber && (
                  <p className="text-xs mt-1 text-red-500">
                    {bankValidationErrors.accountNumber}
                  </p>
                )}
                {bankDetails.accountNumber && validateBankField("accountNumber", bankDetails.accountNumber).type === "error" && (
                  <p className="text-xs mt-1 text-red-500">
                    {validateBankField("accountNumber", bankDetails.accountNumber).message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  value={bankDetails.ifscCode}
                  onChange={(e) => {
                    const newIfscCode = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                    setBankDetails(prev => ({
                      ...prev,
                      ifscCode: newIfscCode
                    }));
                    
                    if (newIfscCode.length >= 11 && bankDetails.accountNumber.length >= 9) {
                      const accountValidation = validateBankField("accountNumber", bankDetails.accountNumber);
                      const ifscValidation = validateBankField("ifscCode", newIfscCode);
                      
                      if (accountValidation.type === "success" && ifscValidation.type === "success") {
                        fetchBankDetailsFromIFSC(newIfscCode, bankDetails.accountNumber);
                      }
                    }
                  }}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-sm ${
                    !isEditing
                      ? "bg-gray-100 cursor-not-allowed"
                      : bankValidationErrors.ifscCode
                      ? "border-red-300 focus:ring-red-500"
                      : validateBankField("ifscCode", bankDetails.ifscCode).type === "error"
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-green-500"
                  }`}
                  placeholder="Enter IFSC code"
                  maxLength={11}
                />
                {bankValidationErrors.ifscCode && (
                  <p className="text-xs mt-1 text-red-500">
                    {bankValidationErrors.ifscCode}
                  </p>
                )}
                {bankDetails.ifscCode && validateBankField("ifscCode", bankDetails.ifscCode).type === "error" && (
                  <p className="text-xs mt-1 text-red-500">
                    {validateBankField("ifscCode", bankDetails.ifscCode).message}
                  </p>
                )}
              </div>

              {bankDetails.bankName && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    disabled
                    className={`w-full px-3 py-2 border rounded-lg text-gray-600 bg-gray-50 cursor-not-allowed focus:outline-none text-sm ${
                      bankDetails.bankName === 'Bank Name Not Available' || bankDetails.bankName === 'Please enter bank name manually'
                        ? 'border-orange-300'
                        : 'border-green-300'
                    }`}
                    placeholder="Bank name will appear here"
                  />
                  {bankDetails.bankName === 'Bank Name Not Available' || bankDetails.bankName === 'Please enter bank name manually' ? (
                    <p className="text-xs mt-1 text-orange-500">
                      Bank name could not be verified. Please check your account number and IFSC code.
                    </p>
                  ) : (
                    <p className="text-xs mt-1 text-green-500 flex items-center">
                      <MdVerified size={12} className="mr-1" />
                      Bank details verified successfully
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName || ""}
                  onChange={(e) => {
                    setBankDetails(prev => ({
                      ...prev,
                      accountHolderName: e.target.value.toUpperCase()
                    }));
                  }}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-sm ${
                    !isEditing
                      ? "bg-gray-100 cursor-not-allowed"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter account holder name"
                />
                {bankDetails.accountHolderName && bankDetails.accountHolderName.includes('manually') && (
                  <p className="text-xs mt-1 text-orange-500">
                    Please enter the correct account holder name
                  </p>
                )}
              </div>

              {isFetchingBankDetails && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Verifying bank details...</span>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <MdSecurity size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Secure & Encrypted</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Your bank details are encrypted and stored securely. Used only for payment processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDetails;

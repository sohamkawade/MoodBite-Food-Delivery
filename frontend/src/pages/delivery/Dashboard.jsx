import React, { useState, useEffect } from "react";
import {
  MdLocalShipping,
  MdShoppingCart,
  MdTrendingUp,
  MdSchedule,
  MdLocationOn,
  MdAttachMoney,
  MdCheckCircle,
  MdCancel,
  MdDirectionsBike,
  MdRestaurant,
  MdSecurity,
  MdRefresh,
} from "react-icons/md";
import {
  deliveryAuthAPI,
  ordersAPI as orderAPI,
  deliveryBoysAPI,
} from "../../services/api";

const DeliveryDashboard = () => {
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    averageRating: 0,
  });
  const [earningsData, setEarningsData] = useState({
    balance: 0,
    totalEarnings: 0,
    pendingAmount: 0,
    totalOrders: 0,
    lastPayout: null,
    nextPayoutDate: null,
    recentTransactions: []
  });
  const [isOnline, setIsOnline] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      const [profileRes, ordersRes, earningsRes] = await Promise.all([
        deliveryAuthAPI.getProfile(),
        orderAPI.getDeliveryOrders(),
        deliveryBoysAPI.getBalance(),
      ]);

      console.log("Profile Response:", profileRes);
      console.log("Orders Response:", ordersRes);
      console.log("Earnings Response:", earningsRes);

      if (profileRes.success) {
        setDeliveryBoy(profileRes.data);
        setIsOnline(profileRes.data.online || false);
      } else {
        console.error("Profile fetch failed:", profileRes.message);
      }

      if (ordersRes.success) {
        setOrders(ordersRes.data);
      } else {
        console.error("Orders fetch failed:", ordersRes.message);
      }

      if (earningsRes.success) {
        setEarningsData(earningsRes.data);
      } else {
        console.error("Earnings fetch failed:", earningsRes.message);
      }

      // Calculate stats after both orders and earnings data are loaded
      if (ordersRes.success && earningsRes.success) {
        calculateStats(ordersRes.data, earningsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch delivery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData, earningsDataParam = null) => {
    console.log("Calculating stats for orders:", ordersData);
    console.log("Using earnings data:", earningsDataParam || earningsData);
    
    const totalDeliveries = ordersData.length;
    const completedDeliveries = ordersData.filter(
      (order) => order.status === "delivered"
    ).length;
    const pendingDeliveries = ordersData.filter(
      (order) =>
        !["delivered", "cancelled", "rejected", "delivery_rejected"].includes(
          order.status
        )
    ).length;

    // Use the passed earnings data or fall back to state
    const currentEarningsData = earningsDataParam || earningsData;

    // Calculate earnings from recent transactions instead of order.deliveryFee
    const today = new Date();
    let todayEarnings = 0;
    let weeklyEarnings = 0;

    // Try to get earnings from recent transactions first
    if (currentEarningsData.recentTransactions && currentEarningsData.recentTransactions.length > 0) {
      todayEarnings = currentEarningsData.recentTransactions
        .filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transaction.type === 'delivery_fee' &&
            transaction.status === 'completed' &&
            transactionDate.toDateString() === today.toDateString()
          );
        })
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      weeklyEarnings = currentEarningsData.recentTransactions
        .filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transaction.type === 'delivery_fee' &&
            transaction.status === 'completed' &&
            transactionDate >= weekAgo
          );
        })
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    } else {
      // Fallback: Calculate from completed orders (10% commission)
      const todayOrders = ordersData.filter((order) => {
        const orderDate = new Date(order.updatedAt);
        return (
          order.status === "delivered" &&
          orderDate.toDateString() === today.toDateString()
        );
      });
      todayEarnings = todayOrders.reduce((sum, order) => sum + Math.round(order.total * 0.10), 0);

      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyOrders = ordersData.filter((order) => {
        const orderDate = new Date(order.updatedAt);
        return order.status === "delivered" && orderDate >= weekAgo;
      });
      weeklyEarnings = weeklyOrders.reduce((sum, order) => sum + Math.round(order.total * 0.10), 0);
    }

    const averageRating =
      ordersData
        .filter((order) => order.rating)
        .reduce((sum, order) => sum + order.rating, 0) /
        ordersData.filter((order) => order.rating).length || 0;

    const calculatedStats = {
      totalDeliveries,
      pendingDeliveries,
      completedDeliveries,
      todayEarnings,
      weeklyEarnings,
      averageRating: averageRating.toFixed(1),
    };

    console.log("Calculated stats:", calculatedStats);
    console.log("Today earnings calculation:", todayEarnings);
    console.log("Weekly earnings calculation:", weeklyEarnings);
    setStats(calculatedStats);
  };

  const toggleOnlineStatus = async () => {
    try {
      if (!isOnline) {
        const duration = window.prompt(
          "How many hours do you want to stay online? (Default: 8 hours)",
          "8"
        );
        if (duration === null) return;

        const hours = parseInt(duration) || 8;
        if (hours < 1 || hours > 24) {
          alert("Please enter a valid duration between 1-24 hours");
          return;
        }

        const response = await deliveryBoysAPI.goOnline(deliveryBoy._id, hours);
        if (response.success) {
          setIsOnline(true);
          setDeliveryBoy((prev) => ({
            ...prev,
            online: true,
            onlineExpiresAt: response.data.onlineExpiresAt,
          }));
          alert(`You are now online for ${hours} hours!`);
        }
      } else {
        const response = await deliveryBoysAPI.goOffline(deliveryBoy._id);
        if (response.success) {
          setIsOnline(false);
          setDeliveryBoy((prev) => ({
            ...prev,
            online: false,
            onlineExpiresAt: null,
          }));
          alert("You are now offline");
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log("Updating order status:", orderId, newStatus);
      
      // Check if delivery token exists
      const deliveryToken = localStorage.getItem('deliveryToken');
      if (!deliveryToken) {
        alert("You are not logged in. Please login again.");
        return;
      }
      
      console.log("Delivery token exists:", !!deliveryToken);
      
      const response = await orderAPI.updateDeliveryStatus(orderId, { status: newStatus });
      
      console.log("API Response:", response);
      
      if (response.success) {
        console.log("Order status updated successfully:", response);
        // Refresh the data to show updated status
        await fetchDeliveryData();
        alert(`Order status updated to ${newStatus} successfully!`);
      } else {
        console.error("Failed to update order status:", response.message);
        alert(`Failed to update order status: ${response.message}`);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      console.error("Error details:", error.response?.data || error.message);
      alert(`Failed to update order status: ${error.message}`);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) {
      setOtpError("Please enter OTP");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await orderAPI.verifyDeliveryOTP(
        currentOrder._id,
        otpInput
      );

      if (response.success) {
        setOtpMessage(
          "✅ Delivery verified successfully! Order marked as delivered."
        );
        setOtpInput("");
        setTimeout(() => {
          setShowOTPModal(false);
          setCurrentOrder(null);
          setOtpMessage("");
          fetchDeliveryData();
          deliveryAuthAPI
            .getProfile()
            .then((profileRes) => {
              if (profileRes.success) {
                setDeliveryBoy(profileRes.data);
              }
            })
            .catch(console.error);
        }, 2000);
      } else {
        setOtpError(response.message || "OTP verification failed");
      }
    } catch (error) {
      setOtpError(error.message || "Failed to verify OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await orderAPI.resendDeliveryOTP(currentOrder._id);

      if (response.success) {
        setOtpMessage("🔄 New OTP sent successfully! Check customer's Email.");
        setOtpInput("");
      } else {
        setOtpError(response.message || "Failed to resend OTP");
      }
    } catch (error) {
      setOtpError(error.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const closeOTPModal = () => {
    setShowOTPModal(false);
    setCurrentOrder(null);
    setOtpInput("");
    setOtpError("");
  };


  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready_for_pickup":
        return "bg-purple-100 text-purple-800";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "delivery_rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "preparing":
        return "Preparing";
      case "ready_for_pickup":
        return "Ready for Pickup";
      case "out_for_delivery":
        return "In Transit";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      case "delivery_rejected":
        return "Delivery Rejected";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen backcolor">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Professional Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdLocalShipping size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
              <p className="text-gray-600 text-sm">Welcome back, {deliveryBoy?.name || "Delivery Partner"}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 bg-gray-100 px-3 sm:px-4 py-2 rounded-full">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="font-medium text-gray-700 text-sm sm:text-base">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {isOnline && deliveryBoy?.onlineExpiresAt && (
              <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                <span className="font-medium">Expires:</span>{" "}
                {new Date(deliveryBoy.onlineExpiresAt).toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={toggleOnlineStatus}
              className={`relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm flex items-center space-x-2 ${
                isOnline
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-white" : "bg-white"}`}></div>
              <span>{isOnline ? "Offline" : "Online"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Today's Earnings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                ₹{stats.todayEarnings?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <MdAttachMoney size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Weekly Earnings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                ₹{stats.weeklyEarnings?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <MdTrendingUp size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Completed Deliveries</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.completedDeliveries || 0}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <MdCheckCircle size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.totalDeliveries || 0}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <MdLocalShipping size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Earnings Overview</h3>
            <p className="text-gray-600 text-sm sm:text-base">Your delivery earnings and transaction history</p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance Summary */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <h4 className="text-sm font-semibold text-green-800 mb-2">Available Balance</h4>
                <p className="text-2xl font-bold text-green-900">₹{earningsData.balance?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-700 mt-1">Ready for payout</p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">Calculated Earnings</h4>
                <p className="text-2xl font-bold text-orange-900">₹{stats.weeklyEarnings?.toLocaleString() || 0}</p>
                <p className="text-xs text-orange-700 mt-1">From {stats.completedDeliveries || 0} completed deliveries</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Pending Settlement</h4>
                <p className="text-2xl font-bold text-blue-900">₹{earningsData.pendingAmount?.toLocaleString() || 0}</p>
                <p className="text-xs text-blue-700 mt-1">COD orders pending cash collection</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Recent Transactions</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {earningsData.recentTransactions && earningsData.recentTransactions.length > 0 ? (
                  earningsData.recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.status === 'completed' ? 'bg-green-500' : 
                          transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{transaction.type?.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">{transaction.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">₹{transaction.amount}</p>
                        <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No recent transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payout Information */}
          {earningsData.lastPayout && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Last Payout</h4>
                  <p className="text-xs text-gray-600">
                    {new Date(earningsData.lastPayout).toLocaleDateString()}
                  </p>
                </div>
                {earningsData.nextPayoutDate && (
                  <div className="text-right">
                    <h4 className="text-sm font-semibold text-gray-800">Next Payout</h4>
                    <p className="text-xs text-gray-600">
                      {new Date(earningsData.nextPayoutDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Active Orders */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Active Orders</h3>
            <p className="text-gray-600 text-sm sm:text-base">Manage your current deliveries</p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {orders.filter(
            (order) =>
              ![
                "delivered",
                "cancelled",
                "rejected",
                "delivery_rejected",
              ].includes(order.status)
          ).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MdShoppingCart
                size={48}
                className="mx-auto mb-4 text-gray-300"
              />
              <p className="text-lg">No active orders</p>
              <p className="text-sm">
                New orders will appear here when assigned
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders
                .filter(
                  (order) =>
                    ![
                      "delivered",
                      "cancelled",
                      "rejected",
                      "delivery_rejected",
                    ].includes(order.status)
                )
                .map((order) => (
                  <div
                    key={order._id}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            #{order._id.slice(-8)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MdRestaurant className="text-orange-500" size={16} />
                            <span className="truncate">
                              {order.restaurant?.name || "Restaurant"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MdLocationOn className="text-red-500" size={16} />
                            <span className="truncate">
                              {order.deliveryAddress?.street ||
                                order.deliveryAddress?.city ||
                                "Address"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MdAttachMoney className="text-green-500" size={16} />
                            <span>
                              ₹{order.deliveryFee || 0} •{" "}
                              {order.items?.length || 0} items
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {order.status === "ready_for_pickup" && (
                          <>
                            <button
                              onClick={() =>
                                handleOrderStatusUpdate(
                                  order._id,
                                  "out_for_delivery"
                                )
                              }
                              className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                            >
                              <MdDirectionsBike size={16} />
                              <span>Pick Up</span>
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to reject this order? Admin will be notified to assign another delivery boy."
                                  )
                                ) {
                                  handleOrderStatusUpdate(
                                    order._id,
                                    "delivery_rejected"
                                  );
                                }
                              }}
                              className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                            >
                              <MdCancel size={16} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {order.status === "out_for_delivery" && (
                          <button
                            onClick={() => {
                              setCurrentOrder(order);
                              setShowOTPModal(true);
                              setOtpMessage(
                                "Please enter the OTP received by customer via Email to complete delivery."
                              );
                            }}
                            className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                          >
                            <MdSecurity size={16} />
                            <span>Verify Delivery</span>
                          </button>
                        )}
                        {["pending", "confirmed", "preparing"].includes(
                          order.status
                        ) && (
                          <button
                            onClick={() =>
                              handleOrderStatusUpdate(order._id, "cancelled")
                            }
                            className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                          >
                            <MdCancel size={16} />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {showOTPModal && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                <MdSecurity size={24} className="text-white sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                Delivery Verification
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Order #{currentOrder._id.slice(-8)} •{" "}
                {currentOrder.restaurant?.name || "Restaurant"}
              </p>
            </div>

            {otpMessage && (
              <div
                className={`p-3 rounded-lg mb-4 text-xs sm:text-sm ${
                  otpMessage.includes("✅")
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                {otpMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 text-center">
                  Enter OTP from Customer
                </label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-base sm:text-lg font-mono tracking-widest bg-gray-50 hover:bg-white transition-colors"
                />
                {otpError && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 text-center">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || !otpInput.trim()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all"
                >
                  {otpLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <MdCheckCircle size={18} />
                  )}
                  <span>Verify & Complete</span>
                </button>

                <button
                  onClick={closeOTPModal}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="text-center pt-3 border-t border-gray-100">
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-1">
                  <MdSecurity className="text-blue-500" size={14} />
                  <span>OTP sent via Email to customer</span>
                </div>
                <p className="text-xs text-gray-400">
                  Customer will receive OTP when order status becomes "Out for
                  Delivery"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeliveryDashboard;

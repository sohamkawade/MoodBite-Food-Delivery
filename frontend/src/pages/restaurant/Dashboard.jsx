import React, { useState, useEffect } from "react";
import {
  MdRestaurant,
  MdShoppingCart,
  MdStar,
  MdMenu,
  MdAttachMoney,
} from "react-icons/md";
import {
  restaurantAuthAPI as restaurantAPI,
  ordersAPI as orderAPI,
} from "../../services/api";

const RestaurantDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalMenuItems: 0,
  });

  const getActualData = () => {
    return restaurant?.restaurant || restaurant;
  };

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Function to get current day's operating hours
  const getCurrentDayHours = () => {
    if (!restaurant?.operatingHours) return { open: "", close: "" };

    const now = new Date();
    const currentDay = now
      .toLocaleDateString("en-US", { weekday: "short" })
      .toLowerCase(); // 'mon', 'tue', etc.

    // Map day names to match the model structure
    const dayMap = {
      mon: "monday",
      tue: "tuesday",
      wed: "wednesday",
      thu: "thursday",
      fri: "friday",
      sat: "saturday",
      sun: "sunday",
    };

    const today = dayMap[currentDay];
    if (!today || !restaurant.operatingHours[today])
      return { open: "", close: "" };

    return {
      open: restaurant.operatingHours[today].open || "",
      close: restaurant.operatingHours[today].close || "",
    };
  };

  const isCurrentlyOpen = () => {
    const actualData = getActualData();
    
    // If restaurant is not approved (pending), it should be closed
    if (actualData?.status === 'pending') {
      return false;
    }
    
    if (!actualData?.operatingHours?.monday) {
      return false;
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // 'HH:MM' format
    
    const dayMap = {
      'mon': 'monday',
      'tue': 'tuesday', 
      'wed': 'wednesday',
      'thu': 'thursday',
      'fri': 'friday',
      'sat': 'saturday',
      'sun': 'sunday'
    };
    
    const today = dayMap[currentDay];
    
    if (!today || !actualData.operatingHours[today]) {
      return false;
    }
    
    const { open, close, isOpen } = actualData.operatingHours[today];
    
    // If the day is marked as closed, return false
    if (isOpen === false) {
      return false;
    }
    
    // If no operating hours set, return false
    if (!open || !close) {
      return false;
    }
    
    // Convert times to minutes for easier comparison
    const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
    const openMinutes = parseInt(open.split(':')[0]) * 60 + parseInt(open.split(':')[1]);
    const closeMinutes = parseInt(close.split(':')[0]) * 60 + parseInt(close.split(':')[1]);
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  // Function to get time remaining until closing
  const getTimeUntilClosing = () => {
    const hours = getCurrentDayHours();
    if (!hours.close) return null;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); 
    
    const currentSeconds = parseInt(currentTime.split(':')[0]) * 3600 + 
                          parseInt(currentTime.split(':')[1]) * 60 + 
                          parseInt(currentTime.split(':')[2]);
    const closeSeconds = parseInt(hours.close.split(':')[0]) * 3600 + 
                        parseInt(hours.close.split(':')[1]) * 60;
    
    const remainingSeconds = closeSeconds - currentSeconds;
    
    if (remainingSeconds <= 0) return null;
    
    const hoursRemaining = Math.floor(remainingSeconds / 3600);
    const minutesRemaining = Math.floor((remainingSeconds % 3600) / 60);
    const secondsRemaining = remainingSeconds % 60;
    
    if (hoursRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining}m ${secondsRemaining}s`;
    } else if (minutesRemaining > 0) {
      return `${minutesRemaining}m ${secondsRemaining}s`;
    } else {
      return `${secondsRemaining}s`;
    }
  };

  const getCurrentStatusText = () => {
    const actualData = getActualData();

    if (actualData?.status === "pending") {
      return "Pending Approval";
    }

    if (actualData?.status === "rejected") {
      return "Rejected";
    }

    if (actualData?.status === "suspended") {
      return "Suspended";
    }

    if (actualData?.status === "inactive") {
      return "Inactive";
    }

    if (actualData?.status === "active") {
      return isCurrentlyOpen() ? "Open" : "Closed";
    }

    return "Closed";
  };

  const getCurrentStatusColor = () => {
    const actualData = getActualData();

    if (actualData?.status === "pending") {
      return "bg-yellow-100 text-yellow-800";
    }

    if (actualData?.status === "rejected") {
      return "bg-red-100 text-red-800";
    }

    if (actualData?.status === "suspended") {
      return "bg-orange-100 text-orange-800";
    }

    if (actualData?.status === "inactive") {
      return "bg-gray-100 text-gray-800";
    }

    if (actualData?.status === "active") {
      return isCurrentlyOpen()
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
    }

    return "bg-gray-100 text-gray-800";
  };

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  // Recalculate stats when restaurant data changes
  useEffect(() => {
    if (restaurant && orders.length > 0) {
      calculateStats(orders);
    }
  }, [restaurant, orders]);

  // Recalculate stats when menu items change
  useEffect(() => {
    if (menuItems.length > 0 && orders.length > 0) {
      calculateStats(orders);
    }
  }, [menuItems, orders]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const [restaurantRes, ordersRes, menuRes] = await Promise.all([
        restaurantAPI.getRestaurantProfile(),
        orderAPI.getRestaurantOrders(),
        restaurantAPI.getMenuItems()
      ]);

      if (restaurantRes.success) {
        const restaurantData = restaurantRes.data?.restaurant || restaurantRes.data;
        setRestaurant(restaurantData);
      }

      if (ordersRes.success) {
        setOrders(ordersRes.data);
        calculateStats(ordersRes.data);
      }

      if (menuRes.success) {
        // menuRes.data is already an array, not wrapped in an object
        setMenuItems(menuRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const totalOrders = ordersData.length;
    const pendingOrders = ordersData.filter(
      (order) => order.status === "pending"
    ).length;
    const completedOrders = ordersData.filter(
      (order) => order.status === "delivered"
    ).length;
    const totalRevenue = ordersData
      .filter((order) => order.status === "delivered")
      .reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Get average rating from restaurant data, not orders
    const actualData = getActualData();
    const averageRating = actualData?.rating || 0;

    setStats({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      averageRating: averageRating.toFixed(1),
      totalMenuItems: menuItems.length,
    });
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrderStatus(orderId, { status: newStatus });
      fetchRestaurantData();
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2.5 sm:p-3 bg-orange-100 rounded-lg">
              <MdRestaurant size={24} className="text-orange-600 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Restaurant Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Welcome back, {getActualData()?.name || "Restaurant Owner"}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-6">
            {/* Restaurant Status */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 mb-1">Restaurant Status</p>
                <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getCurrentStatusColor()}`}>
                      {getCurrentStatusText()}
                    </span>
                    {getActualData()?.status === "active" && isCurrentlyOpen() && getTimeUntilClosing() && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Closes in {getTimeUntilClosing()}</span>
                      </div>
                    )}
                  </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-gray-300"></div>

            {/* New Orders */}
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <MdShoppingCart size={20} className="text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">New Orders</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.pendingOrders}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MdShoppingCart size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.totalOrders}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <MdAttachMoney size={24} className="text-green-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                ₹{parseFloat(stats.totalRevenue || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <MdStar size={24} className="text-yellow-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.averageRating}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MdMenu size={24} className="text-purple-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.totalMenuItems}
              </div>
              <div className="text-sm text-gray-600">Menu Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Today's Performance</h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {orders.filter(o => {
                  const today = new Date().toDateString();
                  const orderDate = new Date(o.createdAt).toDateString();
                  return today === orderDate;
                }).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Orders Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                ₹{parseFloat(orders.filter(o => {
                  const today = new Date().toDateString();
                  const orderDate = new Date(o.createdAt).toDateString();
                  return today === orderDate && o.status === "delivered";
                }).reduce((sum, order) => sum + (order.total || 0), 0)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Revenue Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                {orders.filter(o => {
                  const today = new Date().toDateString();
                  const orderDate = new Date(o.createdAt).toDateString();
                  return today === orderDate && o.status === "pending";
                }).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Quick Stats</h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === "pending").length}
              </div>
              <div className="text-sm text-blue-700 font-medium">Pending Orders</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === "preparing").length}
              </div>
              <div className="text-sm text-yellow-700 font-medium">In Kitchen</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === "ready_for_pickup").length}
              </div>
              <div className="text-sm text-green-700 font-medium">Ready for Pickup</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-gray-600">
                {orders.filter(o => o.status === "delivered").length}
              </div>
              <div className="text-sm text-gray-700 font-medium">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Activity</h3>
            <button 
              onClick={() => window.location.href = '/restaurant/orders'}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              View All
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    order.status === "pending" ? "bg-yellow-500" :
                    order.status === "preparing" ? "bg-blue-500" :
                    order.status === "ready_for_pickup" ? "bg-green-500" :
                    order.status === "delivered" ? "bg-gray-500" :
                    "bg-red-500"
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Order #{order._id.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.items?.length || 0} items • ₹{parseFloat(order.total || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    order.status === "preparing" ? "bg-blue-100 text-blue-800" :
                    order.status === "ready_for_pickup" ? "bg-green-100 text-green-800" :
                    order.status === "delivered" ? "bg-gray-100 text-gray-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {order.status === "ready_for_pickup" ? "ready" : order.status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default RestaurantDashboard;

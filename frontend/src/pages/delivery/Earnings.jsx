import React, { useState, useEffect } from "react";
import { ordersAPI } from "../../services/api";
import {
  MdAttachMoney,
  MdTrendingUp,
  MdLocalShipping,
  MdStar,
  MdCheckCircle,
  MdSchedule
} from "react-icons/md";

const Earnings = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('week');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getDeliveryOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletedOrders = () => {
    return orders.filter(order => order.status === 'delivered');
  };

  const calculateEarnings = (ordersData, filter = 'week') => {
    const now = new Date();
    let startDate;

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }

    return ordersData.filter(order => {
      const orderDate = new Date(order.updatedAt || order.createdAt);
      return orderDate >= startDate;
    });
  };

  const getEarningsData = () => {
    const completedOrders = getCompletedOrders();
    const filteredOrders = calculateEarnings(completedOrders, timeFilter);
    
    const totalEarnings = filteredOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
    const totalDeliveries = filteredOrders.length;
    const averageEarnings = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

    return {
      totalEarnings,
      totalDeliveries,
      averageEarnings,
      filteredOrders
    };
  };

  const earningsData = getEarningsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen backcolor">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Professional Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
            <MdAttachMoney size={28} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-600 text-sm">Track your delivery earnings and performance</p>
          </div>
        </div>
      </div>

      {/* Time Filter */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          <div className="flex flex-wrap gap-2">
            {['today', 'week', 'month'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  timeFilter === filter
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Earnings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{earningsData.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <MdAttachMoney size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Deliveries</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{earningsData.totalDeliveries}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <MdLocalShipping size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Average per Delivery</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{earningsData.averageEarnings.toFixed(0)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <MdTrendingUp size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Completed Deliveries */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Completed Deliveries</h3>
            <p className="text-gray-600 text-sm">Your latest successful deliveries</p>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {earningsData.filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MdCheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No completed deliveries in this period</p>
              <p className="text-sm">Complete more deliveries to see your earnings here</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {earningsData.filteredOrders.slice(0, 10).map(order => (
                <div key={order._id} className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <span className="font-mono text-sm font-medium text-gray-900">#{order._id.slice(-8)}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Delivered
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MdLocalShipping className="text-orange-500" size={16} />
                          <span>₹{order.deliveryFee || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MdSchedule className="text-blue-500" size={16} />
                          <span>{new Date(order.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MdStar className="text-yellow-500" size={16} />
                          <span>{order.rating || 'No rating'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Earnings;

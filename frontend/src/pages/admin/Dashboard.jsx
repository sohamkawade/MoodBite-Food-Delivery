import React, { useState, useEffect } from "react";
import { 
  MdRestaurant, 
  MdShoppingCart, 
  MdTrendingUp, 
  MdPeople,
  MdDashboard,
  MdSchedule,
  MdLocalShipping,
  MdAttachMoney,
  MdWarning,
  MdAccountBalance,
  MdCalendarToday
} from "react-icons/md";
import { adminAPI } from "../../services/api";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState({
    balance: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    thisWeekEarnings: 0,
    thisMonthEarnings: 0,
    recentTransactions: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, earningsResponse] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getBalance()
        ]);
        
        if (dashboardResponse.success) {
          setDashboardData(dashboardResponse.data);
        }
        
        if (earningsResponse.success) {
          setEarningsData({
            balance: earningsResponse.data.balance || 0,
            totalEarnings: earningsResponse.data.totalEarnings || 0,
            todayEarnings: earningsResponse.data.todayEarnings || 0,
            thisWeekEarnings: earningsResponse.data.thisWeekEarnings || 0,
            thisMonthEarnings: earningsResponse.data.thisMonthEarnings || 0,
            recentTransactions: earningsResponse.data.recentTransactions || []
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
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
      {/* Professional Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
            <MdDashboard size={28} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm">Complete overview of MoodBite ecosystem</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Restaurants</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData?.counts?.totalRestaurants || 0}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <MdRestaurant size={24} className="text-blue-600" />
            </div>
          </div>
          {dashboardData?.counts?.pendingRestaurants > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <MdWarning size={16} className="text-orange-500" />
              <span className="text-xs sm:text-sm text-orange-600">{dashboardData.counts.pendingRestaurants} pending approval</span>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData?.counts?.totalUsers || 0}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <MdPeople size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData?.counts?.totalOrders || 0}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <MdShoppingCart size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Delivery Partners</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData?.counts?.totalDeliveryBoys || 0}</p>
            </div>
            <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg">
              <MdLocalShipping size={24} className="text-indigo-600" />
            </div>
          </div>
          {dashboardData?.counts?.pendingDeliveryBoys > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <MdWarning size={16} className="text-orange-500" />
              <span className="text-xs sm:text-sm text-orange-600">{dashboardData.counts.pendingDeliveryBoys} pending approval</span>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-3 sm:mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MdTrendingUp size={20} className="text-blue-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">System Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Menu Items</span>
            <span className="text-sm sm:font-semibold text-gray-900">{dashboardData?.counts?.totalMenuItems || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Restaurants</span>
            <span className="text-sm sm:font-semibold text-gray-900">
              {dashboardData?.restaurantStatusDistribution?.find(s => s._id === 'active')?.count || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Platform Earnings Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
            <MdTrendingUp size={24} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Platform Earnings</h2>
            <p className="text-gray-600 text-sm">Track your platform commission and earnings</p>
          </div>
        </div>

        {/* Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-orange-600">Current Balance</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-900">
                  ₹{earningsData.balance.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-200 rounded-lg">
                <MdAccountBalance size={24} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600">Today's Earnings</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">
                  ₹{earningsData.todayEarnings.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-200 rounded-lg">
                <MdTrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600">This Week</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  ₹{earningsData.thisWeekEarnings.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-200 rounded-lg">
                <MdCalendarToday size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-600">Total Earnings</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900">
                  ₹{earningsData.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-200 rounded-lg">
                <MdTrendingUp size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="p-1.5 bg-orange-100 rounded-lg mr-3">
              <MdTrendingUp size={20} className="text-orange-600" />
            </div>
            Recent Platform Earnings
          </h3>
          
          {earningsData.recentTransactions && earningsData.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {earningsData.recentTransactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <MdTrendingUp size={16} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description || transaction.type || 'Platform Commission'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600">
                      +₹{transaction.amount.toLocaleString()}
                    </p>
                    <p className={`text-xs ${
                      transaction.status === 'completed' ? 'text-green-600' : 
                      transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MdTrendingUp size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No recent earnings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      {dashboardData?.recentOrders && dashboardData.recentOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MdSchedule size={20} className="text-orange-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{order.orderId}</td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'N/A'}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {order.restaurant ? order.restaurant.name : 'N/A'}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-[11px] sm:text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

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
  MdWarning
} from "react-icons/md";
import { adminAPI } from "../../services/api";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboardStats();
        
        if (response.success) {
          setDashboardData(response.data);
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

      {/* Revenue and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-3 sm:mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <MdAttachMoney size={20} className="text-green-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Revenue Overview</h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="text-sm sm:font-semibold text-gray-900">{formatCurrency(dashboardData?.revenue?.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-sm sm:font-semibold text-gray-900">{formatCurrency(dashboardData?.revenue?.averageOrderValue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-3 sm:mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdTrendingUp size={20} className="text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">System Status</h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
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

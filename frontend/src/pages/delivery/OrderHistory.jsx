import React, { useState, useEffect } from "react";
import { ordersAPI } from "../../services/api";
import {
  MdLocalShipping,
  MdCheckCircle,
  MdAttachMoney,
  MdRestaurant,
  MdLocationOn,
  MdStar,
  MdSearch,
  MdReceipt
} from "react-icons/md";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      case 'out_for_delivery': return 'In Transit';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = searchTerm === '' || 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.restaurant?.name && order.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const completedOrders = filteredOrders.filter(order => order.status === 'delivered');
  const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
  const totalDeliveries = completedOrders.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen backcolor">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdLocalShipping size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order History</h1>
              <p className="text-gray-600 text-sm">View your delivery history and earnings</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-600">Total Earnings</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <MdCheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalDeliveries}</div>
              <div className="text-xs sm:text-sm text-gray-600">Completed Deliveries</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <MdAttachMoney size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">₹{totalEarnings.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Earnings</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <MdReceipt size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{filteredOrders.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'delivered', 'cancelled', 'rejected', 'out_for_delivery'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full sm:w-64 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order History</h3>
            <p className="text-gray-600 text-sm">Showing {filteredOrders.length} orders</p>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MdLocalShipping size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No orders found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredOrders.map(order => (
                <div key={order._id} className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <span className="font-mono text-sm font-medium text-gray-900">#{order._id.slice(-8)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MdRestaurant className="text-orange-500" size={16} />
                          <span className="truncate">{order.restaurant?.name || 'Restaurant'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MdLocationOn className="text-red-500" size={16} />
                          <span className="truncate">{order.deliveryAddress?.street || order.deliveryAddress?.city || 'Address'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MdAttachMoney className="text-green-500" size={16} />
                          <span>₹{order.deliveryFee || 0} • {order.items?.length || 0} items</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {order.status === 'delivered' ? 'Delivered: ' : 'Updated: '}
                        {new Date(order.updatedAt || order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {order.rating && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MdStar className="text-yellow-500" size={16} />
                        <span className="font-medium">{order.rating}/5</span>
                      </div>
                    )}
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

export default OrderHistory;

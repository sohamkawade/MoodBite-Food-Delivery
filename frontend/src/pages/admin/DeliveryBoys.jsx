import React, { useState, useEffect } from "react";
import { 
  MdLocalShipping, 
  MdCheckCircle, 
  MdCancel, 
  MdDelete, 
  MdSearch,
  MdFilterList,
  MdVisibility,
  MdEmail,
  MdLocationOn,
  MdDirectionsBike,
  MdSchedule,
  MdClose
} from "react-icons/md";
import { deliveryBoysAPI } from "../../services/api";
import { useAdminAuth } from "../../context/AdminAuthContext";
import toast from 'react-hot-toast';

const DeliveryBoys = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { isAdminLoggedIn } = useAdminAuth();

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchDeliveryBoys();
    }
  }, [isAdminLoggedIn]);

  const fetchDeliveryBoys = async () => {
    try {
      setLoading(true);
      const response = await deliveryBoysAPI.list();
      
      if (response.success) {
        const deliveryBoysData = response.data?.deliveryBoys || response.data || [];
        
        if (Array.isArray(deliveryBoysData)) {
          setDeliveryBoys(deliveryBoysData);
        } else {
          console.warn('Delivery boys data is not an array:', deliveryBoysData);
          setDeliveryBoys([]);
        }
      } else {
        console.warn('API response not successful:', response);
        setDeliveryBoys([]);
      }
    } catch (error) {
      console.error('Failed to fetch delivery boys:', error);
      setMessage({ type: "error", text: "Failed to fetch delivery boys" });
      setDeliveryBoys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryBoyId, newStatus) => {
    try {
      const response = newStatus === 'approved'
        ? await deliveryBoysAPI.approve(deliveryBoyId)
        : await deliveryBoysAPI.reject(deliveryBoyId);
      if (response.success) {
        setMessage({ type: "success", text: `Delivery boy ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully!` });
        fetchDeliveryBoys();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      setMessage({ type: "error", text: "Failed to update status" });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleDelete = async (deliveryBoyId) => {
    if (window.confirm('Are you sure you want to delete this delivery boy?')) {
      try {
        const response = await deliveryBoysAPI.remove(deliveryBoyId);
        if (response.success) {
          setMessage({ type: "success", text: "Delivery boy deleted successfully!" });
          fetchDeliveryBoys(); // Refresh the list
          setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        }
      } catch (error) {
        console.error('Failed to delete delivery boy:', error);
        setMessage({ type: "error", text: "Failed to delete delivery boy" });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      }
    }
  };

  const filteredDeliveryBoys = (deliveryBoys || []).filter(deliveryBoy => {
    const matchesSearch = deliveryBoy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deliveryBoy.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deliveryBoy.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || deliveryBoy.approvalStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
      approved: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusCount = (status) => {
    return (deliveryBoys || []).filter(db => db.approvalStatus === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <MdLocalShipping size={28} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Delivery Partner Management</h1>
              <p className="text-gray-600 text-sm">Manage all delivery partners and their approval status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <MdLocalShipping size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{deliveryBoys?.length || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Partners</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <MdSchedule size={24} className="text-yellow-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{getStatusCount('pending')}</div>
              <div className="text-xs sm:text-sm text-gray-600">Pending Approval</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <MdCheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{getStatusCount('approved')}</div>
              <div className="text-xs sm:text-sm text-gray-600">Approved</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <MdCancel size={24} className="text-red-600" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{getStatusCount('rejected')}</div>
              <div className="text-xs sm:text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MdFilterList className="text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === "success" 
            ? "bg-green-50 border border-green-200 text-green-700" 
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      {/* Delivery Boys List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            Delivery Partners ({filteredDeliveryBoys.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredDeliveryBoys.map((deliveryBoy) => (
            <div key={deliveryBoy._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MdLocalShipping size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">{deliveryBoy.name}</div>
                      <div className="text-xs sm:text-sm text-gray-600">{deliveryBoy.phone}</div>
                    </div>
                    {getStatusBadge(deliveryBoy.approvalStatus)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MdEmail size={16} />
                      <span className="break-words">{deliveryBoy.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MdDirectionsBike size={16} />
                      <span>{deliveryBoy.vehicleType || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MdLocationOn size={16} />
                      <span className="break-words">{deliveryBoy.city}, {deliveryBoy.state}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDeliveryBoy(deliveryBoy);
                      setShowDetails(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <MdVisibility size={20} />
                  </button>
                  
                  {deliveryBoy.approvalStatus === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusUpdate(deliveryBoy._id, 'approved')}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs sm:text-sm flex items-center space-x-1"
                      >
                        <MdCheckCircle size={16} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(deliveryBoy._id, 'rejected')}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs sm:text-sm flex items-center space-x-1"
                      >
                        <MdCancel size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleDelete(deliveryBoy._id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredDeliveryBoys.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MdLocalShipping size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No delivery partners found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Details Modal */}
      {showDetails && selectedDeliveryBoy && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-xl p-3 sm:p-6 w-[96%] sm:w-auto mx-0 sm:mx-4 max-h-[80vh] sm:max-h-[90vh] overflow-y-auto sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Delivery Partner Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 -m-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900 text-sm sm:text-base">{selectedDeliveryBoy.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900 text-sm sm:text-base">{selectedDeliveryBoy.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900 text-sm sm:text-base break-words">{selectedDeliveryBoy.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(selectedDeliveryBoy.approvalStatus)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <p className="text-gray-900 text-sm sm:text-base">{selectedDeliveryBoy.vehicleType || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <p className="text-gray-900 text-sm sm:text-base">{selectedDeliveryBoy.vehicleNumber || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-gray-900 text-sm sm:text-base break-words">
                  {selectedDeliveryBoy.address}, {selectedDeliveryBoy.area}, {selectedDeliveryBoy.city}, {selectedDeliveryBoy.state} {selectedDeliveryBoy.zipCode}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License ID</label>
                <p className="text-gray-900 text-sm sm:text-base">{selectedDeliveryBoy.licenseId || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                <p className="text-gray-900 text-sm sm:text-base">
                  {new Date(selectedDeliveryBoy.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-sm sm:text-base text-gray-600 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryBoys;

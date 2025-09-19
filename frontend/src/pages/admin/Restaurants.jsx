import React, { useState, useEffect } from "react";
import { 
  MdSearch, 
  MdRestaurant, 
  MdStar,
  MdLocalShipping,
  MdLocationOn,
  MdVisibility,
  MdClose,
  MdCheck,
  MdBlock,
  MdTimer,
} from "react-icons/md";
import { restaurantAPI } from "../../services/api";

const Restaurants = () => {
  const [showViewForm, setShowViewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All Cuisines");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [viewRestaurant, setViewRestaurant] = useState(null);
  // Removed delivery partner controls from this page per requirement

  const cuisines = ["Indian", "Italian", "Chinese", "Japanese", "Mexican", "Thai", "American", "Mediterranean", "French", "Korean", "Pizza", "Biryani", "Thali"];
  const statuses = ["active", "inactive", "suspended", "pending"];

  // Fetch restaurants on component mount
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await restaurantAPI.getAllRestaurants();
      if (response.success) {
        setRestaurants(response.data.restaurants);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch restaurants" });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (restaurantId, action) => {
    try {
      const status = action === 'approve' ? 'active' : 'rejected';
      await restaurantAPI.updateRestaurantStatus(restaurantId, status);
      setMessage({ type: "success", text: `Restaurant ${action}d successfully` });
      fetchRestaurants();
    } catch (error) {
      setMessage({ type: "error", text: `Failed to ${action} restaurant` });
    }
  };

  const handleStatusChange = async (restaurantId, newStatus) => {
    try {
      await restaurantAPI.updateRestaurantStatus(restaurantId, newStatus);
      setMessage({ type: "success", text: "Restaurant status updated successfully" });
      fetchRestaurants();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update restaurant status" });
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (window.confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      try {
        await restaurantAPI.deleteRestaurant(restaurantId);
        setMessage({ type: "success", text: "Restaurant deleted successfully" });
        fetchRestaurants();
      } catch (error) {
        setMessage({ type: "error", text: "Failed to delete restaurant" });
      }
    }
  };

  const openViewForm = (restaurant) => {
    setViewRestaurant(restaurant);
    setShowViewForm(true);
  };

  const closeViewForm = () => {
    setShowViewForm(false);
    setViewRestaurant(null);
  };


  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.location?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = selectedCuisine === "All Cuisines" || 
                          (Array.isArray(restaurant.cuisines) && restaurant.cuisines.includes(selectedCuisine));
    const matchesStatus = selectedStatus === "All Status" || restaurant.status === selectedStatus;
    return matchesSearch && matchesCuisine && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-20 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdRestaurant size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Restaurant Management</h1>
              <p className="text-gray-600 text-sm">Approve and manage restaurant partners</p>
            </div>
          </div>
          <div></div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-xl border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-500' 
            : 'bg-red-50 text-red-800 border-red-500'
        }`}>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="relative">
            <MdSearch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" 
              placeholder="Search restaurants..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" 
            value={selectedCuisine}
            onChange={(e) => setSelectedCuisine(e.target.value)}
          >
            <option>All Cuisines</option>
            {cuisines.map(cuisine => (
              <option key={cuisine}>{cuisine}</option>
            ))}
          </select>
          <select 
            className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option>All Status</option>
            {statuses.map(status => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Restaurants Grid (Card View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredRestaurants.map(restaurant => (
          <div key={restaurant._id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="relative">
              <img 
                src={restaurant.imageUrl || "/img/default-restaurant.jpg"} 
                alt={restaurant.name} 
                className="w-full h-28 sm:h-32 md:h-36 object-cover"
                onError={(e) => {
                  e.target.src = "/img/default-restaurant.jpg";
                }}
                key={`${restaurant._id}-${restaurant.imageUrl}`}
              />
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                restaurant.status === 'active' ? 'bg-green-500 text-white' :
                restaurant.status === 'inactive' ? 'bg-gray-500 text-white' :
                restaurant.status === 'suspended' ? 'bg-red-500 text-white' :
                restaurant.status === 'pending' ? 'bg-yellow-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {restaurant.status}
              </div>
            </div>
            <div className="p-4">
              <h6 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{restaurant.name}</h6>
              <p className="text-gray-600 mb-2 text-xs">{Array.isArray(restaurant.cuisines) && restaurant.cuisines.length ? restaurant.cuisines.join(', ') : (restaurant.cuisine || '')}</p>
              <div className="flex items-center space-x-3 mb-3">
                <span className="flex items-center space-x-1 text-xs text-gray-700">
                  <MdStar size={14} className="text-yellow-500" />
                  <span className="font-medium">
                    {restaurant.totalRatings > 0 ? (restaurant.rating / restaurant.totalRatings).toFixed(1) : '0.0'}
                  </span>
                </span>
                <span className="flex items-center space-x-1 text-xs text-gray-700">
                  <MdLocalShipping size={14} className="text-blue-600" />
                  <span className="font-medium">{restaurant.totalOrders || 0} orders</span>
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600 mb-3">
                <MdLocationOn size={14} />
                <span className="break-words">{restaurant.location?.address}{restaurant.location?.area ? `, ${restaurant.location.area}` : ''}, {restaurant.location?.city}</span>
              </div>
              
              {/* Operating Hours */}
              <div className="mb-3">
                <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                  <MdTimer size={12} />
                  <span className="font-medium">Operating Hours:</span>
                </div>
                <div className="text-xs text-gray-600">
                  {restaurant.operatingHours?.monday?.open && restaurant.operatingHours?.monday?.close ? (
                    <span className="text-green-600 font-medium">
                      {restaurant.operatingHours.monday.open} - {restaurant.operatingHours.monday.close}
                    </span>
                  ) : (
                    <span className="text-red-500">Hours not set</span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  onClick={() => openViewForm(restaurant)}
                >
                  <MdVisibility size={12} />
                  View
                </button>
                
                {restaurant.status === 'pending' ? (
                  <div className="flex gap-1">
                    <button 
                      className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors shadow-sm"
                      onClick={() => handleApproval(restaurant._id, 'approve')}
                    >
                      <MdCheck size={12} />
                      Approve
                    </button>
                    <button 
                      className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors shadow-sm"
                      onClick={() => handleApproval(restaurant._id, 'reject')}
                    >
                      <MdBlock size={12} />
                      Reject
                    </button>
                  </div>
                ) : (
                  <select 
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    value={restaurant.status}
                    onChange={(e) => handleStatusChange(restaurant._id, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Restaurant Modal */}
      {showViewForm && viewRestaurant && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full mx-2 sm:mx-0 h-[85vh] sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
            <div className="p-3 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-xl font-bold text-gray-900">Restaurant Details</h3>
                <button onClick={closeViewForm} className="-m-2 p-2 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300">
                  <MdClose size={22} />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                  <p className="text-gray-900 text-sm sm:text-base">{viewRestaurant.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                    viewRestaurant.status === 'active' ? 'bg-green-100 text-green-800' :
                    viewRestaurant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {viewRestaurant.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisines</label>
                  <p className="text-gray-900 text-sm sm:text-base">{Array.isArray(viewRestaurant.cuisines) ? viewRestaurant.cuisines.join(', ') : viewRestaurant.cuisine || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <p className="text-gray-900 text-sm sm:text-base break-words">{viewRestaurant.contact?.phone || 'N/A'}</p>
                  <p className="text-gray-900 text-sm sm:text-base break-words">{viewRestaurant.contact?.email || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900 text-sm break-words">{viewRestaurant.location?.address}, {viewRestaurant.location?.area}, {viewRestaurant.location?.city}, {viewRestaurant.location?.state}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 text-sm break-words">{viewRestaurant.description || 'No description available'}</p>
                </div>
                
                {/* Operating Hours */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <div key={day} className="text-xs sm:text-sm">
                        <span className="font-medium text-gray-700 capitalize">{day}:</span>
                        <div className="text-gray-600">
                          {viewRestaurant.operatingHours?.[day]?.open && viewRestaurant.operatingHours?.[day]?.close ? (
                            <>
                              <div className="text-green-600">{viewRestaurant.operatingHours[day].open}</div>
                              <div className="text-green-600">{viewRestaurant.operatingHours[day].close}</div>
                            </>
                          ) : (
                            <span className="text-red-500">Hours not set</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Documents Section */}
              {viewRestaurant.documents && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {viewRestaurant.documents.fssaiLicense && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI License</label>
                        <p className="text-gray-900 text-sm break-words">{viewRestaurant.documents.fssaiLicense}</p>
                      </div>
                    )}
                    {viewRestaurant.documents.gstNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                        <p className="text-gray-900 text-sm break-words">{viewRestaurant.documents.gstNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons in Modal */}
              <div className="border-t pt-3 sm:pt-4 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => handleDeleteRestaurant(viewRestaurant._id)}
                  className="px-4 py-2 text-sm sm:text-base bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full sm:w-auto"
                >
                  Delete Restaurant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Restaurants;

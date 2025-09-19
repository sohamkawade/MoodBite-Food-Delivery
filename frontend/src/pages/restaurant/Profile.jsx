import React, { useState, useEffect } from "react";
import { useRestaurantAuth } from "../../context/RestaurantAuthContext";
import { restaurantAuthAPI } from "../../services/api";
import {
  MdRestaurant,
  MdLocationOn,
  MdBusiness,
  MdEdit,
  MdSave,
  MdCancel,
  MdCheckCircle,
  MdWarning,
  MdSchedule,
  MdPhone,
  MdEmail,
  MdInfo
} from "react-icons/md";

const Profile = () => {
  const { restaurantUser, updateRestaurantUser, refreshRestaurantData } = useRestaurantAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cuisine: '',
    openingTime: '',
    closingTime: ''
  });

  // Update current time every minute to refresh status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Helper function to get the actual restaurant data
  const getActualData = () => {
    return restaurantUser?.restaurant || restaurantUser;
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get current day's operating hours
  const getCurrentDayHours = () => {
    const actualData = getActualData();
    if (!actualData?.operatingHours) return { open: '', close: '' };

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(); // 'mon', 'tue', etc.
    
    // Map day names to match the model structure
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
    if (!today || !actualData.operatingHours[today]) return { open: '', close: '' };
    
    return {
      open: actualData.operatingHours[today].open || '',
      close: actualData.operatingHours[today].close || ''
    };
  };

  // Debug function to show operating hours data
  const debugOperatingHours = () => {
    const actualData = getActualData();
    return actualData?.operatingHours;
  };

  // Function to check if restaurant is currently open based on time
  const isCurrentlyOpen = () => {
    const actualData = getActualData();
    
    // If restaurant is not approved (pending), it should be closed
    if (actualData?.status === 'pending') return false;
    
    if (!actualData?.operatingHours?.monday) return false;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(); // 'mon', 'tue', etc.
    const currentTime = now.toTimeString().slice(0, 5); // 'HH:MM' format
    
    // Map day names to match the model structure
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
    if (!today || !actualData.operatingHours[today]) return false;
    
    const { open, close, isOpen } = actualData.operatingHours[today];
    
    // If the day is marked as closed, return false
    if (isOpen === false) return false;
    
    // If no operating hours set, return false
    if (!open || !close) return false;
    
    // Convert times to minutes for easier comparison
    const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
    const openMinutes = parseInt(open.split(':')[0]) * 60 + parseInt(open.split(':')[1]);
    const closeMinutes = parseInt(close.split(':')[0]) * 60 + parseInt(close.split(':')[1]);
   
    // Compare current time with opening and closing times
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  // Function to get current status text
  const getCurrentStatusText = () => {
    const actualData = getActualData();
    
    // If restaurant is pending approval, show pending status
    if (actualData?.status === 'pending') {
      return 'Pending Approval';
    }
    
    // If restaurant is rejected, show rejected status
    if (actualData?.status === 'rejected') {
      return 'Rejected';
    }
    
    // If restaurant is suspended, show suspended status
    if (actualData?.status === 'suspended') {
      return 'Suspended';
    }
    
    // If restaurant is inactive, show inactive status
    if (actualData?.status === 'inactive') {
      return 'Inactive';
    }
    
    // If restaurant is active, check operating hours
    if (actualData?.status === 'active') {
      return isCurrentlyOpen() ? 'Open' : 'Closed';
    }
    
    // Default fallback
    return 'Closed';
  };

  // Function to get current status color
  const getCurrentStatusColor = () => {
    const actualData = getActualData();
    
    if (actualData?.status === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    if (actualData?.status === 'rejected') {
      return 'bg-red-100 text-red-800';
    }
    
    if (actualData?.status === 'suspended') {
      return 'bg-orange-100 text-orange-800';
    }
    
    if (actualData?.status === 'inactive') {
      return 'bg-gray-100 text-gray-800';
    }
    
    if (actualData?.status === 'active') {
      return isCurrentlyOpen() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
    
    return 'bg-gray-100 text-gray-800';
  };

  // Function to fetch restaurant data
  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      await refreshRestaurantData();
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantUser && Object.keys(restaurantUser).length > 0) {
      const actualData = getActualData();
      
      // Handle operating hours - check multiple possible structures
      let openingTime = '';
      let closingTime = '';
      
      if (actualData.operatingHours?.monday?.open) {
        openingTime = actualData.operatingHours.monday.open;
      } else if (actualData.openingTime) {
        openingTime = actualData.openingTime;
      }
      
      if (actualData.operatingHours?.monday?.close) {
        closingTime = actualData.operatingHours.monday.close;
      } else if (actualData.closingTime) {
        closingTime = actualData.closingTime;
      }
      
      setFormData({
        name: actualData.name || '',
        email: actualData.contact?.email || '',
        phone: actualData.contact?.phone || '',
        address: actualData.location?.address || '',
        city: actualData.location?.city || '',
        state: actualData.location?.state || '',
        zipCode: actualData.location?.zipCode || '',
        cuisine: actualData.cuisine || '',
        openingTime: openingTime,
        closingTime: closingTime
      });
    } else {
      fetchRestaurantData();
    }
  }, [restaurantUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Format data according to backend expectations
      const formattedData = {
        name: formData.name,
        cuisine: formData.cuisine,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        contact: {
          email: formData.email,
          phone: formData.phone
        },
        // Add operating hours if they exist
        ...(formData.openingTime && { openingTime: formData.openingTime }),
        ...(formData.closingTime && { closingTime: formData.closingTime })
      };

      const response = await restaurantAuthAPI.updateRestaurantProfile(formattedData);

      if (response.success) {
        // The API returns { success: true, data: { restaurant: {...} } }
        const updatedData = response.data?.restaurant || response.data || response;
        
        updateRestaurantUser(updatedData);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        
        // Force a refresh of the data to ensure it's updated
        setTimeout(() => {
          fetchRestaurantData();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (restaurantUser) {
      const actualData = getActualData();
      
      // Handle operating hours - check multiple possible structures
      let openingTime = '';
      let closingTime = '';
      
      if (actualData.operatingHours?.monday?.open) {
        openingTime = actualData.operatingHours.monday.open;
      } else if (actualData.openingTime) {
        openingTime = actualData.openingTime;
      }
      
      if (actualData.operatingHours?.monday?.close) {
        closingTime = actualData.operatingHours.monday.close;
      } else if (actualData.closingTime) {
        closingTime = actualData.closingTime;
      }
      
      setFormData({
        name: actualData.name || '',
        email: actualData.contact?.email || '',
        phone: actualData.contact?.phone || '',
        address: actualData.location?.address || '',
        city: actualData.location?.city || '',
        state: actualData.location?.state || '',
        zipCode: actualData.location?.zipCode || '',
        cuisine: actualData.cuisine || '',
        openingTime: openingTime,
        closingTime: closingTime
      });
    }
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <MdCheckCircle size={20} className="text-green-600" />;
      case 'pending': return <MdWarning size={20} className="text-amber-600" />;
      case 'rejected': return <MdWarning size={20} className="text-red-600" />;
      case 'inactive': return <MdInfo size={20} className="text-gray-600" />;
      case 'suspended': return <MdWarning size={20} className="text-orange-600" />;
      default: return <MdInfo size={20} className="text-gray-600" />;
    }
  };

  if (!restaurantUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 mb-6 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 md:p-3 bg-orange-100 rounded-lg">
              <MdRestaurant size={28} className="text-orange-600 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Restaurant Profile</h1>
              <p className="text-gray-600 text-sm md:text-base">Manage your restaurant information</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 ${getStatusColor(restaurantUser.status)}`}>
              {getStatusIcon(getActualData()?.status)}
              <span className="capitalize">{getActualData()?.status || 'pending'}</span>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 self-start"
              >
                <MdEdit size={18} className="md:w-5 md:h-5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 self-start"
                >
                  <MdSave size={18} className="md:w-5 md:h-5" />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 self-start"
                >
                  <MdCancel size={18} className="md:w-5 md:h-5" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-100 rounded-lg text-center">
          <p className="text-blue-800">Loading restaurant data...</p>
        </div>
      )}

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Basic Information */}
        <div className="rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 bg-white">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MdBusiness className="text-orange-500" />
            <span>Basic Information</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter restaurant name"
                />
              ) : (
                <p className="text-gray-900">{getActualData()?.name || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              ) : (
                <div>
                  <p className="text-gray-900 flex items-center space-x-2">
                    <MdEmail size={16} className="text-gray-500" />
                    <span>{getActualData()?.contact?.email || 'Not provided'}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              ) : (
                <div>
                  <p className="text-gray-900 flex items-center space-x-2">
                    <MdPhone size={16} className="text-gray-500" />
                    <span>{getActualData()?.contact?.phone || 'Not provided'}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
              {isEditing ? (
                <input
                  type="text"
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Italian, Chinese, Indian"
                />
              ) : (
                <div>
                  <p className="text-gray-900">{getActualData()?.cuisine || 'Not provided'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 bg-white">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MdLocationOn className="text-orange-500" />
            <span>Location Information</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter restaurant address"
                />
              ) : (
                <div>
                  <p className="text-gray-900">{getActualData()?.location?.address || 'Not provided'}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="City"
                  />
                ) : (
                  <p className="text-gray-900">{getActualData()?.location?.city || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="State"
                  />
                ) : (
                  <p className="text-gray-900">{getActualData()?.location?.state || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="ZIP Code"
                  />
                ) : (
                  <p className="text-gray-900">{getActualData()?.location?.zipCode || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 bg-white">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MdSchedule className="text-orange-500" />
            <span>Operating Hours</span>
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                {isEditing ? (
                  <input
                    type="time"
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {getCurrentDayHours().open || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                {isEditing ? (
                  <input
                    type="time"
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {getCurrentDayHours().close || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 bg-white">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MdCheckCircle className="text-orange-500" />
            <span>Restaurant Status</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Approval Status</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(getActualData()?.status)}`}>
                <span className="capitalize">{getActualData()?.status || 'pending'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Current Status</span>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCurrentStatusColor()}`}>
                  {getCurrentStatusText()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Registration Date</span>
              <span className="text-sm text-gray-900 font-medium">
                {getActualData()?.createdAt ? 
                  new Date(getActualData()?.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 
                  'Not available'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

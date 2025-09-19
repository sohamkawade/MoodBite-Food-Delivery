import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import { userAPI } from "../../services/api";
import { 
  MdPerson, 
  MdLocationOn, 
  MdStar, 
  MdCardGiftcard, 
  MdShare, 
  MdNotifications,
  MdEdit,
  MdSave,
  MdLogout,
  MdHistory,
  MdFavorite,
  MdAdd 
} from "react-icons/md";
import { GiKnifeFork } from "react-icons/gi";

const Profile = () => {
  const { user, logout, updateUser } = useUserAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    addresses: user?.addresses || [],
    preferences: user?.preferences || {
      cuisine: [],
      spiceLevel: 'medium',
      dietaryRestrictions: []
    },
    notifications: user?.notifications || {
      email: true,
      sms: true,
      push: true,
      marketing: true
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        addresses: user.addresses || [],
        preferences: user.preferences || {
          cuisine: [],
          spiceLevel: 'medium',
          dietaryRestrictions: []
        },
        notifications: user.notifications || {
          email: true,
          sms: true,
          push: true,
          marketing: true
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCoordinatesFromAddress = async (address) => {
    try {
      const cityStateAddress = address.split(',').slice(-3).join(',').trim();
      
      const encodedAddress = encodeURIComponent(cityStateAddress);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in`, {
        headers: {
          'User-Agent': 'MoodBite-User-App/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
          };
        }
      }
      
      const fullEncodedAddress = encodeURIComponent(address);
      const fullResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fullEncodedAddress}&limit=1&countrycodes=in`, {
        headers: {
          'User-Agent': 'MoodBite-User-App/1.0'
        }
      });
      
      if (fullResponse.ok) {
        const fullData = await fullResponse.json();
        
        if (fullData && fullData.length > 0) {
          return {
            latitude: parseFloat(fullData[0].lat),
            longitude: parseFloat(fullData[0].lon)
          };
        }
      }
      
      // Fallback to major cities
      const majorCities = {
        'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
        'Delhi': { latitude: 28.7041, longitude: 77.1025 },
        'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
        'Hyderabad': { latitude: 17.3850, longitude: 78.4867 },
        'Chennai': { latitude: 13.0827, longitude: 80.2707 },
        'Kolkata': { latitude: 22.5726, longitude: 88.3639 },
        'Pune': { latitude: 18.5204, longitude: 73.8567 },
        'Ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
        'Jaipur': { latitude: 26.9124, longitude: 75.7873 },
        'Surat': { latitude: 21.1702, longitude: 72.8311 },
        'Lucknow': { latitude: 26.8467, longitude: 80.9462 },
        'Kanpur': { latitude: 26.4499, longitude: 80.3319 },
        'Nagpur': { latitude: 21.1458, longitude: 79.0882 },
        'Indore': { latitude: 22.7196, longitude: 75.8577 },
        'Thane': { latitude: 19.2183, longitude: 72.9781 },
        'Bhopal': { latitude: 23.2599, longitude: 77.4126 },
        'Visakhapatnam': { latitude: 17.6868, longitude: 83.2185 },
        'Pimpri-Chinchwad': { latitude: 18.6298, longitude: 73.7997 },
        'Patna': { latitude: 25.5941, longitude: 85.1376 },
        'Vadodara': { latitude: 22.3072, longitude: 73.1812 }
      };
      
      // Try to match city name from address
      for (const [cityName, coords] of Object.entries(majorCities)) {
        if (address.toLowerCase().includes(cityName.toLowerCase())) {
          return coords;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  };

  const handleAddressChange = async (index, field, value) => {
    const newAddresses = [...formData.addresses];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newAddresses[index][parent][child] = value;
    } else {
      newAddresses[index][field] = value;
    }
    setFormData(prev => ({ ...prev, addresses: newAddresses }));

    // Get coordinates when address fields are updated
    if (field === 'address.street' || field === 'address.city' || field === 'address.state') {
      const address = newAddresses[index].address;
      if (address.street && address.city && address.state) {
        setIsLoadingCoordinates(true);
        const fullAddress = `${address.street}, ${address.city}, ${address.state}, India`;
        const coordinates = await getCoordinatesFromAddress(fullAddress);
        if (coordinates) {
          newAddresses[index].address.coordinates = coordinates;
          setFormData(prev => ({ ...prev, addresses: newAddresses }));
        }
        setIsLoadingCoordinates(false);
      }
    }
  };

  const addAddress = () => {
    setFormData(prev => {
      if ((prev.addresses || []).length > 0) return prev;
      const next = {
        ...prev,
        addresses: [{
          type: 'home',
          address: {
            street: '',
            landmark: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India',
            coordinates: { latitude: null, longitude: null }
          },
          isDefault: true
        }]
      };
      return next;
    });
    setIsEditingAddress(true);
  };

  const removeAddress = async (index) => {
    try {
      setIsLoading(true);
      setMessage("");
      
      const newAddresses = formData.addresses.filter((_, i) => i !== index);
      
      const response = await userAPI.updateProfile({ ...formData, addresses: newAddresses });
      
      if (response.success) {
        setFormData(prev => ({
          ...prev,
          addresses: newAddresses
        }));
        updateUser(response.data.user);
        setMessage("Address removed successfully!");
        setIsEditingAddress(false);
      } else {
        setMessage(response.message || "Failed to remove address");
      }
    } catch (error) {
      setMessage("Error removing address");
      console.error('Error removing address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: value
      }
    }));
  };

  const handleNotificationChange = (type) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await userAPI.updateProfile(formData);
      if (response.success) {
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        updateUser(response.data.user);
      } else {
        setMessage(response.message || "Failed to update profile");
      }
    } catch (error) {
      setMessage("Error updating profile");
    }

    setIsLoading(false);
  };

  const handleSaveTab = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      // Ensure only one address is saved and marked default if present
      const singleAddress = (formData.addresses || []).slice(0,1).map(a => ({ ...a, isDefault: true }));
      const response = await userAPI.updateProfile({ ...formData, addresses: singleAddress });
      if (response.success) {
        setMessage("Profile updated successfully!");
        updateUser(response.data.user);
        setIsEditingAddress(false);
      } else {
        setMessage(response.message || "Failed to update profile");
      }
    } catch (error) {
      setMessage("Error updating profile");
    }

    setIsLoading(false);
  };

  

  const getLoyaltyTierColor = (tier) => {
    switch (tier) {
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen backcolor pt-14 md:pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            message.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Header Section */}
        <div className="relative rounded-2xl shadow-xl border border-gray-100 bg-white/80 backdrop-blur p-5 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ring-4 ring-white/60 shadow-lg">
                <GiKnifeFork size={40} className="text-white" />
              </div>
              <div className="md:hidden">
                <h1 className="text-xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)} shadow-sm`}>{user.status}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLoyaltyTierColor(user.loyaltyTier)} shadow-sm`}>{user.loyaltyTier} Member</span>
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-medium">{new Date(user.joinDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-5 md:p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MdStar className="text-orange-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Loyalty Points</p>
                <p className="text-2xl font-bold text-gray-900">{user.loyaltyPoints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 md:p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MdHistory className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{user.totalOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 md:p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MdCardGiftcard className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{user.totalSpent || 0}</p>
              </div>
            </div>
          </div>

          
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-100">
          <div className="border-b border-gray-200 sticky top-14 md:top-16 z-10 bg-white/80 backdrop-blur rounded-t-2xl">
            <nav className="flex gap-4 md:gap-8 px-4 md:px-6 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Overview', icon: MdPerson },
                { id: 'addresses', label: 'Addresses', icon: MdLocationOn },
                { id: 'preferences', label: 'Preferences', icon: MdFavorite },
                { id: 'notifications', label: 'Notifications', icon: MdNotifications }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5 md:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-5 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors self-start"
                  >
                    {isEditing ? <MdSave size={16} /> : <MdEdit size={16} />}
                    <span>{isEditing ? 'Save' : 'Edit'}</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                    />
                  </div>

                  {isEditing && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-3 py-1.5 text-sm md:px-6 md:py-2 md:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 self-start"
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-sm md:px-6 md:py-2 md:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors self-start"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-5 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delivery Addresses</h3>
                    <p className="text-sm text-gray-600 mt-1">Coordinates are automatically stored for delivery purposes</p>
                  </div>
                  <div className="flex gap-2">
                    {formData.addresses.length === 0 ? (
                      <button
                        onClick={addAddress}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-1"
                      >
                        <MdAdd size={16} />
                        <span>Add Address</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (isEditingAddress) {
                              handleSaveTab();
                            } else {
                              setIsEditingAddress(true);
                            }
                          }}
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-1 ${isEditingAddress ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-orange-500 text-white hover:bg-orange-600'} disabled:opacity-50`}
                        >
                          {isEditingAddress ? <MdSave size={16} /> : <MdEdit size={16} />}
                          <span>{isEditingAddress ? (isLoading ? 'Saving...' : 'Save') : 'Edit'}</span>
                        </button>
                        <button
                          onClick={() => { removeAddress(0); setIsEditingAddress(false); }}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {formData.addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MdLocationOn size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No addresses added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(formData.addresses.slice(0,1)).map((address, index) => (
                      <div key={0} className="border border-gray-200 rounded-xl p-4 md:p-5 bg-white/70 backdrop-blur">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                            <select
                              value={address.type}
                              onChange={(e) => handleAddressChange(index, 'type', e.target.value)}
                              disabled={!isEditingAddress}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                            >
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">House/Flat Number & Building/Apartment Name</label>
                            <input
                              type="text"
                              value={address.address.street}
                              onChange={(e) => handleAddressChange(index, 'address.street', e.target.value)}
                              disabled={!isEditingAddress}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                              placeholder="e.g., 203, Shanti Residency"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street / Locality / Landmark</label>
                            <input
                              type="text"
                              value={address.address.landmark || ''}
                              onChange={(e) => handleAddressChange(index, 'address.landmark', e.target.value)}
                              disabled={!isEditingAddress}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                              placeholder="e.g., Near City Mall, Rajiv Gandhi Road"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              value={address.address.city}
                              onChange={(e) => handleAddressChange(index, 'address.city', e.target.value)}
                              disabled={!isEditingAddress}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                              placeholder="Enter city"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                            <input
                              type="text"
                              value={address.address.zipCode}
                              onChange={(e) => handleAddressChange(index, 'address.zipCode', e.target.value)}
                              disabled={!isEditingAddress}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                              placeholder="e.g., 560001"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State (optional)</label>
                            <input
                              type="text"
                              value={address.address.state}
                              onChange={(e) => handleAddressChange(index, 'address.state', e.target.value)}
                              disabled={!isEditingAddress}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                              placeholder="Enter state"
                            />
                          </div>
                          <input type="hidden" name={`addresses[${index}].address.coordinates.latitude`} value={address.address.coordinates?.latitude ?? ''} readOnly />
                          <input type="hidden" name={`addresses[${index}].address.coordinates.longitude`} value={address.address.coordinates?.longitude ?? ''} readOnly />

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-5 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Food Preferences</h3>
                  <button
                    onClick={handleSaveTab}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-1 self-start"
                  >
                    <MdSave size={16} />
                    <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Cuisines</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american', 'mediterranean'].map((cuisine) => (
                      <label key={cuisine} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.preferences.cuisine.includes(cuisine)}
                          onChange={(e) => {
                            const newCuisines = e.target.checked
                              ? [...formData.preferences.cuisine, cuisine]
                              : formData.preferences.cuisine.filter(c => c !== cuisine);
                            handlePreferenceChange('cuisine', newCuisines);
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{cuisine}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Spice Level Preference</label>
                  <select
                    value={formData.preferences.spiceLevel}
                    onChange={(e) => handlePreferenceChange('spiceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                    <option value="extra-hot">Extra Hot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'].map((diet) => (
                      <label key={diet} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.preferences.dietaryRestrictions.includes(diet)}
                          onChange={(e) => {
                            const newDiets = e.target.checked
                              ? [...formData.preferences.dietaryRestrictions, diet]
                              : formData.preferences.dietaryRestrictions.filter(d => d !== diet);
                            handlePreferenceChange('dietaryRestrictions', newDiets);
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{diet.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-5 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                  <button
                    onClick={handleSaveTab}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-1 self-start"
                  >
                    <MdSave size={16} />
                    <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'Email Notifications', description: 'Receive order updates and offers via email' },
                    { key: 'sms', label: 'SMS Notifications', description: 'Get order status updates via SMS' },
                    { key: 'push', label: 'Push Notifications', description: 'Receive app notifications for orders and offers' },
                    { key: 'marketing', label: 'Marketing Communications', description: 'Receive promotional offers and deals' }
                  ].map((notification) => (
                    <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white/70 backdrop-blur">
                      <div>
                        <h4 className="font-medium text-gray-900">{notification.label}</h4>
                        <p className="text-sm text-gray-500">{notification.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.notifications[notification.key]}
                          onChange={() => handleNotificationChange(notification.key)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              setIsLoading(true);
              await logout();
              setIsLoading(false);
            }}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mx-auto disabled:opacity-50"
          >
            <MdLogout size={20} />
            <span>{isLoading ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

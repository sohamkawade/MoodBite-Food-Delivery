import React, { useState, useEffect } from "react";
import { useDeliveryAuth } from "../../context/DeliveryAuthContext";
import { deliveryAuthAPI } from "../../services/api";
import {
  MdPerson,
  MdLocationOn,
  MdTwoWheeler,
  MdEdit,
  MdSave,
  MdCancel,
  MdStar,
  MdCheckCircle,
  MdWarning
} from "react-icons/md";

const Profile = () => {
  const { deliveryUser, updateDeliveryUser } = useDeliveryAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    vehicleNumber: '',
    licenseId: '',
    vehicleType: ''
  });

  useEffect(() => {
    if (deliveryUser) {
      setFormData({
        name: deliveryUser.name || '',
        phone: deliveryUser.phone || '',
        email: deliveryUser.email || '',
        address: deliveryUser.address || '',
        city: deliveryUser.city || '',
        state: deliveryUser.state || '',
        zipCode: deliveryUser.zipCode || '',
        vehicleNumber: deliveryUser.vehicleNumber || '',
        licenseId: deliveryUser.licenseId || '',
        vehicleType: deliveryUser.vehicleType || ''
      });
    }
  }, [deliveryUser]);

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

      const response = await deliveryAuthAPI.updateProfile(formData);
      
      if (response.success) {
        updateDeliveryUser(response.data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
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
    if (deliveryUser) {
      setFormData({
        name: deliveryUser.name || '',
        phone: deliveryUser.phone || '',
        email: deliveryUser.email || '',
        address: deliveryUser.address || '',
        city: deliveryUser.city || '',
        state: deliveryUser.state || '',
        zipCode: deliveryUser.zipCode || '',
        vehicleNumber: deliveryUser.vehicleNumber || '',
        licenseId: deliveryUser.licenseId || '',
        vehicleType: deliveryUser.vehicleType || ''
      });
    }
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const getApprovalStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getApprovalStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <MdCheckCircle size={20} />;
      case 'pending': return <MdWarning size={20} />;
      case 'rejected': return <MdWarning size={20} />;
      default: return <MdWarning size={20} />;
    }
  };

  if (!deliveryUser) {
    return (
      <div className="flex items-center justify-center min-h-screen backcolor">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-20 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Mobile Header - Simple and Clean */}
      <div className="md:hidden bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MdPerson size={24} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 text-sm">Manage your profile</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getApprovalStatusColor(deliveryUser.approvalStatus)}`}>
            {getApprovalStatusIcon(deliveryUser.approvalStatus)}
            <span className="capitalize">{deliveryUser.approvalStatus}</span>
          </div>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <MdEdit size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium"
              >
                <MdSave size={16} />
                <span>{loading ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <MdCancel size={16} />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <MdPerson size={32} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">Manage your delivery partner profile</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getApprovalStatusColor(deliveryUser.approvalStatus)}`}>
              {getApprovalStatusIcon(deliveryUser.approvalStatus)}
              <span className="capitalize">{deliveryUser.approvalStatus}</span>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <MdEdit size={20} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <MdSave size={20} />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <MdCancel size={20} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Mobile Profile Cards - Simple and Clean */}
      <div className="md:hidden space-y-4">
        {/* Personal Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center space-x-2 mb-4">
            <MdPerson className="text-orange-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Personal Info</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-900 text-sm py-2">{deliveryUser.name || 'Not provided'}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-gray-900 text-sm py-2">{deliveryUser.phone || 'Not provided'}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-gray-900 text-sm py-2">{deliveryUser.email || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center space-x-2 mb-4">
            <MdTwoWheeler className="text-orange-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Info</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              {isEditing ? (
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  <option value="">Select vehicle type</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="car">Car</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              ) : (
                <p className="text-gray-900 text-sm py-2">{deliveryUser.vehicleType || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Enter vehicle number"
                />
              ) : (
                <p className="text-gray-900 text-sm py-2">{deliveryUser.vehicleNumber || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License ID</label>
              {isEditing ? (
                <input
                  type="text"
                  name="licenseId"
                  value={formData.licenseId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Enter license ID"
                />
              ) : (
                <p className="text-gray-900 text-sm py-2">{deliveryUser.licenseId || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center space-x-2 mb-4">
            <MdLocationOn className="text-orange-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Address</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Enter your address"
                />
              ) : (
                <p className="text-gray-900 text-sm py-2">{deliveryUser.address || 'Not provided'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    placeholder="City"
                  />
                ) : (
                  <p className="text-gray-900 text-sm py-2">{deliveryUser.city || 'Not provided'}</p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    placeholder="State"
                  />
                ) : (
                  <p className="text-gray-900 text-sm py-2">{deliveryUser.state || 'Not provided'}</p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    placeholder="ZIP Code"
                  />
                ) : (
                  <p className="text-gray-900 text-sm py-2">{deliveryUser.zipCode || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center space-x-2 mb-4">
            <MdStar className="text-orange-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Current Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                deliveryUser.status === 'available' ? 'bg-green-100 text-green-800' :
                deliveryUser.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {deliveryUser.status || 'offline'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Online Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                deliveryUser.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {deliveryUser.online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Profile Information */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MdPerson className="text-orange-500" />
            <span>Personal Information</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-900">{deliveryUser.name || 'Not provided'}</p>
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
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-gray-900">{deliveryUser.phone || 'Not provided'}</p>
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
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-gray-900">{deliveryUser.email || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MdTwoWheeler className="text-orange-500" />
            <span>Vehicle Information</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              {isEditing ? (
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select vehicle type</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="car">Car</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              ) : (
                <p className="text-gray-900">{deliveryUser.vehicleType || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter vehicle number"
                />
              ) : (
                <p className="text-gray-900">{deliveryUser.vehicleNumber || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License ID</label>
              {isEditing ? (
                <input
                  type="text"
                  name="licenseId"
                  value={formData.licenseId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter license ID"
                />
              ) : (
                <p className="text-gray-900">{deliveryUser.licenseId || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MdLocationOn className="text-orange-500" />
            <span>Address Information</span>
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
                  placeholder="Enter your address"
                />
              ) : (
                <p className="text-gray-900">{deliveryUser.address || 'Not provided'}</p>
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
                  <p className="text-gray-900">{deliveryUser.city || 'Not provided'}</p>
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
                  <p className="text-gray-900">{deliveryUser.state || 'Not provided'}</p>
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
                  <p className="text-gray-900">{deliveryUser.zipCode || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance & Status */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MdStar className="text-orange-500" />
            <span>Performance & Status</span>
          </h2>          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Current Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                deliveryUser.status === 'available' ? 'bg-green-100 text-green-800' :
                deliveryUser.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {deliveryUser.status || 'offline'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Online Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                deliveryUser.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {deliveryUser.online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

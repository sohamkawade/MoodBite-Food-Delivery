import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { adminAPI } from "../../services/api";
import { 
  MdDashboard, 
  MdRestaurant, 
  MdMenuBook, 
  MdShoppingCart, 
  MdPeople, 
  MdAnalytics, 
  MdLogout, 
  MdMenu, 
  MdClose, 
  MdPerson, 
  MdEdit, 
  MdSave, 
  MdLocalShipping,
  MdCancel, 
  MdVisibility, 
  MdVisibilityOff,
  MdEmail,
  MdPhone,
  MdSecurity,
  MdCalendarToday,
  MdBadge,
  MdVerifiedUser,
  MdSettings,
  MdMenu as MdHamburger
} from "react-icons/md";
import { GiKnifeFork } from "react-icons/gi";
import Dashboard from "./Dashboard";
import Restaurants from "./Restaurants";
import Menu from "./Menu";
import Orders from "./Orders";
import Users from "./Users";
import Analytics from "./Analytics";
import DeliveryBoys from "./DeliveryBoys";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("profile"); 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdminLoggedIn, adminUser, logout, isLoading: authLoading } = useAdminAuth();
  
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    status: "",
    lastLogin: "",
    createdAt: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn && activeTab === "profile") {
      loadProfileData();
    }
  }, [isAdminLoggedIn, activeTab]);

  // Sync active tab with query param (tab)
  useEffect(() => {
    if (location.pathname === '/admin') {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!authLoading && !isAdminLoggedIn) {
      navigate("/admin/login");
    }
  }, [authLoading, isAdminLoggedIn, navigate]);

  // Show loading while restoring session
  if (authLoading) {
    return (
      <div className="min-h-screen backcolor flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn || !adminUser) {
    return null;
  }

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getProfile();
      if (response.success) {
        const admin = response.data.admin;
        setProfileData({
          firstName: admin.firstName || "",
          lastName: admin.lastName || "",
          email: admin.email || "",
          phone: admin.phone || "",
          role: admin.role || "",
          status: admin.status || "",
          lastLogin: admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "",
          createdAt: admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : ""
        });
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      setMessage({ type: "error", text: "Failed to load profile data" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true);
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone
      };
      
      const response = await adminAPI.updateProfile(updateData);
      if (response.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: response.message || "Failed to update profile" });
        // Clear error message after 5 seconds
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" });
      // Clear error message after 5 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await adminAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: response.message || "Failed to change password" });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to change password" });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const renderProfile = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 text-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MdPerson size={28} className="text-white md:w-12 md:h-12" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-3xl font-bold text-gray-900 truncate">{profileData.firstName} {profileData.lastName}</h1>
              <p className="text-orange-500 text-sm md:text-lg font-medium">{profileData.role}</p>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1 md:mt-2">
                <div className="flex items-center space-x-1 md:space-x-2 bg-green-50 px-2 md:px-3 py-1 rounded-lg border border-green-200">
                  <MdVerifiedUser size={14} className="text-green-600 md:w-4 md:h-4"/>
                  <span className="text-green-700 font-medium text-xs md:text-sm">{profileData.status}</span>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2 bg-blue-50 px-2 md:px-3 py-1 rounded-lg border border-blue-200">
                  <MdCalendarToday size={12} className="text-blue-600 md:w-4 md:h-4"/>
                  <span className="text-blue-700 text-xs md:text-sm">Member since {new Date(profileData.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm md:px-6 md:py-3 md:text-base bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-medium shadow-sm self-start sm:self-center"
            >
              <MdEdit size={16} className="md:w-5 md:h-5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-xl border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-500' 
            : 'bg-red-50 text-red-800 border-red-500'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <MdVerifiedUser size={20} className="text-green-500" />
            ) : (
              <MdSettings size={20} className="text-red-500" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Profile Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MdPerson size={24} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <MdBadge size={16} className="text-blue-500" />
                  <span>First Name</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter first name"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-900 font-medium">{profileData.firstName}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <MdBadge size={16} className="text-blue-500" />
                  <span>Last Name</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter last name"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-900 font-medium">{profileData.lastName}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <MdEmail size={16} className="text-blue-500" />
                <span>Email Address</span>
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-900 font-medium">{profileData.email}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <MdPhone size={16} className="text-blue-500" />
                <span>Phone Number</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-900 font-medium">{profileData.phone}</p>
                </div>
              )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleProfileUpdate}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm self-start"
                >
                  <MdSave size={16} />
                  <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    loadProfileData();
                  }}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 font-medium shadow-sm self-start"
                >
                  <MdCancel size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MdSecurity size={24} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                <MdBadge size={16} className="mr-2" />
                {profileData.role}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border ${
                profileData.status === 'active' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                <MdVerifiedUser size={16} className="mr-2" />
                {profileData.status}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <MdCalendarToday size={16} className="text-blue-500" />
                <span>Last Login</span>
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-900 font-medium">{profileData.lastLogin}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <MdCalendarToday size={16} className="text-blue-500" />
                <span>Member Since</span>
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-900 font-medium">{profileData.createdAt}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <MdSecurity size={24} className="text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 pr-12"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPasswords.current ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 pr-12"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPasswords.new ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 pr-12"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPasswords.confirm ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handlePasswordChange}
          disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 text-sm shadow-sm"
        >
          <MdSecurity size={18} />
          <span>{isChangingPassword ? 'Changing Password...' : 'Change Password'}</span>
        </button>
      </div>

      {/* Logout Section */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 flex items-center space-x-2 font-medium shadow-sm"
        >
          <MdLogout size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfile();
      case "dashboard":
        return <Dashboard />;
      case "restaurants":
        return <Restaurants />;
      case "menu":
        return <Menu />;
      case "orders":
        return <Orders />;
      case "users":
        return <Users />;
      case "analytics":
        return <Analytics />;

      case "delivery-boys":
        return <DeliveryBoys />;
      default:
        return renderProfile();
    }
  };

  const menuItems = [
    { id: "profile", label: "Profile", icon: <MdPerson size={24} /> },
    { id: "dashboard", label: "Dashboard", icon: <MdDashboard size={24} /> },
    { id: "restaurants", label: "Restaurants", icon: <MdRestaurant size={24} /> },
    { id: "delivery-boys", label: "Delivery Partners", icon: <MdLocalShipping size={24} /> },
    { id: "menu", label: "Menu", icon: <MdMenuBook size={24} /> },
    { id: "orders", label: "Orders", icon: <MdShoppingCart size={24} /> },
    { id: "users", label: "Users", icon: <MdPeople size={24} /> },
    { id: "analytics", label: "Analytics", icon: <MdAnalytics size={24} /> },

  ];

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      setTouchStartX(e.touches[0].clientX);
      setTouchEndX(null);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      setTouchEndX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const deltaX = touchEndX - touchStartX;
    // Open if swipe right from left edge
    if (!isMobileNavOpen && touchStartX <= 20 && deltaX > 50) {
      setIsMobileNavOpen(true);
    }
    // Close if swipe left when drawer open
    if (isMobileNavOpen && deltaX < -50) {
      setIsMobileNavOpen(false);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div className="flex backcolor min-h-screen" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {!isMobileNavOpen && (
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className={`fixed md:hidden p-2 rounded-lg backcolor shadow-md border border-gray-200 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-500 z-[75] left-3 top-16`}
          aria-label="Open menu"
        >
          <MdHamburger size={22} />
        </button>
      )}

      {/* Sidebar */}
      <div className={`text-gray-800 border-r border-gray-200 flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'}
        fixed left-0 top-16 bottom-0 z-50 backcolor transform transition-all duration-500 ease-in-out will-change-transform md:sticky md:top-16 md:self-start md:h-[calc(100vh-4rem)] md:overflow-y-auto md:transform-none md:flex
        ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex`}>
        <div className="p-4 pt-10">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} mb-8`}>
            <div className="flex items-center ml-5 space-x-3">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-1">
                  <GiKnifeFork size={28} className="text-orange-500" />
                  <div className="flex items-center">
                    <span className="text-orange-500 font-bold text-lg">Mood</span>
                    <span className="text-gray-800 font-bold text-lg">Bite</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center mr-5">
              <button 
                className={`p-2 hover:bg-orange-100 rounded-lg transition-colors text-gray-600 hover:text-orange-600 hidden md:inline-flex`}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <MdMenu size={25} /> : <MdClose size={20} />}
              </button>
              {isMobileNavOpen && (
                <button
                  className="md:hidden p-2 hover:bg-orange-100 rounded-lg transition-colors text-gray-600 hover:text-orange-600"
                  onClick={() => setIsMobileNavOpen(false)}
                  aria-label="Close menu"
                  title="Close"
                >
                  <MdClose size={22} />
                </button>
              )}
            </div>
          </div>
        </div>
        
        <nav className="px-4">
          <ul className="space-y-4">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button 
                  onClick={() => { 
                    setActiveTab(item.id); 
                    setIsMobileNavOpen(false); 
                    navigate({ pathname: '/admin', search: `?tab=${item.id}` });
                  }}
                  title={sidebarCollapsed ? item.label : ""}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:bg-orange-100 hover:text-orange-600'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4"></div>
      </div>


      {isMobileNavOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-black/40 md:hidden" onClick={() => setIsMobileNavOpen(false)} aria-hidden="true"></div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 transition-all duration-500 ease-in-out ${isMobileNavOpen ? '' : ''}`}>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Admin;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useDeliveryAuth } from "../../context/DeliveryAuthContext";
import { 
  MdAccountBalance, 
  MdDashboard, 
  MdPerson, 
  MdLogout, 
  MdMenu, 
  MdClose,
  MdHistory,
  MdAttachMoney,
} from "react-icons/md";
import { GiKnifeFork } from "react-icons/gi";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import OrderHistory from "./OrderHistory";
import Earnings from "./Earnings";
import BankDetails from "./BankDetails";
import Navbar from "../../components/Navbar";

const DeliveryLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDeliveryLoggedIn, deliveryUser, logout, isLoading: authLoading } = useDeliveryAuth();

  // Set active tab based on current location
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/profile')) setActiveTab('profile');
    else if (path.includes('/history')) setActiveTab('history');
    else if (path.includes('/earnings')) setActiveTab('earnings');
    else if (path.includes('/bank-details')) setActiveTab('bank-details');
    else setActiveTab('dashboard');
  }, [location]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isDeliveryLoggedIn) {
      navigate("/delivery/login");
    }
  }, [authLoading, isDeliveryLoggedIn, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/delivery/login");
  };

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

  const renderContent = () => (
    <Routes>
      <Route path="profile" element={<Profile />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="history" element={<OrderHistory />} />
      <Route path="earnings" element={<Earnings />} />
      <Route path="bank-details" element={<BankDetails />} />
      <Route path="*" element={<Navigate to="/delivery/dashboard" replace />} />
    </Routes>
  );

  const menuItems = [
    { id: "profile", label: "Profile", icon: <MdPerson size={24} />, path: "/delivery/profile" },
    { id: "dashboard", label: "Dashboard", icon: <MdDashboard size={24} />, path: "/delivery/dashboard" },
    { id: "history", label: "Order History", icon: <MdHistory size={24} />, path: "/delivery/history" },
    { id: "earnings", label: "Earnings", icon: <MdAttachMoney size={24} />, path: "/delivery/earnings" },
    { id: "bank-details", label: "Bank Details", icon: <MdAccountBalance size={24} />, path: "/delivery/bank-details" },
  ];

  // Show loading while restoring session
  if (authLoading) {
    return (
      <div className="min-h-screen backcolor flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery panel...</p>
        </div>
      </div>
    );
  }

  if (!isDeliveryLoggedIn) {
    return null;
  }

  return (
    <div className="flex flex-col backcolor">
      <Navbar />
      
      {!isMobileNavOpen && (
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className={`fixed md:hidden p-2 rounded-lg backcolor shadow-md border border-gray-200 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-500 z-[75] left-3 top-20`}
          aria-label="Open menu"
        >
          <MdMenu size={22} />
        </button>
      )}

      <div className="flex flex-1">
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
                    onClick={() => { setActiveTab(item.id); navigate(item.path); setIsMobileNavOpen(false); }}
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

          <div className="p-4">
            <button 
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 text-gray-600 hover:bg-orange-100 hover:text-orange-600 rounded-lg transition-colors`}
              onClick={handleLogout}
              title={sidebarCollapsed ? "Logout" : ""}
            >
              <span className="flex-shrink-0"><MdLogout size={24} /></span>
              {!sidebarCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>

        {/* Overlay for mobile */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 top-16 z-40 bg-black/40 md:hidden" onClick={() => setIsMobileNavOpen(false)} aria-hidden="true"></div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4 md:p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLayout;

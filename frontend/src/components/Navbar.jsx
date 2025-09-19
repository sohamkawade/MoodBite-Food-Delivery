import { GiKnifeFork, GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineSearch } from "react-icons/ai";
import { FaUser } from "react-icons/fa";
import {
  MdShoppingCart,
  MdPerson,
  MdRestaurantMenu,
  MdLocalOffer,
  MdContactSupport,
  MdAdminPanelSettings,
  MdBusiness,
  MdDeliveryDining,
  MdRestaurant,
} from "react-icons/md";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useRestaurantAuth } from "../context/RestaurantAuthContext";
import { useDeliveryAuth } from "../context/DeliveryAuthContext";
import { cartAPI, deliveryAuthAPI } from "../services/api";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
  const { isUserLoggedIn, user, logout: userLogout } = useUserAuth();
  const { isAdminLoggedIn, adminUser, logout: adminLogout } = useAdminAuth();
  const { isRestaurantLoggedIn, restaurantUser, logout: restaurantLogout } = useRestaurantAuth();
  const { isDeliveryLoggedIn, deliveryUser, logout: deliveryLogout } = useDeliveryAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false);
  const [showDeliveryMenu, setShowDeliveryMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const userMenuRef = useRef(null);
  const adminMenuRef = useRef(null);
  const restaurantMenuRef = useRef(null);
  const deliveryMenuRef = useRef(null);
  const navigate = useNavigate()
  const location = useLocation()

  // Admin tab detection from query string for active state
  const searchParams = new URLSearchParams(location.search);
  const currentAdminTab = location.pathname === '/admin' ? (searchParams.get('tab') || 'profile') : null;
  const isAnyoneLoggedIn = isUserLoggedIn || isAdminLoggedIn || isRestaurantLoggedIn || isDeliveryLoggedIn;

  // Load cart count when user is logged in
  useEffect(() => {
    if (isUserLoggedIn) {
      loadCartCount();
    } else {
      setCartCount(0);
    }
  }, [isUserLoggedIn]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isUserLoggedIn) {
        loadCartCount();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [isUserLoggedIn]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
      if (restaurantMenuRef.current && !restaurantMenuRef.current.contains(event.target)) {
        setShowRestaurantMenu(false);
      }
      if (deliveryMenuRef.current && !deliveryMenuRef.current.contains(event.target)) {
        setShowDeliveryMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMobileMenuOpen]);

  const loadCartCount = async () => {
    try {
      const response = await cartAPI.getCartSummary();
      if (response.success && response.data) {
        setCartCount(response.data.itemCount || 0);
      }
    } catch (error) {
      console.error('Failed to load cart count:', error);
      setCartCount(0);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="backcolor shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            className="flex items-center font-bold text-lg sm:text-xl text-gray-800 hover:text-orange-500 transition-colors"
            to="/"
          >
            <div className="flex items-center">
              <GiKnifeFork size={24} className="text-gray-800 sm:hidden" />
              <GiKnifeFork size={28} className="text-gray-800 hidden sm:block" />
              <span className="bg-gradient-to-r from-orange-500 via-orange-700 to-orange-800 bg-clip-text text-transparent ml-2">MoodBite</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {isAdminLoggedIn ? (
              <>
                <Link
                  to={{ pathname: '/admin', search: '?tab=dashboard' }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                    currentAdminTab === 'dashboard'
                      ? 'text-orange-500 bg-orange-100'
                      : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'
                  }`}
                >
                  <MdAdminPanelSettings size={18} />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link
                  to={{ pathname: '/admin', search: '?tab=restaurants' }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                    currentAdminTab === 'restaurants'
                      ? 'text-orange-500 bg-orange-100'
                      : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'
                  }`}
                >
                  <MdRestaurant size={18} />
                  <span className="font-medium">Restaurants</span>
                </Link>
                <Link
                  to={{ pathname: '/admin', search: '?tab=orders' }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                    currentAdminTab === 'orders'
                      ? 'text-orange-500 bg-orange-100'
                      : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'
                  }`}
                >
                  <MdShoppingCart size={18} />
                  <span className="font-medium">Orders</span>
                </Link>
              </>
            ) : isRestaurantLoggedIn ? (
              <>
                <NavLink
                  to="/restaurant/dashboard"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdBusiness size={18} />
                  <span className="font-medium">Dashboard</span>
                </NavLink>
                <NavLink
                  to="/restaurant/orders"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdShoppingCart size={18} />
                  <span className="font-medium">Orders</span>
                </NavLink>
                <NavLink
                  to="/restaurant/menu"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdRestaurantMenu size={18} />
                  <span className="font-medium">Menu</span>
                </NavLink>
              </>
            ) : isDeliveryLoggedIn ? (
              <>
                <NavLink
                  to="/delivery/dashboard"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdDeliveryDining size={18} />
                  <span className="font-medium">Dashboard</span>
                </NavLink>
                <NavLink
                  to="/delivery/earnings"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdLocalOffer size={18} />
                  <span className="font-medium">Earnings</span>
                </NavLink>
                <NavLink
                  to="/delivery/order-history"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdShoppingCart size={18} />
                  <span className="font-medium">History</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/menu"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdRestaurantMenu size={18} />
                  <span className="font-medium">Menu</span>
                </NavLink>
                <NavLink
                  to="/offers"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdLocalOffer size={18} />
                  <span className="font-medium">Offers</span>
                </NavLink>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-orange-500 bg-orange-100"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdContactSupport size={18} />
                  <span className="font-medium">Contact</span>
                </NavLink>
              </>
            )}
          </div>

          {/* Right Side Content */}
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
            {/* Search Bar - Only show for logged-in customers */}
            {isUserLoggedIn && (
              <form className="hidden md:block" role="search">
                <div className="relative">
                  <input
                    type="search"
                    className="w-48 lg:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="Search..."
                    aria-label="Search"
                  />
                  <AiOutlineSearch
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
              </form>
            )}

            {/* Cart Icon */}
            {isUserLoggedIn && (
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors"
                aria-label="Cart"
              >
                <MdShoppingCart size={20} className="sm:hidden" />
                <MdShoppingCart size={24} className="hidden sm:block" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Partner Buttons - Only when nobody is logged in */}
            {!isUserLoggedIn && !isAdminLoggedIn && !isRestaurantLoggedIn && !isDeliveryLoggedIn && (
              <div className="hidden xl:flex items-center space-x-3">
                <Link
                  to="/restaurant/login"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors text-sm font-medium"
                  title="Restaurant Partner"
                >
                  <MdBusiness size={16} className="mr-1" />
                  Restaurant
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/delivery/login"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors text-sm font-medium"
                  title="Delivery Partner"
                >
                  <MdDeliveryDining size={16} className="mr-1" />
                  Delivery
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/admin/login"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors text-sm font-medium"
                  title="Admin Panel"
                >
                  <MdAdminPanelSettings size={16} className="mr-1" />
                  Admin
                </Link>
              </div>
            )}

            {/* User/Admin Profile or Login */}
            {isUserLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <Link
                  to="/profile"
                  className="lg:hidden flex items-center space-x-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
                  title="User Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <MdPerson size={16} className="text-orange-600 sm:hidden" />
                    <MdPerson size={18} className="text-orange-600 hidden sm:block" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">{user?.firstName}</span>
                </Link>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="hidden lg:flex items-center space-x-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
                  title="User Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <MdPerson size={16} className="text-orange-600 sm:hidden" />
                    <MdPerson size={18} className="text-orange-600 hidden sm:block" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">{user?.firstName}</span>
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MdPerson size={16} className="mr-3" />
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MdShoppingCart size={16} className="mr-3" />
                      My Orders
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={async () => {
                        await userLogout();
                        setShowUserMenu(false);
                        navigate('/')
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <MdPerson size={16} className="mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : isRestaurantLoggedIn ? (
              <div className="relative" ref={restaurantMenuRef}>
                <Link
                  to="/restaurant/dashboard"
                  className="lg:hidden flex items-center space-x-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
                  title="Restaurant Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <MdBusiness size={16} className="text-orange-600 sm:hidden" />
                    <MdBusiness size={18} className="text-orange-600 hidden sm:block" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">Restaurant</span>
                </Link>
                <button
                  onClick={() => setShowRestaurantMenu(!showRestaurantMenu)}
                  className="hidden lg:flex items-center space-x-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
                  title="Restaurant Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <MdBusiness size={16} className="text-orange-600 sm:hidden" />
                    <MdBusiness size={18} className="text-orange-600 hidden sm:block" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">Restaurant</span>
                </button>
                {showRestaurantMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    <Link
                      to="/restaurant/dashboard"
                      onClick={() => setShowRestaurantMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MdBusiness size={16} className="mr-3" />
                      Restaurant Panel
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={async () => {
                        try {
                          await restaurantLogout();
                        } catch {}
                        setShowRestaurantMenu(false);
                        navigate('/');
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <MdBusiness size={16} className="mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : isDeliveryLoggedIn ? (
              <div className="relative" ref={deliveryMenuRef}>
                <Link
                  to="/delivery/profile"
                  className="lg:hidden flex items-center space-x-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
                  title="Delivery Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MdDeliveryDining size={16} className="text-blue-600 sm:hidden" />
                    <MdDeliveryDining size={18} className="text-blue-600 hidden sm:block" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">{deliveryUser?.name || 'Delivery'}</span>
                </Link>
                <button
                  onClick={() => setShowDeliveryMenu(!showDeliveryMenu)}
                  className="hidden lg:flex items-center space-x-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
                  title="Delivery Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MdDeliveryDining size={16} className="text-blue-600 sm:hidden" />
                    <MdDeliveryDining size={18} className="text-blue-600 hidden sm:block" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">{deliveryUser?.name || 'Delivery'}</span>
                </button>
                                 {showDeliveryMenu && (
                   <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                     <div className="px-4 py-3 border-b border-gray-100">
                       <div className="font-medium text-gray-900">{deliveryUser?.name || 'Delivery Partner'}</div>
                       <div className="text-sm text-blue-600 font-medium">Delivery Partner</div>
                     </div>
                     <Link
                       to="/delivery/profile"
                       onClick={() => setShowDeliveryMenu(false)}
                       className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                     >
                       <MdPerson size={16} className="mr-3" />
                       My Profile
                     </Link>
                     <div className="border-t border-gray-100 my-1"></div>
                     <button
                       onClick={async () => {
                         await deliveryLogout();
                         setShowDeliveryMenu(false);
                         navigate('/');
                       }}
                       className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                     >
                       <MdDeliveryDining size={16} className="mr-3" />
                       Logout
                     </button>
                   </div>
                 )}
              </div>
            ) : isAdminLoggedIn ? (
              <div className="relative" ref={adminMenuRef}>
                <Link
                  to="/admin"
                  className="lg:hidden flex items-center space-x-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
                  title="Admin Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <MdAdminPanelSettings size={16} className="text-red-600 sm:hidden" />
                    <MdAdminPanelSettings size={18} className="text-red-600 hidden sm:block" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">{adminUser?.firstName}</span>
                </Link>
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="hidden lg:flex items-center space-x-2 px-2 sm:px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
                  title="Admin Account"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <MdAdminPanelSettings size={16} className="text-red-600 sm:hidden" />
                    <MdAdminPanelSettings size={18} className="text-red-600 hidden sm:block" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">{adminUser?.firstName}</span>
                </button>
                
                {/* Admin Dropdown Menu */}
                {showAdminMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{adminUser?.firstName} </div>
                      <div className="text-sm text-red-600 font-medium">Administrator</div>
                    </div>
                    <Link
                      to="/admin"
                      onClick={() => setShowAdminMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MdAdminPanelSettings size={16} className="mr-3" />
                      Admin Panel
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={async () => {
                        await adminLogout();
                        setShowAdminMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <MdAdminPanelSettings size={16} className="mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm sm:text-base"
              >
                <FaUser className="mr-1 sm:mr-2" size={12} />
                <span className="hidden sm:block">Login</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-gray-600 hover:text-orange-500 transition-colors mobile-menu-container"
              aria-label="Toggle mobile menu"
            >
              <GiHamburgerMenu size={20} className="sm:hidden" />
              <GiHamburgerMenu size={24} className="hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mobile-menu-container fixed inset-y-0 right-0 top-16 w-1/2 backcolor z-40 shadow-lg">
            <div className="px-4 pt-4 pb-6 space-y-2 h-full overflow-y-auto">

              {/* Mobile Navigation Links */}
              <div className="space-y-1">
                <NavLink
                  to="/menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "text-orange-500 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdRestaurantMenu size={20} />
                  <span className="font-medium">Menu</span>
                </NavLink>
                <NavLink
                  to="/offers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "text-orange-500 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdLocalOffer size={20} />
                  <span className="font-medium">Offers</span>
                </NavLink>
                <NavLink
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "text-orange-500 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                    }`
                  }
                >
                  <MdContactSupport size={20} />
                  <span className="font-medium">Contact</span>
                </NavLink>
              </div>


              {/* Partner Registration Links in Mobile Menu */}
              {!isUserLoggedIn && !isAdminLoggedIn && !isRestaurantLoggedIn && !isDeliveryLoggedIn && (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-1">
                  <Link
                    to="/restaurant/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdBusiness size={20} />
                    <span className="font-medium">Restaurant Partner</span>
                  </Link>
                  <Link
                    to="/delivery/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdDeliveryDining size={20} />
                    <span className="font-medium">Delivery Partner</span>
                  </Link>
                  <Link
                    to="/admin/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdAdminPanelSettings size={20} />
                    <span className="font-medium">Admin Panel</span>
                  </Link>
                </div>
              )}

              {/* Mobile Profile Links */}
              {isUserLoggedIn && (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdPerson size={20} />
                    <span className="font-medium">Profile</span>
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdShoppingCart size={20} />
                    <span className="font-medium">My Orders</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await userLogout();
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                  >
                    <MdPerson size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}

              {isAdminLoggedIn && (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-1">
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdAdminPanelSettings size={20} />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/admin?tab=restaurants"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdRestaurant size={20} />
                    <span className="font-medium">Restaurants</span>
                  </Link>
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdShoppingCart size={20} />
                    <span className="font-medium">Orders</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await adminLogout();
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                  >
                    <MdAdminPanelSettings size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}

              {isRestaurantLoggedIn && (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-1">
                  <Link
                    to="/restaurant/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdBusiness size={20} />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/restaurant/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdShoppingCart size={20} />
                    <span className="font-medium">Orders</span>
                  </Link>
                  <Link
                    to="/restaurant/menu"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdRestaurantMenu size={20} />
                    <span className="font-medium">Menu</span>
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        await restaurantLogout();
                      } catch {}
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                  >
                    <MdBusiness size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}

              {isDeliveryLoggedIn && (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-1">
                  <Link
                    to="/delivery/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdDeliveryDining size={20} />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/delivery/earnings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdLocalOffer size={20} />
                    <span className="font-medium">Earnings</span>
                  </Link>
                  <Link
                    to="/delivery/order-history"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MdShoppingCart size={20} />
                    <span className="font-medium">History</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await deliveryLogout();
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                  >
                    <MdDeliveryDining size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

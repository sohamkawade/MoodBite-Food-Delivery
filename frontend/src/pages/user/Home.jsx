import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdDeliveryDining, MdDiscount, MdAccessTime, MdRestaurantMenu, MdHome, MdStar, MdTimer, MdLocalFireDepartment, MdTrendingUp } from "react-icons/md";
import { menuAPI, cartAPI } from "../../services/api";
import toast from 'react-hot-toast';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useUserAuth } from "../../context/UserAuthContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useRestaurantAuth } from "../../context/RestaurantAuthContext";
import { useDeliveryAuth } from "../../context/DeliveryAuthContext";

const Home = () => {
  const highlights = [
    {
      icon: <MdDeliveryDining size={24} />,
      title: "Fast Delivery",
      subtitle: "Average 25–30 mins",
    },
    {
      icon: <MdDiscount size={24} />,
      title: "Daily Offers",
      subtitle: "Save up to 40%",
    },
    {
      icon: <MdAccessTime size={24} />,
      title: "Order Scheduling",
      subtitle: "Plan meals ahead",
    },
  ];
  const [highlightIndex, setHighlightIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % highlights.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    "Pizza",
    "Burgers",
    "Indian",
    "Chinese",
    "Desserts",
    "Healthy",
    "Drinks",
    "South Indian",
  ];

  const [specials, setSpecials] = useState([]);
  const [trending, setTrending] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const { isUserLoggedIn } = useUserAuth();
  const { isAdminLoggedIn } = useAdminAuth();
  const { isRestaurantLoggedIn } = useRestaurantAuth();
  const { isDeliveryLoggedIn } = useDeliveryAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        // Load trending items from dedicated endpoint
        const trendingRes = await menuAPI.getTrendingItems();
        if (trendingRes.success) {
          const trendingMapped = (trendingRes.data.items || []).map(i => ({
            id: i._id,
            name: i.name,
            image: i.image,
            price: i.price,
            category: i.category,
            rating: typeof i.rating === 'number' ? i.rating : 0,
            offer: i.offer || "", // Use actual offer field from database
            discountPercentage: i.discountPercentage || 0, // Keep discount for price calculation
            description: i.description || "",
            isSpecial: !!i.isSpecial,
            isTrending: !!i.isTrending,
            prepTime: typeof i.preparationTime === 'number' ? i.preparationTime : undefined,
            spiceLevel: i.spiceLevel || '',
            foodType: i.foodType || 'veg',
          }));
          

          setTrending(trendingMapped.slice(0, 8));
        }

        // Load new arrival items from dedicated endpoint
        const newArrivalsRes = await menuAPI.getNewArrivalItems();
        if (newArrivalsRes.success) {
          const newArrivalsMapped = (newArrivalsRes.data.items || []).map(i => ({
            id: i._id,
            name: i.name,
            image: i.image,
            price: i.price,
            category: i.category,
            rating: typeof i.rating === 'number' ? i.rating : 0,
            offer: i.offer || "",
            discountPercentage: i.discountPercentage || 0,
            description: i.description || "",
            prepTime: typeof i.preparationTime === 'number' ? i.preparationTime : undefined,
            spiceLevel: i.spiceLevel || '',
            foodType: i.foodType || 'veg',
          }));
          

          
          setSpecials(newArrivalsMapped.slice(0, 6));
        }
      } catch (e) {
        console.error('Failed to load home highlights', e);
      }
    };
    load();
  }, []);

  // Countdown timer logic for offers
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if we're in the time slots
      const isAfternoon = currentHour >= 12 && currentHour < 15; // 12 PM to 3 PM
      const isNight = currentHour >= 19 && currentHour < 22; // 7 PM to 10 PM
      
      if (isAfternoon || isNight) {
        let endTime;
        if (isAfternoon) {
          endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0); // 3 PM
        } else {
          endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0); // 10 PM
        }
        
        const diff = endTime - now;
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setCountdown(`${hours}h ${minutes}m`);
        } else {
          setCountdown(null);
        }
      } else {
        setCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Cart management functions (backend)
  const addToCart = async (itemId) => {
    try {
      const it = [...trending, ...specials].find(i => i.id === itemId);
      const response = await cartAPI.addToCart({ menuItemId: itemId, quantity: 1, restaurantId: it && (it.restaurantId || it.restaurant?.id || it.restaurant?._id) });
      if (response.success) {
        if (response.cartSwitched) {
          setCartItems({ [itemId]: 1 });
        } else {
          setCartItems(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
        }
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Added to cart');
      }
    } catch (e) {
      console.error('Failed to add to cart', e);
    }
  };

  const handleAddToCartClick = (itemId) => {
    if (!isUserLoggedIn) {
      toast.error('Please sign in as a customer to add items to your cart.');
      navigate('/login');
      return;
    }
    if (isAdminLoggedIn || isRestaurantLoggedIn || isDeliveryLoggedIn) {
      toast.error('Access restricted: sign in with a customer account to add items to cart.');
      return;
    }
    addToCart(itemId);
  };

  const removeFromCart = async (itemId) => {
    try {
      const currentQuantity = cartItems[itemId] || 0;
      const newQuantity = currentQuantity - 1;
      if (newQuantity <= 0) {
        await cartAPI.removeFromCart(itemId);
        setCartItems(prev => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
        window.dispatchEvent(new Event('cartUpdated'));
        toast('Removed from cart', { style: { background: '#ca8a04', color: '#fff' } });
      } else {
        await cartAPI.updateItemQuantity(itemId, newQuantity);
        setCartItems(prev => ({ ...prev, [itemId]: newQuantity }));
        window.dispatchEvent(new Event('cartUpdated'));
        toast('Updated quantity', { style: { background: '#ca8a04', color: '#fff' } });
      }
    } catch (e) {
      console.error('Failed to update cart', e);
    }
  };

  const getCartQuantity = (itemId) => cartItems[itemId] || 0;

  const getTotalCartItems = () => Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const getTotalCartPrice = () => {
    const allItems = [...trending, ...specials];
    return allItems.reduce((total, item) => {
      const quantity = cartItems[item.id] || 0;
      const price = item.discountPercentage > 0 
        ? item.price * (1 - item.discountPercentage / 100)
        : item.price;
      return total + (price * quantity);
    }, 0);
  };

  return (
    <div className="backcolor min-h-screen">
      {/* Hero Section */}
      <div className="relative text-white py-8 md:py-12 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                {/* Welcome and Home indicator */}
                <div className="inline-flex items-center mb-4 md:mb-6 px-3 md:px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-xs md:text-sm font-medium">
                  <MdHome className="mr-1 md:mr-2" size={16} />
                  <span>Welcome to MoodBite</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
                  Good food. <span className="text-orange-500">Good mood.</span>
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
                  Discover trending dishes, exclusive offers, and quick picks curated just for you.
                </p>

                {/* Category chips */}
                <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
                  {categories.map((cat) => (
                    <Link 
                      key={cat} 
                      to={`/menu?category=${encodeURIComponent(cat)}`} 
                      className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 shadow-sm text-xs md:text-sm"
                    >
                      <MdRestaurantMenu className="mr-1 md:mr-2 text-orange-500" size={14} /> {cat}
                    </Link>
                  ))}
                </div>

                <div className="inline-flex items-center p-3 md:p-4 bg-white rounded-xl shadow-lg border border-orange-100">
                  <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-full mr-3 md:mr-4">
                    {highlights[highlightIndex].icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm md:text-base">{highlights[highlightIndex].title}</div>
                    <small className="text-gray-500 text-xs md:text-sm">{highlights[highlightIndex].subtitle}</small>
                  </div>
                </div>
              </div>
              
              {/* Right side - Lottie Animation - Hidden on mobile */}
              <div className="hidden lg:flex items-center justify-center">
                <DotLottieReact
                  src="/delivery.lottie"
                  loop
                  autoplay
                  style={{ width: '100%', height: '500px' }}
                />
              </div>
            </div>
          </div>
        </div>



        {/* Trending Now - Same card style as Offers/Menu */}
        <section className="py-8 md:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">Trending Now</h2>
              <p className="text-base md:text-lg text-gray-600">Most popular dishes this week</p>
            </div>
            {trending.length === 0 ? (
              <div className="text-center py-20">
                <h4 className="text-xl font-semibold text-gray-400 mb-2">No trending items found</h4>
                <p className="text-gray-500">Check back later for trending dishes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {trending.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden border border-gray-100 group">
                    <div className="relative">
                      <img src={item.image} className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300" alt={item.name} />
                      
                      {/* Trending Badge - Top Left */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-lg">
                          <MdTrendingUp size={12} />
                          Trending
                        </span>
                      </div>
                      
                      {/* Offer Badge - Bottom Left (only if offer exists) */}
                      {item.offer && (
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg">{item.offer}</span>
                        </div>
                      )}
                      
                      {/* Discount Badge - Top Right (only if discount exists) */}
                      {item.discountPercentage > 0 && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 transform rotate-12 origin-bottom-left shadow-lg">
                            {item.discountPercentage}% OFF
                          </div>
                        </div>
                      )}
                      {/* Countdown timer for 30%+ discount - bottom right */}
                      {item.discountPercentage > 30 && countdown && (
                        <div className="absolute bottom-2 right-2">
                          <span className="bg-black/80 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                            Ends in {countdown}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="pr-2">
                          <h5 className="text-base font-semibold text-gray-900 truncate">{item.name}</h5>
                          <p className="text-[11px] text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          {item.discountPercentage > 0 && (
                            <div className="text-[11px] text-gray-500 line-through">₹{item.price}</div>
                          )}
                          <div className="text-lg font-bold text-orange-600">
                            ₹{item.discountPercentage > 0 ? Math.round(item.price - (item.price * item.discountPercentage / 100)) : item.price}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-700 mb-1.5">
                        {typeof item.prepTime === 'number' && (
                          <span className="inline-flex items-center gap-1">
                            <MdTimer size={14} />
                            {item.prepTime} min
                          </span>
                        )}
                        {item.spiceLevel && (
                          <span className="inline-flex items-center gap-1">
                            <MdLocalFireDepartment 
                              size={14} 
                              className={`${
                                item.spiceLevel === 'mild' ? 'text-green-500' :
                                item.spiceLevel === 'medium' ? 'text-orange-500' :
                                item.spiceLevel === 'spicy' ? 'text-red-500' :
                                item.spiceLevel === 'extra_spicy' ? 'text-red-600' : 'text-red-500'
                              }`} 
                            />
                            <span className="capitalize">{item.spiceLevel.replace('_',' ')}</span>
                          </span>
                        )}
                        {item.foodType && (
                          <span className="inline-flex items-center gap-1">
                            <span className="capitalize">🍽 {item.foodType.replace('_',' ')}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MdStar size={14} className="text-yellow-500" />
                          {Number(item.rating || 0).toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setQuickViewItem(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Quick View
                        </button>

                        <div className="flex items-center">
                          <button 
                            onClick={() => handleAddToCartClick(item.id)}
                            className="px-3 py-2 rounded-md transition-all duration-200 text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transform hover:scale-105 group-hover:ring-2 group-hover:ring-orange-200"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* More Trending Items Button - Only show if there are trending items */}
            {trending.length > 0 && (
              <div className="text-center mt-12">
                <Link 
                  to="/offers" 
                  className="inline-flex items-center space-x-2 px-3 py-3 text-orange-500 hover:text-orange-400  transition-colors font-medium"
                >
                  <span>View All Offers</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-8 md:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">New Arrivals</h2>
              <p className="text-base md:text-lg text-gray-600">Fresh dishes just added to our menu</p>
            </div>
            {specials.length === 0 ? (
              <div className="text-center py-20">
                <h4 className="text-xl font-semibold text-gray-400 mb-2">No new arrivals found</h4>
                <p className="text-gray-500">Check back later for new dishes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {specials.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden border border-gray-100 group">
                    <div className="relative">
                      <img src={item.image} className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300" alt={item.name} />
                      
                      {/* New Arrival Badge - Top Left */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-purple-500 text-white text-[13px] font-semibold px-2 py-0.5 rounded-full shadow-lg">
                          New
                        </span>
                      </div>
                      
                      {/* Offer Badge - Bottom Left (only if offer exists) */}
                      {item.offer && (
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg">{item.offer}</span>
                        </div>
                      )}

                      {/* Discount Badge - Top Right (only if discount exists) */}
                      {item.discountPercentage > 0 && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 transform rotate-12 origin-bottom-left shadow-lg">
                            {item.discountPercentage}% OFF
                          </div>
                        </div>
                      )}
                      {/* Countdown timer for 30%+ discount - bottom right */}
                      {item.discountPercentage > 30 && countdown && (
                        <div className="absolute bottom-2 right-2">
                          <span className="bg-black/80 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                            Ends in {countdown}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="pr-2">
                          <h5 className="text-base font-semibold text-gray-900 truncate">{item.name}</h5>
                          <p className="text-[11px] text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          {item.discountPercentage > 0 && (
                            <div className="text-[11px] text-gray-500 line-through">₹{item.price}</div>
                          )}
                          <div className="text-lg font-bold text-orange-600">
                            ₹{item.discountPercentage > 0 ? Math.round(item.price - (item.price * item.discountPercentage / 100)) : item.price}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-700 mb-1.5">
                        {typeof item.prepTime === 'number' && (
                          <span className="inline-flex items-center gap-1">
                            <MdTimer size={14} />
                            {item.prepTime} min
                          </span>
                        )}
                        {item.spiceLevel && (
                          <span className="inline-flex items-center gap-1">
                            <MdLocalFireDepartment
                              size={14}
                              className={`${
                                item.spiceLevel === 'mild' ? 'text-green-500' :
                                item.spiceLevel === 'medium' ? 'text-orange-500' :
                                item.spiceLevel === 'spicy' ? 'text-red-500' :
                                item.spiceLevel === 'extra_spicy' ? 'text-red-600' : 'text-red-500'
                              }`}
                            />
                            <span className="capitalize">{item.spiceLevel.replace('_',' ')}</span>
                          </span>
                        )}
                        {item.foodType && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-xs">🍽 {item.foodType.replace('_',' ')}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MdStar size={14} className="text-yellow-500" />
                          {Number(item.rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setQuickViewItem(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Quick View
                        </button>

                        <div className="flex items-center">
                          <button 
                            onClick={() => handleAddToCartClick(item.id)}
                            className="px-3 py-2 rounded-md transition-all duration-200 text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transform hover:scale-105 group-hover:ring-2 group-hover:ring-orange-200"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* More New Arrivals Button - Only show if there are new arrival items */}
            {specials.length > 0 && (
              <div className="text-center mt-12">
                <Link 
                  to="/menu" 
                  className="inline-flex items-center space-x-2 px-3 py-3  text-orange-500 rounded-lg hover:text-orange-600 transition-colors font-medium"
                >
                  <span>View All New Arrivals</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Quick View Modal */}
        {quickViewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setQuickViewItem(null)} />
            <div className="relative bg-white w-full max-w-sm sm:max-w-md rounded-lg shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 bg-gray-100 hover:bg-gray-200 rounded-full p-2 text-sm z-10"
                onClick={() => setQuickViewItem(null)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex flex-col">
                <img src={quickViewItem.image} alt={quickViewItem.name} className="w-full h-48 sm:h-56 object-cover" />
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{quickViewItem.name}</h3>
                  <div className="text-orange-600 text-base sm:text-lg font-bold">
                    ₹{quickViewItem.discountPercentage > 0 ? Math.round(quickViewItem.price - (quickViewItem.price * quickViewItem.discountPercentage / 100)) : quickViewItem.price}
                  </div>
                  {quickViewItem.discountPercentage > 0 && (
                    <div className="text-xs text-gray-500">Original: ₹{quickViewItem.price} • {quickViewItem.discountPercentage}% OFF</div>
                  )}
                  {quickViewItem.description && <p className="text-xs sm:text-sm text-gray-700">{quickViewItem.description}</p>}
                  <div className="flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-600">
                    {typeof quickViewItem.prepTime === 'number' && <span className="bg-gray-100 px-2 py-1 rounded">⏱ {quickViewItem.prepTime} min</span>}
                    {quickViewItem.spiceLevel && <span className="bg-gray-100 px-2 py-1 rounded capitalize">🌶 {quickViewItem.spiceLevel.replace('_',' ')}</span>}
                    {quickViewItem.foodType && <span className="bg-gray-100 px-2 py-1 rounded capitalize">🍽 {quickViewItem.foodType.replace('_',' ')}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {Number(quickViewItem.rating || 0).toFixed(1)}
                    </span>
                    {quickViewItem.offer && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">{quickViewItem.offer}</span>}
                  </div>
                  
                  {/* Add to Cart Button */}
                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        if (!isUserLoggedIn) {
                          toast.error('Please sign in as a customer to add items to your cart.');
                          setQuickViewItem(null);
                          navigate('/login');
                          return;
                        }
                        if (isAdminLoggedIn || isRestaurantLoggedIn || isDeliveryLoggedIn) {
                          toast.error('Access restricted: sign in with a customer account to add items to cart.');
                          setQuickViewItem(null);
                          return;
                        }
                        addToCart(quickViewItem.id);
                        setQuickViewItem(null);
                      }}
                      className="w-full px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transform hover:scale-105"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Cart Display removed per requirement (using toasts instead) */}
      </div>
    );
  };

export default Home;

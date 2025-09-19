import React, { useEffect, useMemo, useState } from "react";
import { menuAPI, cartAPI } from "../../services/api";
import { useUserAuth } from "../../context/UserAuthContext";
import toast from "react-hot-toast";
import {
  MdStar,
  MdTimer,
  MdLocalFireDepartment,
  MdZoomIn,
  MdTrendingUp
} from "react-icons/md";

const Offers = () => {
  const { isUserLoggedIn } = useUserAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem("mb_favorites");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [cartItems, setCartItems] = useState({});
  const [quickViewItem, setQuickViewItem] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await menuAPI.getPublicItems();
        if (res.success) {
          const mapped = (res.data.items || []).map((i) => ({
            id: i._id,
            name: i.name,
            category: i.category,
            price: i.price,
            discountPercentage: i.discountPercentage || 0,
            offer: i.offer || "",
            isNewArrival: !!i.isNewArrival,
            image: i.image,
            restaurantName:
              i.restaurant && i.restaurant.name ? i.restaurant.name : "",
            restaurantId: i.restaurant && (i.restaurant._id || i.restaurant),
            isAvailable: i.isAvailable !== false,
            prepTime:
              typeof i.preparationTime === "number"
                ? i.preparationTime
                : undefined,
            spiceLevel: i.spiceLevel || "",
            foodType: i.foodType || "veg",
            rating: typeof i.rating === "number" ? i.rating : 0,
            calories: typeof i.calories === "number" ? i.calories : undefined,
            description: i.description || "",
            isTrending: !!i.isTrending,
            ingredients: Array.isArray(i.ingredients) ? i.ingredients : [],
            dietaryTags: Array.isArray(i.dietaryTags) ? i.dietaryTags : [],
            allergens: Array.isArray(i.allergens) ? i.allergens : [],
            offerEndAt: i.offerEndAt || i.offerEndsAt || i.offerExpiry || null,
          }));
          setItems(mapped);
        }
      } catch (e) {
        console.error("Failed to load offers", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mb_favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  // Cart management functions (backend)
  const addToCart = async (itemId) => {
    if (!isUserLoggedIn) {
      toast.error("Please login to add items to cart", {
        duration: 3000,
        style: {
          background: '#dc2626',
          color: '#fff',
        },
      });
      return;
    }

    try {
      const it = items.find(x => x.id === itemId);
      const response = await cartAPI.addToCart({ menuItemId: itemId, quantity: 1, restaurantId: it && it.restaurantId });
      if (response.success) {
        if (response.cartSwitched) {
          setCartItems({ [itemId]: 1 });
        } else {
          setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
        }
        window.dispatchEvent(new Event("cartUpdated"));
        toast.success("Added to cart");
      }
    } catch (e) {
      console.error("Failed to add to cart", e);
    }
  };

  // Include items with any discount from 1% to 100%
  const offerItems = useMemo(
    () =>
      items.filter((i) => {
        const d = Number(i.discountPercentage);
        return Number.isFinite(d) && d >= 1 && d <= 100;
      }),
    [items]
  );


  const isFavorite = (id) => favorites.includes(id);
  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };


  const formatRemaining = (end) => {
    if (!end) return null;
    const endTs = new Date(end).getTime();
    if (Number.isNaN(endTs)) return null;
    const diff = endTs - Date.now();
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Frontend-only countdown logic for 30% discount items
  const getCountdownFor30Percent = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    if (hour >= 12 && hour < 15) {
      const remainingSeconds = 15 * 3600 - (hour * 3600 + minute * 60 + second);
      const h = Math.floor(remainingSeconds / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const s = remainingSeconds % 60;
      return `${h}h ${m}m ${s}s`;
    }

    if (hour >= 19 && hour < 22) {
      const remainingSeconds = 22 * 3600 - (hour * 3600 + minute * 60 + second);
      const h = Math.floor(remainingSeconds / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const s = remainingSeconds % 60;
      return `${h}h ${m}m ${s}s`;
    }

    return null;
  };

  const countdown = getCountdownFor30Percent();

  return (
    <div className="backcolor min-h-screen pt-16">
      {/* Hero Section */}
      <section className="py-8 md:py-12 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 animate-pulse">
              🔥 Hot Offers
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Don't miss out on these amazing deals! Limited time offers with incredible discounts.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <span className="text-yellow-300">⚡</span>
                <span>Flash Deals</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <span className="text-green-300">💰</span>
                <span>Save More</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <span className="text-blue-300">🚀</span>
                <span>Quick Delivery</span>
              </div>
            </div>
            {countdown && (
              <div className="mt-6 bg-black/30 backdrop-blur-sm rounded-lg p-4 inline-block">
                <p className="text-sm mb-2">⏰ Special 30% OFF ends in:</p>
                <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                  {countdown}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12 md:py-20 text-gray-500 text-sm md:text-base">Loading...</div>
          ) : offerItems.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <h4 className="text-lg md:text-xl font-semibold text-gray-400 mb-2">
                No offers found
              </h4>
              <p className="text-sm md:text-base text-gray-500">
                Check back later for new offers
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {offerItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
                >
                  <div className="relative">
                    <img
                      src={item.image}
                      className="w-full h-48 md:h-56 object-cover"
                      alt={item.name}
                    />
                    {item.isTrending && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 animate-bounce">
                          <MdTrendingUp size={12} />
                          Trending
                        </span>
                      </div>
                    )}

                    {/* Discount / Countdown */}
                    {((item.discountPercentage || 0) > 0 ||
                      item.offer ||
                      item.isNewArrival) && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          {item.discountPercentage > 0
                            ? `${item.discountPercentage}% OFF`
                            : item.offer || "New Arrival"}
                        </span>
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

                  <div className="p-3 md:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-sm md:text-base font-semibold text-gray-900 truncate pr-2">
                        {item.name}
                      </h5>
                      <div className="text-right">
                        {item.discountPercentage > 0 && (
                          <div className="text-xs text-gray-500 line-through">
                            ₹{item.price}
                          </div>
                        )}
                        <div className="text-sm md:text-lg font-bold text-orange-600">
                          ₹
                          {item.discountPercentage > 0
                            ? Math.round(
                                item.price -
                                  (item.price * item.discountPercentage) / 100
                              )
                            : item.price}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 text-xs text-gray-700 mb-2">
                      {typeof item.prepTime === "number" && (
                        <span className="inline-flex items-center gap-1">
                          <MdTimer size={12} className="md:hidden" />
                          <MdTimer size={14} className="hidden md:block" />
                          {item.prepTime} min
                        </span>
                      )}
                      {item.spiceLevel && (
                        <span className="inline-flex items-center gap-1">
                          <MdLocalFireDepartment
                            size={12}
                            className="text-red-500 md:hidden"
                          />
                          <MdLocalFireDepartment
                            size={14}
                            className="text-red-500 hidden md:block"
                          />
                          <span className="capitalize">
                            {item.spiceLevel.replace("_", " ")}
                          </span>
                        </span>
                      )}
                      {item.foodType && (
                        <span className="inline-flex items-center gap-1">
                          <span className="capitalize text-xs">
                            🍽 {item.foodType.replace("_", " ")}
                          </span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MdStar size={12} className="text-yellow-500 md:hidden" />
                        <MdStar size={14} className="text-yellow-500 hidden md:block" />
                        {Number(item.rating || 0).toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setQuickViewItem(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <MdZoomIn size={12} className="md:hidden" />
                        <MdZoomIn size={14} className="hidden md:block" />
                        <span className="hidden sm:inline">Quick View</span>
                        <span className="sm:hidden">View</span>
                      </button>

                      <button
                        onClick={() => addToCart(item.id)}
                        className="px-2 py-1.5 md:px-3 md:py-2 rounded-md transition-all duration-200 text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transform hover:scale-110 active:scale-95"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setQuickViewItem(null)}
          />
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
              <img
                src={quickViewItem.image}
                alt={quickViewItem.name}
                className="w-full h-48 sm:h-56 object-cover"
              />
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {quickViewItem.name}
                </h3>
                <div className="text-orange-600 text-base sm:text-lg font-bold">
                  ₹
                  {quickViewItem.discountPercentage > 0
                    ? Math.round(
                        quickViewItem.price -
                          (quickViewItem.price *
                            quickViewItem.discountPercentage) /
                            100
                      )
                    : quickViewItem.price}
                </div>
                {quickViewItem.discountPercentage > 0 && (
                  <div className="text-xs text-gray-500">
                    Original: ₹{quickViewItem.price} •{" "}
                    {quickViewItem.discountPercentage}% OFF
                  </div>
                )}
                {quickViewItem.description && (
                  <p className="text-xs sm:text-sm text-gray-700">
                    {quickViewItem.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-600">
                  {typeof quickViewItem.prepTime === "number" && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      ⏱ {quickViewItem.prepTime} min
                    </span>
                  )}
                  {quickViewItem.spiceLevel && (
                    <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                      🌶 {quickViewItem.spiceLevel.replace("_", " ")}
                    </span>
                  )}
                  {quickViewItem.foodType && (
                    <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                      🍽 {quickViewItem.foodType.replace("_", " ")}
                    </span>
                  )}
                  {typeof quickViewItem.calories === "number" && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      🔥 {quickViewItem.calories} kcal
                    </span>
                  )}
                </div>
                {Array.isArray(quickViewItem.ingredients) &&
                  quickViewItem.ingredients.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-gray-800 mb-1">
                        Ingredients
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {quickViewItem.ingredients.join(", ")}
                      </div>
                    </div>
                  )}
                {Array.isArray(quickViewItem.allergens) &&
                  quickViewItem.allergens.length > 0 && (
                    <div className="text-xs text-red-600">
                      Allergens: {quickViewItem.allergens.join(", ")}
                    </div>
                  )}
                {Array.isArray(quickViewItem.dietaryTags) &&
                  quickViewItem.dietaryTags.length > 0 && (
                    <div className="text-xs text-gray-600">
                      Tags: {quickViewItem.dietaryTags.join(", ")}
                    </div>
                  )}
                
                {/* Add to Cart Button */}
                <div className="pt-2">
                  <button 
                    onClick={() => {
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

    </div>
  );
};

export default Offers;

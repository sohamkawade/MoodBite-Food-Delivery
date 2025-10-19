import React, { useEffect, useMemo, useState } from "react";
import { MdSearch, MdTimer, MdLocalFireDepartment, MdStar, MdTrendingUp } from "react-icons/md";
import { menuAPI, cartAPI } from "../../services/api";
import { useUserAuth } from "../../context/UserAuthContext";
import toast from 'react-hot-toast';

const Menu = () => {
  const { isUserLoggedIn } = useUserAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [viewMode, setViewMode] = useState("grid");

  const [menuItems, setMenuItems] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [quickViewItem, setQuickViewItem] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await menuAPI.getPublicItems();
        if (res.success) {
          const mapped = (res.data.items || []).map(i => ({
            id: i._id,
            name: i.name,
            category: i.category,
            price: i.price,
            restaurantName: (i.restaurant && i.restaurant.name) ? i.restaurant.name : "",
            restaurantId: i.restaurant && (i.restaurant._id || i.restaurant),
            image: i.image,
            prepTime: typeof i.preparationTime === 'number' ? i.preparationTime : undefined,
            spiceLevel: i.spiceLevel || '',
            foodType: i.foodType || 'veg',
            calories: typeof i.calories === 'number' ? i.calories : undefined,
            description: i.description || '',
            rating: typeof i.rating === 'number' ? i.rating : 0,
            offer: i.offer || "",
            isTrending: !!i.isTrending,
            isSpecial: !!i.isSpecial,
            stockQuantity: typeof i.stockQuantity === 'number' ? i.stockQuantity : 0,
            isAvailable: i.isAvailable !== false && (typeof i.stockQuantity !== 'number' || i.stockQuantity > 0)
          }));
          setMenuItems(mapped);
        }
      } catch (e) {
        console.error('Failed to load menu', e);
      }
    };
    
    const loadCart = async () => {
      try {
        const cartRes = await cartAPI.getUserCart();
        if (cartRes.success && cartRes.data) {
          const cartItemsMap = {};
          cartRes.data.items.forEach(item => {
            const mid = (item.menuItem && item.menuItem._id) ? item.menuItem._id : item.menuItem;
            if (mid) cartItemsMap[mid] = item.quantity;
          });
          setCartItems(cartItemsMap);
        }
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    };
    
    load();
    loadCart();
  }, []);

  const categories = useMemo(() => ["all", ...Array.from(new Set(menuItems.map(m => m.category))).filter(Boolean)], [menuItems]);

  // Cart management functions
  const addToCart = async (item) => {
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
      const response = await cartAPI.addToCart({ menuItemId: item.id, quantity: 1, restaurantId: item.restaurantId });
      
      if (response.success) {
        // Update local cart state
        if (response.cartSwitched) {
          setCartItems({ [item.id]: 1 });
        } else {
          setCartItems(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
        }
        // Notify navbar to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Added to cart');
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const currentQuantity = cartItems[itemId] || 0;
      const newQuantity = currentQuantity - 1;
      
      if (newQuantity <= 0) {
        // Remove item completely
        await cartAPI.removeFromCart(itemId);
        setCartItems(prev => {
          const newCart = { ...prev };
          delete newCart[itemId];
          return newCart;
        });
        // Notify navbar to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
        toast.info('Removed from cart');
      } else {
        // Update quantity
        await cartAPI.updateItemQuantity(itemId, newQuantity);
        setCartItems(prev => ({
          ...prev,
          [itemId]: newQuantity
        }));
        // Notify navbar to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
        toast('Updated quantity', { style: { background: '#ca8a04', color: '#fff' } });
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
    }
  };

  const getCartQuantity = (itemId) => cartItems[itemId] || 0;

  const getTotalCartItems = () => Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const getTotalCartPrice = () => {
    return menuItems.reduce((total, item) => {
      const quantity = cartItems[item.id] || 0;
      return total + (item.price * quantity);
    }, 0);
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedMenu = [...filteredMenu].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      default: return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="backcolor min-h-screen pt-16">
      {/* Search & Categories */}
      <div className="py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-full md:max-w-md">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm transition-colors ${
                      selectedCategory === category
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {category === "all" ? "All" : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredMenu.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <h4 className="text-lg md:text-xl font-semibold text-gray-400 mb-2">No dishes found</h4>
              <p className="text-sm md:text-base text-gray-500">Try adjusting your search or category</p>
            </div>
          ) : (
            <div className={`grid gap-3 md:gap-4 ${
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {sortedMenu.map(item => (
                <div key={item.id} className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 min-h-[20rem] sm:min-h-[22rem]">
                  {/* Background image */}
                  <img src={item.image} className="absolute inset-0 w-full h-full object-cover" alt={item.name} />
                  {/* Bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/70 to-transparent" />
                  {/* Badges */}
                  {item.isTrending && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-gray-800/40 text-white backdrop-blur-sm border border-white/20 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><MdTrendingUp size={12} /> Trending</span>
                    </div>
                  )}
                  {item.offer && (
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{item.offer}</span>
                    </div>
                  )}
                  {/* Content */}
                  <div className="relative z-10 p-3 md:p-4 flex flex-col justify-end h-full text-white">
                    <div className="flex justify-between items-start mb-1">
                      <div className="pr-2 flex-1">
                        <h3 className="text-sm md:text-base font-semibold truncate">{item.name}</h3>
                        <p className="text-xs md:text-sm text-white/90">{item.category}</p>
                      </div>
                      <span className="text-sm md:text-base font-bold">₹{item.price}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 text-xs text-white/90 mb-2">
                      {typeof item.prepTime === 'number' && (<span className="inline-flex items-center gap-1"><MdTimer size={14} />{item.prepTime} min</span>)}
                      {item.spiceLevel && (<span className="inline-flex items-center gap-1"><MdLocalFireDepartment size={14} className="text-red-300" /><span className="capitalize">{item.spiceLevel.replace('_',' ')}</span></span>)}
                      <span className="inline-flex items-center gap-1"><MdStar size={14} className="text-yellow-300" />{Number(item.rating || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setQuickViewItem(item)} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-white/70 text-white rounded hover:bg-white/10">
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <span className="hidden sm:inline">Quick View</span>
                        <span className="sm:hidden">View</span>
                      </button>
                      <div className="flex items-center">
                        {!item.isAvailable ? (
                          <span className="px-2 py-1.5 md:px-2.5 md:py-1.5 rounded-md text-xs bg-gray-300 text-gray-600 cursor-not-allowed">Out of Stock</span>
                        ) : (
                          <button onClick={() => addToCart(item)} className="px-2 py-1.5 md:px-2.5 md:py-1.5 rounded-md transition-all duration-200 text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transform hover:scale-105">Add to Cart</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                <div className="text-orange-600 text-base sm:text-lg font-bold">₹{quickViewItem.price}</div>
                {quickViewItem.description && <p className="text-xs sm:text-sm text-gray-700">{quickViewItem.description}</p>}
                <div className="flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-600">
                  {typeof quickViewItem.prepTime === 'number' && <span className="bg-gray-100 px-2 py-1 rounded">⏱ {quickViewItem.prepTime} min</span>}
                  {quickViewItem.spiceLevel && <span className="bg-gray-100 px-2 py-1 rounded capitalize">🌶 {quickViewItem.spiceLevel.replace('_',' ')}</span>}
                  {quickViewItem.foodType && <span className="bg-gray-100 px-2 py-1 rounded capitalize">🍽 {quickViewItem.foodType.replace('_',' ')}</span>}
                  {typeof quickViewItem.calories === 'number' && <span className="bg-gray-100 px-2 py-1 rounded">🔥 {quickViewItem.calories} kcal</span>}
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
                      addToCart(quickViewItem);
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

export default Menu;

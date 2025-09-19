import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {  
  HiTrash, 
  HiShoppingCart, 
  HiPlus, 
  HiMinus,
  HiCreditCard,
  HiLocationMarker
} from "react-icons/hi";
import { cartAPI } from "../../services/api";
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartData, setCartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCartFromBackend();
  }, []);

  // Load cart from backend
  const loadCartFromBackend = async (options = { showLoader: true }) => {
    try {
      if (options.showLoader) setIsLoading(true);
      const response = await cartAPI.getUserCart();
      
      if (response.success && response.data) {
        const items = Array.isArray(response.data.items) ? response.data.items : [];
        // Normalize menuItem population shape
        const normalized = items.map(it => ({
          ...it,
          menuItem: it.menuItem && it.menuItem._id ? it.menuItem : (typeof it.menuItem === 'string' ? { _id: it.menuItem } : it.menuItem)
        }));
        setCartItems(normalized);
        // Store cart data for totals
        setCartData(response.data);
        // Notify navbar to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        setCartItems([]);
        setCartData(null);
        // Notify navbar to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      setCartItems([]);
      setCartData(null);
    } finally {
      if (options.showLoader) setIsLoading(false);
    }
  };

  // Update quantity of an item
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    try {
      const response = await cartAPI.updateItemQuantity(itemId, newQuantity);
      if (response.success) {
        // Reload cart from backend to get updated data
        await loadCartFromBackend({ showLoader: false });
        // Notify navbar to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      const response = await cartAPI.removeFromCart(itemId);
      if (response.success) {
        // Reload cart from backend to get updated data
        await loadCartFromBackend({ showLoader: false });
        // Notify navbar to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  // Get cart totals from backend data and compute delivery by amount rules
  const subtotal = cartData?.subtotal || 0;
  const tax = cartData?.tax || 0;
  const amountForDelivery = subtotal + tax;
  const deliveryCharge = amountForDelivery < 200 ? 40 : amountForDelivery < 500 ? 20 : 0;
  const total = subtotal + tax + deliveryCharge;

  // Handle checkout
  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast('Your cart is empty', { style: { background: '#ca8a04', color: '#fff' } });
      return;
    }
    navigate('/checkout');
  };

  // Continue shopping
  const continueShopping = () => {
    navigate('/menu');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen backcolor pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Your Cart
            </h1>
          </div>
          <div className="text-center py-12 md:py-20">
            <div className="animate-spin w-12 h-12 md:w-16 md:h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 text-base md:text-lg">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen backcolor pt-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="flex items-center justify-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Your Cart
            </h1>
          </div>

          {/* Empty Cart State */}
          <div className="text-center py-12 md:py-20">
            <div className="mb-6 md:mb-8 relative">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center shadow-lg">
                <HiShoppingCart size={60} className="md:hidden text-orange-400" />
                <HiShoppingCart size={80} className="hidden md:block text-orange-400" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
            <div className="flex justify-center">
              <button
                onClick={continueShopping}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
              >
                <HiShoppingCart className="mr-2" size={20} />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen backcolor pt-2">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Your Cart
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg">
              <span className="ml-1 md:ml-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                {cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
          </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Order Summary</h2>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const itemId = item._id || item.id;
                  const menuItem = item.menuItem;
                  
                  if (!menuItem) {
                    return null; // Skip items without menu data
                  }

                  const itemPrice = menuItem.discountedPrice || menuItem.price || 0;
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div key={itemId} className="p-4 md:p-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-start space-x-3 md:space-x-6">
                        {/* Item Image */}
                        <div className="flex-shrink-0 relative">
                          {menuItem.image ? (
                            <img
                              src={menuItem.image}
                              alt={menuItem.name || 'Food item'}
                              className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-cover rounded-lg md:rounded-xl shadow-md"
                            />
                          ) : (
                            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gray-200 rounded-lg md:rounded-xl flex items-center justify-center">
                              <HiShoppingCart size={20} className="md:hidden text-gray-400" />
                              <HiShoppingCart size={24} className="hidden md:block lg:hidden text-gray-400" />
                              <HiShoppingCart size={32} className="hidden lg:block text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1 md:mb-2">
                                <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">
                                  {menuItem.name}
                              </h3>
                              </div>
                              <p className="text-gray-600 mb-2 md:mb-3 flex items-center text-sm md:text-base">
                                <HiLocationMarker size={14} className="md:hidden mr-1 text-orange-500" />
                                <HiLocationMarker size={16} className="hidden md:block mr-1 text-orange-500" />
                                {menuItem.category || ''}
                              </p>
                              
                              {/* Price Display */}
                              <div className="flex items-center space-x-3 mb-2 md:mb-4">
                                <span className="text-lg md:text-xl lg:text-2xl font-bold text-orange-600">
                                  ₹{itemPrice.toFixed(2)}
                                </span>
                              </div>

                              {/* Item Total */}
                              <div className="text-sm md:text-base lg:text-lg text-gray-700 font-semibold">
                                Total: <span className="text-orange-600">₹{itemTotal.toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex flex-row md:flex-col items-center md:items-end space-x-4 md:space-x-0 md:space-y-3 mt-3 md:mt-0">
                              {/* Quantity Controls */}
                              <div className="flex items-center bg-gray-100 rounded-lg md:rounded-xl p-0.5 md:p-1">
                                <button
                                  onClick={() => updateQuantity(itemId, item.quantity - 1)}
                                  className="p-1.5 md:p-2 hover:bg-white rounded-md md:rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={item.quantity <= 1}
                                >
                                  <HiMinus size={14} className="md:hidden text-gray-600" />
                                  <HiMinus size={16} className="hidden md:block lg:hidden text-gray-600" />
                                  <HiMinus size={18} className="hidden lg:block text-gray-600" />
                                </button>
                                <span className="px-2 md:px-3 lg:px-4 py-1 md:py-2 text-sm md:text-base lg:text-lg font-bold text-gray-900 min-w-[2rem] md:min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(itemId, item.quantity + 1)}
                                  className="p-1.5 md:p-2 hover:bg-white rounded-md md:rounded-lg transition-all duration-200 hover:scale-110"
                                >
                                  <HiPlus size={14} className="md:hidden text-gray-600" />
                                  <HiPlus size={16} className="hidden md:block lg:hidden text-gray-600" />
                                  <HiPlus size={18} className="hidden lg:block text-gray-600" />
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => removeFromCart(itemId)}
                                className="p-2 md:p-3 text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-all duration-200 hover:scale-110 group"
                                title="Remove item"
                              >
                                <HiTrash size={16} className="md:hidden group-hover:text-red-600" />
                                <HiTrash size={18} className="hidden md:block lg:hidden group-hover:text-red-600" />
                                <HiTrash size={20} className="hidden lg:block group-hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-gray-100 p-4 md:p-6 sticky top-20 md:top-24">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center">
                <HiCreditCard className="mr-2 text-orange-500 md:hidden" size={20} />
                <HiCreditCard className="mr-2 text-orange-500 hidden md:block lg:hidden" size={22} />
                <HiCreditCard className="mr-2 text-orange-500 hidden lg:block" size={24} />
                Price Details
              </h2>
              
              {/* Price Breakdown */}
              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div className="flex justify-between text-gray-600 py-1 md:py-2 text-sm md:text-base">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)} items)</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 py-1 md:py-2 text-sm md:text-base">
                  <span>Tax</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 py-1 md:py-2 text-sm md:text-base">
                  <span>Delivery Charge</span>
                  <span className="font-medium">₹{deliveryCharge.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 md:pt-4">
                  <div className="flex justify-between text-lg md:text-xl font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-orange-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 md:space-y-4">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl font-bold text-sm md:text-base lg:text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                >
                  <HiCreditCard className="inline mr-2 " size={18} />
                  Proceed to Checkout
                </button>
                <button
                  onClick={continueShopping}
                  className="w-full bg-gray-100 text-gray-700 py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl font-semibold text-sm md:text-base hover:bg-gray-200 transition-all duration-200 flex items-center justify-center"
                >
                  <HiShoppingCart className="mr-2" size={18} />
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

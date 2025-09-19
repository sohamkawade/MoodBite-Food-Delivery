const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');


const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let cart = await Cart.findActiveByUser(userId);
    
    if (!cart) {
      return res.json({
        success: true,
        data: {
          user: userId,
          restaurant: null,
          items: [],
          subtotal: 0,
          tax: 0,
          deliveryFee: 0,
          discount: 0,
          total: 0,
          isActive: true
        }
      });
    }
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error getting user cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart',
      error: error.message
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { menuItemId, quantity = 1, restaurantId } = req.body;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid menuItemId' });
    }
    
    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is required'
      });
    }
    

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    

    const targetRestaurantId = restaurantId 
      || (menuItem.restaurant && menuItem.restaurant._id ? menuItem.restaurant._id : menuItem.restaurant);

    if (!targetRestaurantId) {
      return res.status(400).json({ success: false, message: 'Menu item has no restaurant assigned' });
    }
    

    const restaurant = await Restaurant.findById(targetRestaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    

    let activeCart = await Cart.findActiveByUser(userId);
    let cart = await Cart.findByUserAndRestaurant(userId, targetRestaurantId);
    let cartSwitched = false;

    if (!cart) {
      if (activeCart && activeCart.restaurant && activeCart.restaurant.toString() !== String(targetRestaurantId) && Array.isArray(activeCart.items) && activeCart.items.length > 0) {

        activeCart.restaurant = targetRestaurantId;
        activeCart.items = [];
        await activeCart.save();
        cart = activeCart;
        cartSwitched = true;
      } else {
        cart = new Cart({ user: userId, restaurant: targetRestaurantId, items: [] });
      }
    }
    

    const itemData = {
      menuItem: menuItemId,
      quantity: quantity,
      specialInstructions: req.body.specialInstructions || '',
      customizationOptions: req.body.customizationOptions || []
    };
    
    await cart.addItem(itemData);
    
    await cart.populate('items.menuItem');
    
    res.json({ success: true, message: 'Item added to cart successfully', data: cart, cartSwitched });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};


const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId, quantity } = req.body;
    
    if (!itemId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Item ID and quantity are required'
      });
    }
    
    const cart = await Cart.findActiveByUser(userId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.updateItemQuantity(itemId, quantity);
    
    // Populate menu item details
    await cart.populate('items.menuItem');
    
    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
      error: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }
    
    const cart = await Cart.findActiveByUser(userId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.removeItem(itemId);
    
    // Populate menu item details
    await cart.populate('items.menuItem');
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cart = await Cart.findActiveByUser(userId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.clearCart();
    
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};


const getCartSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cart = await Cart.findActiveByUser(userId);
    
    if (!cart || cart.isEmpty()) {
      return res.json({
        success: true,
        data: {
          itemCount: 0,
          total: 0,
          isEmpty: true
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        itemCount: Array.isArray(cart.items) ? cart.items.length : 0,
        total: cart.total,
        isEmpty: false
      }
    });
  } catch (error) {
    console.error('Error getting cart summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart summary',
      error: error.message
    });
  }
};

module.exports = {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
};

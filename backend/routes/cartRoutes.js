const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middlewares/authMiddleware');

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get('/', cartController.getUserCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update item quantity in cart
router.put('/update', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:itemId', cartController.removeFromCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

// Get cart summary (for header display)
router.get('/summary', cartController.getCartSummary);

module.exports = router;

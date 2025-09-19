const express = require('express');
const router = express.Router();
const restaurantAuthController = require('../controllers/restaurantAuthController');
const { authenticateRestaurant } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', restaurantAuthController.login);
router.post('/forgot-password', restaurantAuthController.forgotPassword);
router.post('/verify-otp', restaurantAuthController.verifyOTP);
router.post('/reset-password', restaurantAuthController.resetPassword);

// Protected routes (require restaurant authentication)
router.get('/profile', authenticateRestaurant, restaurantAuthController.getProfile);
router.put('/profile', authenticateRestaurant, restaurantAuthController.updateProfile);
router.post('/logout', authenticateRestaurant, restaurantAuthController.logout);

// Restaurant-managed menu items
router.get('/menu-items', authenticateRestaurant, restaurantAuthController.listMenuItems);
router.post('/menu-items', authenticateRestaurant, restaurantAuthController.createMenuItem);
router.put('/menu-items/:id', authenticateRestaurant, restaurantAuthController.updateMenuItem);
router.delete('/menu-items/:id', authenticateRestaurant, restaurantAuthController.deleteMenuItem);

module.exports = router;

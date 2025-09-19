const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const {
    signup,
    login,
    getProfile,
    updateProfile,
    changePassword,
    logout,
    getDashboardStats,
    getRestaurantManagement,
    getDeliveryBoyManagement,
    getUserManagement,
    getOrderManagement,
    updateUser,
    suspendUser,
    forgotPassword,
    verifyOTP,
    resetPassword
} = require('../controllers/adminController');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Protected routes (authentication required)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);

// Dashboard and Management routes
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/restaurants', authenticate, getRestaurantManagement);
router.get('/delivery-boys', authenticate, getDeliveryBoyManagement);
router.get('/users', authenticate, getUserManagement);
router.put('/users/:id', authenticate, updateUser);
router.post('/users/:id/suspend', authenticate, suspendUser);
router.get('/orders', authenticate, getOrderManagement);

module.exports = router;

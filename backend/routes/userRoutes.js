const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middlewares/authMiddleware');
const {
    signup,
    login,
    getProfile,
    updateProfile,
    changePassword,
    addTestOrder,
    logout,
    forgotPassword,
    verifyOTP,
    resetPassword
} = require('../controllers/userController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/test-order', authenticate, addTestOrder);
router.post('/logout', authenticate, logout);

// Admin user management
router.get('/admin', authenticateAdmin, require('../controllers/userController').listUsers);
router.put('/admin/:id', authenticateAdmin, require('../controllers/userController').adminUpdateUser);
router.post('/admin/:id/suspend', authenticateAdmin, require('../controllers/userController').adminSuspendUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deliveryAuthController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/verify-otp', ctrl.verifyOTP);
router.post('/reset-password', ctrl.resetPassword);

// Protected routes
router.get('/profile', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);
router.put('/location', authenticate, ctrl.updateLocation);
router.put('/status', authenticate, ctrl.updateStatus);
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;



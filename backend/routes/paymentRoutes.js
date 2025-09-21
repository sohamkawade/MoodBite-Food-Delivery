const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');
const webhookController = require('../controllers/webhookController');

// Webhook routes (no authentication required)
router.post('/webhook', webhookController.handleRazorpayWebhook);

// All other payment routes require authentication
router.use(authenticate);

// Create Razorpay order
router.post('/create-order', paymentController.createRazorpayOrder);

// Verify Razorpay payment
router.post('/verify', paymentController.verifyRazorpayPayment);

module.exports = router;

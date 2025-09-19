const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const {
  submitRating,
  getOrderRating,
  getRestaurantRatings,
  getUserRatings,
  getRatingStats,
  canRateOrder
} = require('../controllers/ratingController');

// User routes (require authentication)
router.use(authenticate);

// Submit rating for delivered order
router.post('/order/:orderId', submitRating);

// Get rating for a specific order
router.get('/order/:orderId', getOrderRating);

// Check if order can be rated
router.get('/order/:orderId/can-rate', canRateOrder);

// Get user's rating history
router.get('/user/history', getUserRatings);

// Get restaurant ratings (for restaurant owners)
router.get('/restaurant/:restaurantId', getRestaurantRatings);

// Get rating statistics (for admin)
router.get('/stats', getRatingStats);

module.exports = router;

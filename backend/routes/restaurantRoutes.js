const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middlewares/authMiddleware');
const restaurantController = require('../controllers/restaurantController');

// Public routes
router.post('/register', restaurantController.registerRestaurant);

// Admin routes
router.get('/admin/all', authenticateAdmin, restaurantController.getAllRestaurantsForAdmin);
router.get('/admin/:id', authenticateAdmin, restaurantController.getRestaurantById);
router.post('/admin/create', authenticateAdmin, restaurantController.createRestaurant);
router.put('/admin/:id', authenticateAdmin, restaurantController.updateRestaurant);
router.delete('/admin/:id', authenticateAdmin, restaurantController.deleteRestaurant);
router.patch('/admin/:id/status', authenticateAdmin, restaurantController.updateRestaurantStatusAdmin);

// Delivery boy management (admin)
router.get('/admin/:id/delivery-boys', authenticateAdmin, restaurantController.listDeliveryBoysForRestaurant);
router.post('/admin/:id/delivery-boys', authenticateAdmin, restaurantController.assignDeliveryBoy);
router.delete('/admin/:id/delivery-boys/:riderId', authenticateAdmin, restaurantController.removeDeliveryBoy);

module.exports = router;

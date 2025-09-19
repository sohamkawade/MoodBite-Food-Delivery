const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin, authenticateRestaurant } = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

router.use(authenticate);

// Place order from cart
router.post('/place', orderController.placeOrder);

// Get my orders
router.get('/', orderController.getMyOrders);

router.get('/admin/all', authenticateAdmin, orderController.adminListOrders);
router.put('/admin/:id', authenticateAdmin, orderController.adminUpdateOrder);
// Admin: assign delivery boy to an order
router.post('/admin/:id/assign-delivery', authenticateAdmin, async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const order = await require('../models/Order').findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.assignedDeliveryBoy = deliveryBoyId || null;
    await order.save();
    res.json({ success: true, message: 'Delivery boy assigned', data: order });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to assign delivery boy' });
  }
});

// Admin: auto-assign nearest available delivery boy
router.post('/admin/:id/auto-assign', authenticateAdmin, orderController.adminAutoAssignDeliveryBoy);

// Restaurant endpoints (must come before /:id)
router.get('/restaurant', authenticateRestaurant, orderController.restaurantListOrders);
router.put('/restaurant/:id/status', authenticateRestaurant, orderController.restaurantUpdateOrderStatus);

// Delivery endpoints (must come before /:id)
router.get('/delivery', async (req, res, next) => {
  // Explicitly ensure only delivery tokens pass through
  try {
    if (req.user?.type !== 'delivery') return res.status(401).json({ success: false, message: 'Delivery authentication required' });
    return orderController.deliveryListOrders(req, res);
  } catch (e) { next(e); }
});
router.put('/delivery/:id/status', async (req, res, next) => {
  try {
    if (req.user?.type !== 'delivery') return res.status(401).json({ success: false, message: 'Delivery authentication required' });
    return orderController.deliveryUpdateStatus(req, res);
  } catch (e) { next(e); }
});

// Delivery OTP verification routes
router.post('/delivery/:id/verify-otp', async (req, res, next) => {
  try {
    if (req.user?.type !== 'delivery') return res.status(401).json({ success: false, message: 'Delivery authentication required' });
    return orderController.verifyDeliveryOTP(req, res);
  } catch (e) { next(e); }
});

router.post('/delivery/:id/resend-otp', async (req, res, next) => {
  try {
    if (req.user?.type !== 'delivery') return res.status(401).json({ success: false, message: 'Delivery authentication required' });
    return orderController.resendDeliveryOTP(req, res);
  } catch (e) { next(e); }
});

// Get specific order (must come after specific routes)
router.get('/:id', orderController.getOrderById);

// User: cancel order
router.post('/:id/cancel', orderController.cancelMyOrder);

module.exports = router;



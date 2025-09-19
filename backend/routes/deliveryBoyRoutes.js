const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/deliveryBoyController');

// Admin management routes
router.get('/admin', authenticateAdmin, ctrl.getAllDeliveryBoysForAdmin);
router.post('/admin', authenticateAdmin, ctrl.createDeliveryBoy);
router.put('/admin/:id', authenticateAdmin, ctrl.updateDeliveryBoy);
router.delete('/admin/:id', authenticateAdmin, ctrl.deleteDeliveryBoy);
router.post('/admin/:id/approve', authenticateAdmin, ctrl.approveDeliveryBoy);
router.post('/admin/:id/reject', authenticateAdmin, ctrl.rejectDeliveryBoy);
router.patch('/admin/:deliveryBoyId/status', authenticateAdmin, ctrl.updateDeliveryBoyStatus);

router.post('/:id/online', ctrl.goOnline);
router.post('/:id/offline', ctrl.goOffline);
router.get('/online', ctrl.getOnlineDeliveryBoys);

module.exports = router;



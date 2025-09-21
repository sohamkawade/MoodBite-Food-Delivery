const express = require('express');
const router = express.Router();
const { getBalance, updateBankDetailsController, deleteBankDetailsController, getAllBalances, getTransactionHistory, validateBankAccount, validateBankAccountPublic, getCommissionRates, settleCODOrder, updateDeliveryBoyEarningsForExistingOrders, fixExistingCODOrders } = require('../controllers/balanceController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Get balance for any user type
router.get('/', authenticateToken, getBalance);

// Update bank details for any user type
router.put('/bank-details', authenticateToken, updateBankDetailsController);

// Delete bank details for any user type
router.delete('/bank-details', authenticateToken, deleteBankDetailsController);

// Get transaction history for any user type
router.get('/transactions', authenticateToken, getTransactionHistory);

// Validate bank account details
router.post('/validate-bank', authenticateToken, validateBankAccount);

// Public bank validation (no authentication required for registration)
router.post('/validate-bank-public', validateBankAccountPublic);

// Get commission rates (public endpoint)
router.get('/commission-rates', getCommissionRates);

// Admin only routes
router.get('/admin/all', authenticateToken, (req, res, next) => {
  // Check if user is admin
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
}, getAllBalances);

// COD Settlement (Admin only)
router.post('/settle-cod/:orderId', authenticateToken, (req, res, next) => {
  // Check if user is admin
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
}, settleCODOrder);

// Update delivery boy earnings for existing orders (Admin only)
router.post('/update-delivery-earnings/:deliveryBoyId', authenticateToken, (req, res, next) => {
  // Check if user is admin
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
}, updateDeliveryBoyEarningsForExistingOrders);

// Fix existing COD orders (Admin only)
router.post('/fix-cod-orders', authenticateToken, (req, res, next) => {
  // Check if user is admin
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
}, fixExistingCODOrders);

module.exports = router;

const { getUserBalance, updateBankDetails, COMMISSION_RATES } = require('../services/paymentDistributionService');
const { encryptBankDetails, decryptBankDetails } = require('../utils/encryption');
const Restaurant = require('../models/Restaurant');
const DeliveryBoy = require('../models/DeliveryBoy');
const Admin = require('../models/Admin');

// Get balance for any user type
const getBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    // Map user type from auth middleware
    let userType;
    if (req.user.type === 'admin') {
      userType = 'admin';
    } else if (req.user.type === 'restaurant') {
      userType = 'restaurant';
    } else if (req.user.type === 'delivery') {
      userType = 'delivery_boy';
    } else {
      userType = 'user'; // Default for regular users
    }

    const result = await getUserBalance(userId, userType);
    
    if (result.success) {
      // Calculate additional earnings data for admin
      let todayEarnings = 0;
      let thisWeekEarnings = 0;
      let thisMonthEarnings = 0;
      let recentTransactions = [];
      
      if (userType === 'admin') {
        try {
          const Order = require('../models/Order');
          const now = new Date();
          
          // Today's earnings
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const todayOrders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow },
            $or: [
              { paymentStatus: 'completed' },
              { paymentMethod: 'cash', status: { $in: ['delivered', 'completed'] } }
            ]
          });
          
          todayEarnings = todayOrders.reduce((sum, order) => {
            return sum + (order.total * 0.05); // Admin gets 5% commission
          }, 0);
          
          // This week's earnings
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          
          const weekOrders = await Order.find({
            createdAt: { $gte: startOfWeek, $lt: now },
            $or: [
              { paymentStatus: 'completed' },
              { paymentMethod: 'cash', status: { $in: ['delivered', 'completed'] } }
            ]
          });
          
          thisWeekEarnings = weekOrders.reduce((sum, order) => {
            return sum + (order.total * 0.05);
          }, 0);
          
          // This month's earnings
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const monthOrders = await Order.find({
            createdAt: { $gte: startOfMonth, $lt: now },
            $or: [
              { paymentStatus: 'completed' },
              { paymentMethod: 'cash', status: { $in: ['delivered', 'completed'] } }
            ]
          });
          
          thisMonthEarnings = monthOrders.reduce((sum, order) => {
            return sum + (order.total * 0.05);
          }, 0);
          
          // Recent transactions (last 10 orders)
          const recentOrders = await Order.find({
            $or: [
              { paymentStatus: 'completed' },
              { paymentMethod: 'cash', status: { $in: ['delivered', 'completed'] } }
            ]
          })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('orderId total createdAt paymentMethod');
          
          recentTransactions = recentOrders.map(order => ({
            description: `Order ${order.orderId} (${order.paymentMethod === 'cash' ? 'COD' : 'Online'})`,
            type: 'platform_commission',
            amount: order.total * 0.05,
            date: order.createdAt,
            status: 'completed'
          }));
          
        } catch (error) {
          console.error('Error calculating admin earnings:', error);
        }
      }
      
      // Prepare response data
      const responseData = {
        balance: result.balance,
        totalEarnings: result.totalEarnings,
        todayEarnings: todayEarnings,
        bankDetails: result.bankDetails ? decryptBankDetails(result.bankDetails) : null
      };

      // Add admin specific information
      if (userType === 'admin') {
        responseData.thisWeekEarnings = thisWeekEarnings;
        responseData.thisMonthEarnings = thisMonthEarnings;
        responseData.recentTransactions = recentTransactions;
      }

      // Add delivery boy specific information
      if (userType === 'delivery_boy') {
        responseData.commissionRate = Math.round(COMMISSION_RATES.DELIVERY_BOY * 100); // Convert to percentage
        responseData.pendingAmount = result.pendingAmount || 0;
        responseData.totalOrders = result.totalOrders || 0;
        responseData.lastPayout = result.lastPayout || null;
        responseData.nextPayoutDate = result.nextPayoutDate || null;
        responseData.recentTransactions = result.recentTransactions || [];
      }

      // Add restaurant specific information
      if (userType === 'restaurant') {
        responseData.commissionRate = Math.round(COMMISSION_RATES.RESTAURANT * 100); // Convert to percentage
        responseData.pendingAmount = result.pendingAmount || 0;
        responseData.totalOrders = result.totalOrders || 0;
        responseData.lastPayout = result.lastPayout || null;
        responseData.nextPayoutDate = result.nextPayoutDate || null;
        responseData.recentTransactions = result.recentTransactions || [];
      }

      res.json({
        success: true,
        data: responseData
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance'
    });
  }
};

// Update bank details for any user type
const updateBankDetailsController = async (req, res) => {
  try {
    const userId = req.user._id;
    // Map user type from auth middleware
    let userType;
    if (req.user.type === 'admin') {
      userType = 'admin';
    } else if (req.user.type === 'restaurant') {
      userType = 'restaurant';
    } else if (req.user.type === 'delivery') {
      userType = 'delivery_boy';
    } else {
      userType = 'user'; // Default for regular users
    }
    const { accountNumber, ifscCode, accountHolderName, bankName } = req.body;

    // Validate required fields
    if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'All bank details are required'
      });
    }

    const bankDetails = {
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName
    };

    // Encrypt bank details before saving
    const encryptedBankDetails = encryptBankDetails(bankDetails);
    const result = await updateBankDetails(userId, userType, encryptedBankDetails);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Bank details updated successfully',
        data: result.bankDetails ? decryptBankDetails(result.bankDetails) : null
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank details'
    });
  }
};

// Delete bank details for any user type
const deleteBankDetailsController = async (req, res) => {
  try {
    const userId = req.user._id;
    // Map user type from auth middleware
    let userType;
    if (req.user.type === 'admin') {
      userType = 'admin';
    } else if (req.user.type === 'restaurant') {
      userType = 'restaurant';
    } else if (req.user.type === 'delivery') {
      userType = 'delivery_boy';
    } else {
      userType = 'user'; // Default for regular users
    }

    // For delivery boys, we need to handle the required validation differently
    if (userType === 'delivery_boy') {
      // Directly update the delivery boy document to unset bank details
      const DeliveryBoy = require('../models/DeliveryBoy');
      const result = await DeliveryBoy.findByIdAndUpdate(
        userId,
        { $unset: { bankDetails: 1 } },
        { new: true, runValidators: false }
      );
      
      if (result) {
        res.json({
          success: true,
          message: 'Bank details deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Delivery boy not found'
        });
      }
    } else {
      // For other user types, use the regular update method
      const result = await updateBankDetails(userId, userType, {
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: ''
      });
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Bank details deleted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    }
  } catch (error) {
    console.error('Delete bank details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bank details'
    });
  }
};

// Get all balances for admin dashboard
const getAllBalances = async (req, res) => {
  try {
    // Get all restaurants with balance
    const restaurants = await Restaurant.find({})
      .select('name balance totalEarnings bankDetails')
      .lean();

    // Get all delivery boys with balance
    const deliveryBoys = await DeliveryBoy.find({})
      .select('name balance totalEarnings bankDetails')
      .lean();

    // Get admin balance
    const admin = await Admin.findOne({ status: 'active' })
      .select('balance totalEarnings bankDetails')
      .lean();

    res.json({
      success: true,
      data: {
        restaurants: restaurants.map(r => ({
          id: r._id,
          name: r.name,
          balance: r.balance || 0,
          totalEarnings: r.totalEarnings || 0,
          hasBankDetails: !!(r.bankDetails && r.bankDetails.accountNumber)
        })),
        deliveryBoys: deliveryBoys.map(d => ({
          id: d._id,
          name: d.name,
          balance: d.balance || 0,
          totalEarnings: d.totalEarnings || 0,
          hasBankDetails: !!(d.bankDetails && d.bankDetails.accountNumber)
        })),
        platform: {
          balance: admin?.balance || 0,
          totalEarnings: admin?.totalEarnings || 0,
          hasBankDetails: !!(admin?.bankDetails && admin?.bankDetails.accountNumber)
        }
      }
    });
  } catch (error) {
    console.error('Get all balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balances'
    });
  }
};

// Get transaction history
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, type } = req.query;
    
    // Map user type from auth middleware
    let userType;
    if (req.user.type === 'admin') {
      userType = 'admin';
    } else if (req.user.type === 'restaurant') {
      userType = 'restaurant';
    } else if (req.user.type === 'delivery') {
      userType = 'delivery_boy';
    } else {
      userType = 'user'; // Default for regular users
    }

    const Transaction = require('../models/Transaction');
    const Order = require('../models/Order');
    
    // Build query
    const query = { user: userId };
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    // Get transactions with order details
    const transactions = await Transaction.find(query)
      .populate('order', 'orderId status totalAmount restaurant')
      .populate('order.restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    // Get user balance info
    const balanceResult = await getUserBalance(userId, userType);
    
    res.json({
      success: true,
      data: {
        transactions,
        balance: balanceResult.balance || 0,
        totalEarnings: balanceResult.totalEarnings || 0,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history'
    });
  }
};



// Validate bank account details using Razorpay API
const validateBankAccount = async (req, res) => {
  try {
    const { accountNumber, ifscCode } = req.body;

    if (!accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'Account number and IFSC code are required'
      });
    }

    // Call Razorpay bank validation API
    const response = await fetch('https://api.razorpay.com/v1/bank_accounts/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
      },
      body: JSON.stringify({
        account_number: accountNumber,
        ifsc: ifscCode,
        name: 'Account Holder'
      })
    });

    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        data: {
          bankName: data.bank_name || 'Bank Name Not Available',
          accountHolderName: data.name || data.account_holder_name || 'Please enter account holder name manually',
          isValid: data.valid || false
        }
      });
    } else {
      // Fallback to IFSC lookup API
      const ifscResponse = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
      if (ifscResponse.ok) {
        const ifscData = await ifscResponse.json();
        res.json({
          success: true,
          data: {
            bankName: ifscData.BANK || 'Bank Name Not Available',
            accountHolderName: 'Please enter account holder name manually',
            isValid: true
          }
        });
      } else {
        throw new Error('Bank verification failed');
      }
    }
  } catch (error) {
    console.error('Bank validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate bank account',
      error: error.message
    });
  }
};


// Public bank validation (no authentication required for registration)
const validateBankAccountPublic = async (req, res) => {
  try {
    const { accountNumber, ifscCode } = req.body;

    if (!accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'Account number and IFSC code are required'
      });
    }

    // Call Razorpay bank validation API
    const response = await fetch('https://api.razorpay.com/v1/bank_accounts/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
      },
      body: JSON.stringify({
        account_number: accountNumber,
        ifsc: ifscCode,
        name: 'Account Holder'
      })
    });

    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        data: {
          bankName: data.bank_name || 'Bank Name Not Available',
          accountHolderName: data.name || data.account_holder_name || 'Please enter account holder name manually',
          isValid: data.valid || false
        }
      });
    } else {
      // Fallback to IFSC lookup API
      const ifscResponse = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
      if (ifscResponse.ok) {
        const ifscData = await ifscResponse.json();
        res.json({
          success: true,
          data: {
            bankName: ifscData.BANK || 'Bank Name Not Available',
            accountHolderName: 'Please enter account holder name manually',
            isValid: true
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid bank account details'
        });
      }
    }
  } catch (error) {
    console.error('Bank validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate bank account',
      error: error.message
    });
  }
};

// Get commission rates
const getCommissionRates = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        restaurant: Math.round(COMMISSION_RATES.RESTAURANT * 100), // Convert to percentage
        deliveryBoy: Math.round(COMMISSION_RATES.DELIVERY_BOY * 100),
        platform: Math.round(COMMISSION_RATES.PLATFORM * 100)
      }
    });
  } catch (error) {
    console.error('Error getting commission rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission rates'
    });
  }
};

// COD Settlement - Mark cash as collected and settle pending amounts
const settleCODOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { collectedAmount } = req.body;
    
    const Order = require('../models/Order');
    const order = await Order.findById(orderId).populate('restaurant assignedDeliveryBoy');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.paymentMethod !== 'cash') {
      return res.status(400).json({ success: false, message: 'This order is not a COD order' });
    }
    
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'This order has already been settled' });
    }
    
    // Verify collected amount matches order total
    if (collectedAmount !== order.total) {
      return res.status(400).json({ 
        success: false, 
        message: `Collected amount (₹${collectedAmount}) does not match order total (₹${order.total})` 
      });
    }
    
    // Update order payment status
    order.paymentStatus = 'completed';
    await order.save();
    
    // Calculate distribution amounts
    const restaurantAmount = Math.round(order.total * 0.80); // 80% to restaurant
    const deliveryAmount = Math.round(order.total * 0.10); // 10% to delivery boy
    const platformAmount = order.total - restaurantAmount - deliveryAmount; // 10% to platform
    
    // Settle restaurant pending amount
    if (order.restaurant) {
      order.restaurant.pendingAmount = Math.max(0, (order.restaurant.pendingAmount || 0) - restaurantAmount);
      order.restaurant.balance = (order.restaurant.balance || 0) + restaurantAmount;
      order.restaurant.totalEarnings = (order.restaurant.totalEarnings || 0) + restaurantAmount;
      
      // Update transaction status
      if (order.restaurant.recentTransactions) {
        const codTransaction = order.restaurant.recentTransactions.find(t => 
          t.description && t.description.includes(order.orderId) && t.status === 'pending'
        );
        if (codTransaction) {
          codTransaction.status = 'completed';
        }
      }
      
      await order.restaurant.save();
    }
    
    // Settle delivery boy pending amount
    if (order.assignedDeliveryBoy) {
      order.assignedDeliveryBoy.pendingAmount = Math.max(0, (order.assignedDeliveryBoy.pendingAmount || 0) - deliveryAmount);
      order.assignedDeliveryBoy.balance = (order.assignedDeliveryBoy.balance || 0) + deliveryAmount;
      order.assignedDeliveryBoy.totalEarnings = (order.assignedDeliveryBoy.totalEarnings || 0) + deliveryAmount;
      
      // Update transaction status
      if (order.assignedDeliveryBoy.recentTransactions) {
        const codTransaction = order.assignedDeliveryBoy.recentTransactions.find(t => 
          t.description && t.description.includes(order.orderId) && t.status === 'pending'
        );
        if (codTransaction) {
          codTransaction.status = 'completed';
        }
      }
      
      await order.assignedDeliveryBoy.save();
      
      // Mark pending delivery as settled
      if (order.pendingDeliveryStatus === 'assigned') {
        order.pendingDeliveryStatus = 'settled';
        await order.save();
      }
    }
    
    // Settle platform pending amount
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne();
    if (admin) {
      admin.pendingAmount = Math.max(0, (admin.pendingAmount || 0) - platformAmount);
      admin.balance = (admin.balance || 0) + platformAmount;
      admin.totalEarnings = (admin.totalEarnings || 0) + platformAmount;
      
      // Update transaction status
      if (admin.recentTransactions) {
        const codTransaction = admin.recentTransactions.find(t => 
          t.description && t.description.includes(order.orderId) && t.status === 'pending'
        );
        if (codTransaction) {
          codTransaction.status = 'completed';
        }
      }
      
      await admin.save();
    }
    
    console.log(`COD Order ${order.orderId} settled: Restaurant ₹${restaurantAmount}, Delivery ₹${deliveryAmount}, Platform ₹${platformAmount}`);
    
    res.json({
      success: true,
      message: 'COD order settled successfully',
      data: {
        orderId: order.orderId,
        totalAmount: order.total,
        distribution: {
          restaurant: restaurantAmount,
          deliveryBoy: deliveryAmount,
          platform: platformAmount
        }
      }
    });
    
  } catch (error) {
    console.error('COD settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to settle COD order'
    });
  }
};

// Update delivery boy earnings for existing orders
const updateDeliveryBoyEarningsForExistingOrders = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    
    const Order = require('../models/Order');
    const DeliveryBoy = require('../models/DeliveryBoy');
    
    // Find delivery boy
    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }
    
    // Find all completed orders assigned to this delivery boy
    const completedOrders = await Order.find({
      assignedDeliveryBoy: deliveryBoyId,
      status: 'delivered',
      $or: [
        { paymentStatus: 'completed' },
        { paymentMethod: 'cash' }
      ]
    }).populate('restaurant');
    
    let updatedCount = 0;
    let totalEarnings = 0;
    
    for (const order of completedOrders) {
      try {
        // Calculate delivery boy amount
        const deliveryAmount = Math.round(order.total * 0.10); // 10% commission
        
        // Check if delivery boy already has earnings for this order
        const hasExistingEarning = deliveryBoy.recentTransactions?.some(t => 
          t.description && t.description.includes(order.orderId)
        );
        
        if (!hasExistingEarning) {
          // Update delivery boy balance and earnings
          deliveryBoy.balance = (deliveryBoy.balance || 0) + deliveryAmount;
          deliveryBoy.totalEarnings = (deliveryBoy.totalEarnings || 0) + deliveryAmount;
          deliveryBoy.totalOrders = (deliveryBoy.totalOrders || 0) + 1;
          
          // Add to recent transactions
          deliveryBoy.recentTransactions = deliveryBoy.recentTransactions || [];
          deliveryBoy.recentTransactions.push({
            date: new Date(),
            type: 'delivery_fee',
            amount: deliveryAmount,
            status: 'completed',
            description: `Delivery fee for order #${order.orderId} - ${order.paymentMethod === 'cash' ? 'COD' : 'Online'}`
          });
          
          // Keep only last 10 transactions
          if (deliveryBoy.recentTransactions.length > 10) {
            deliveryBoy.recentTransactions = deliveryBoy.recentTransactions.slice(-10);
          }
          
          updatedCount++;
          totalEarnings += deliveryAmount;
        }
      } catch (orderError) {
        console.error(`Error updating earnings for order ${order.orderId}:`, orderError);
      }
    }
    
    await deliveryBoy.save();
    
    res.json({
      success: true,
      message: `Updated earnings for ${updatedCount} orders`,
      data: {
        deliveryBoyId,
        deliveryBoyName: deliveryBoy.name,
        updatedOrders: updatedCount,
        totalEarningsAdded: totalEarnings,
        currentBalance: deliveryBoy.balance,
        totalEarnings: deliveryBoy.totalEarnings
      }
    });
    
  } catch (error) {
    console.error('Update delivery boy earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery boy earnings'
    });
  }
};

// Fix existing COD orders - automatic distribution
const fixExistingCODOrders = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { distributePayment } = require('../services/paymentDistributionService');
    
    // Find all COD orders that need automatic distribution
    const codOrders = await Order.find({
      paymentMethod: 'cash',
      status: { $in: ['delivered', 'completed'] }
    }).populate('restaurant assignedDeliveryBoy');
    
    let updatedCount = 0;
    let totalDistributed = 0;
    
    for (const order of codOrders) {
      try {
        // Calculate amounts
        const restaurantAmount = Math.round(order.total * 0.80); // 80%
        const deliveryAmount = Math.round(order.total * 0.10); // 10%
        const platformAmount = order.total - restaurantAmount - deliveryAmount; // 10%
        
        // Check if already distributed
        const hasRestaurantEarning = order.restaurant?.recentTransactions?.some(t => 
          t.description && t.description.includes(order.orderId)
        );
        
        if (!hasRestaurantEarning) {
          // Automatic distribution for COD order
          const distributionResult = await distributePayment(
            {
              orderId: order.orderId,
              customerId: order.customer,
              restaurantId: order.restaurant._id,
              totalAmount: order.total,
              paymentMethod: 'cash'
            },
            order.total,
            order.restaurant._id,
            order.assignedDeliveryBoy?._id || null,
            'cash'
          );
          
          if (distributionResult.success) {
            updatedCount++;
            totalDistributed += order.total;
            console.log(`Automatically distributed COD order ${order.orderId}: ₹${order.total}`);
          }
        }
      } catch (orderError) {
        console.error(`Error distributing COD order ${order.orderId}:`, orderError);
      }
    }
    
    res.json({
      success: true,
      message: `Automatically distributed ${updatedCount} COD orders`,
      data: {
        updatedOrders: updatedCount,
        totalAmountDistributed: totalDistributed,
        totalOrders: codOrders.length
      }
    });
    
  } catch (error) {
    console.error('Fix existing COD orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix existing COD orders'
    });
  }
};

module.exports = { 
  getBalance, 
  updateBankDetailsController, 
  deleteBankDetailsController,
  getAllBalances,
  getTransactionHistory,
  validateBankAccount,
  validateBankAccountPublic,
  getCommissionRates,
  settleCODOrder,
  updateDeliveryBoyEarningsForExistingOrders,
  fixExistingCODOrders
};

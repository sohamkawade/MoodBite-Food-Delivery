const Razorpay = require('razorpay');
const crypto = require('crypto');
const keys = require('../config/keys');
const Restaurant = require('../models/Restaurant');
const DeliveryBoy = require('../models/DeliveryBoy');
const Admin = require('../models/Admin');
const Payout = require('../models/Payout');

const razorpay = new Razorpay({
  key_id: keys.RAZORPAY_KEY_ID,
  key_secret: keys.RAZORPAY_KEY_SECRET,
});

// Commission percentages
const COMMISSION_RATES = {
  RESTAURANT: 0.80, // 80% to restaurant
  DELIVERY_BOY: 0.15, // 15% to delivery boy
  PLATFORM: 0.05 // 5% to platform
};

/**
 * Distribute payment after successful order
 * @param {Object} orderData - Order details
 * @param {Number} totalAmount - Total order amount
 * @param {String} restaurantId - Restaurant ID
 * @param {String} deliveryBoyId - Delivery Boy ID (optional)
 * @returns {Object} Distribution result
 */
const distributePayment = async (orderData, totalAmount, restaurantId, deliveryBoyId = null) => {
  try {
    // Calculate amounts
    const restaurantAmount = Math.round(totalAmount * COMMISSION_RATES.RESTAURANT);
    const deliveryAmount = Math.round(totalAmount * COMMISSION_RATES.DELIVERY_BOY);
    const platformAmount = totalAmount - restaurantAmount - deliveryAmount;

    const distributionResult = {
      success: true,
      distributions: []
    };

    // 1. Transfer to Restaurant
    const restaurantTransfer = await transferToRestaurant(restaurantId, restaurantAmount, orderData);
    if (restaurantTransfer.success) {
      distributionResult.distributions.push(restaurantTransfer);
    } else {
      console.error('Restaurant transfer failed:', restaurantTransfer.error);
      // Still continue with other transfers
    }

    // 2. Transfer to Delivery Boy (if assigned)
    if (deliveryBoyId) {
      const deliveryTransfer = await transferToDeliveryBoy(deliveryBoyId, deliveryAmount, orderData);
      if (deliveryTransfer.success) {
        distributionResult.distributions.push(deliveryTransfer);
      } else {
        console.error('Delivery boy transfer failed:', deliveryTransfer.error);
        // Add delivery amount to platform if transfer fails
        platformAmount += deliveryAmount;
      }
    } else {
      // If no delivery boy, add delivery amount to platform
      platformAmount += deliveryAmount;
    }

    // 3. Update Platform Balance
    const platformUpdate = await updatePlatformBalance(platformAmount, orderData);
    if (platformUpdate.success) {
      distributionResult.distributions.push(platformUpdate);
    }

    return distributionResult;

  } catch (error) {
    console.error('Payment distribution error:', error);
    return {
      success: false,
      error: error.message,
      distributions: []
    };
  }
};

/**
 * Transfer money to restaurant using Razorpay Payout API
 */
const transferToRestaurant = async (restaurantId, amount, orderData) => {
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    if (!restaurant.bankDetails || !restaurant.bankDetails.accountNumber) {
      return { success: false, error: 'Restaurant bank details not provided' };
    }

    // Try Razorpay Payout API first
    try {
      const payoutData = {
        account_number: restaurant.bankDetails.accountNumber,
        fund_account: {
          account_type: 'bank_account',
          bank_account: {
            name: restaurant.bankDetails.accountHolderName,
            ifsc: restaurant.bankDetails.ifscCode,
            account_number: restaurant.bankDetails.accountNumber
          }
        },
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: `restaurant_${restaurantId}_${orderData.orderId}_${Date.now()}`,
        narration: `MoodBite Restaurant Payment - Order ${orderData.orderId}`
      };

      const payout = await razorpay.payouts.create(payoutData);
      
      // Save payout record to database
      const payoutRecord = new Payout({
        razorpayPayoutId: payout.id,
        referenceId: payoutData.reference_id,
        recipientType: 'restaurant',
        recipientId: restaurantId,
        recipientName: restaurant.name,
        bankDetails: {
          accountNumber: restaurant.bankDetails.accountNumber,
          ifscCode: restaurant.bankDetails.ifscCode,
          accountHolderName: restaurant.bankDetails.accountHolderName,
          bankName: restaurant.bankDetails.bankName
        },
        amount: amount,
        narration: payoutData.narration,
        orderId: orderData.orderId,
        orderData: orderData,
        status: payout.status,
        razorpayStatus: payout.status,
        razorpayResponse: payout
      });
      await payoutRecord.save();
      
      if (payout.status === 'queued' || payout.status === 'processing') {
        // Update restaurant balance
        restaurant.balance += amount;
        restaurant.totalEarnings += amount;
        await restaurant.save();

        return {
          success: true,
          type: 'restaurant',
          amount,
          recipient: restaurant.name,
          method: 'razorpay_payout',
          payoutId: payout.id,
          status: payout.status,
          payoutRecordId: payoutRecord._id
        };
      } else {
        throw new Error(`Payout failed with status: ${payout.status}`);
      }
    } catch (payoutError) {
      console.error('Razorpay payout failed, falling back to balance update:', payoutError);
      
      // Fallback to balance update if payout fails
      restaurant.balance += amount;
      restaurant.totalEarnings += amount;
      await restaurant.save();

      return {
        success: true,
        type: 'restaurant',
        amount,
        recipient: restaurant.name,
        method: 'balance_update_fallback',
        error: payoutError.message
      };
    }

  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Transfer money to delivery boy using Razorpay Payout API
 */
const transferToDeliveryBoy = async (deliveryBoyId, amount, orderData) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return { success: false, error: 'Delivery boy not found' };
    }

    if (!deliveryBoy.bankDetails || !deliveryBoy.bankDetails.accountNumber) {
      return { success: false, error: 'Delivery boy bank details not provided' };
    }

    // Try Razorpay Payout API first
    try {
      const payoutData = {
        account_number: deliveryBoy.bankDetails.accountNumber,
        fund_account: {
          account_type: 'bank_account',
          bank_account: {
            name: deliveryBoy.bankDetails.accountHolderName,
            ifsc: deliveryBoy.bankDetails.ifscCode,
            account_number: deliveryBoy.bankDetails.accountNumber
          }
        },
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: `delivery_${deliveryBoyId}_${orderData.orderId}_${Date.now()}`,
        narration: `MoodBite Delivery Payment - Order ${orderData.orderId}`
      };

      const payout = await razorpay.payouts.create(payoutData);
      
      // Save payout record to database
      const payoutRecord = new Payout({
        razorpayPayoutId: payout.id,
        referenceId: payoutData.reference_id,
        recipientType: 'delivery_boy',
        recipientId: deliveryBoyId,
        recipientName: deliveryBoy.name,
        bankDetails: {
          accountNumber: deliveryBoy.bankDetails.accountNumber,
          ifscCode: deliveryBoy.bankDetails.ifscCode,
          accountHolderName: deliveryBoy.bankDetails.accountHolderName,
          bankName: deliveryBoy.bankDetails.bankName
        },
        amount: amount,
        narration: payoutData.narration,
        orderId: orderData.orderId,
        orderData: orderData,
        status: payout.status,
        razorpayStatus: payout.status,
        razorpayResponse: payout
      });
      await payoutRecord.save();
      
      if (payout.status === 'queued' || payout.status === 'processing') {
        // Update delivery boy balance
        deliveryBoy.balance += amount;
        deliveryBoy.totalEarnings += amount;
        await deliveryBoy.save();

        return {
          success: true,
          type: 'delivery_boy',
          amount,
          recipient: deliveryBoy.name,
          method: 'razorpay_payout',
          payoutId: payout.id,
          status: payout.status,
          payoutRecordId: payoutRecord._id
        };
      } else {
        throw new Error(`Payout failed with status: ${payout.status}`);
      }
    } catch (payoutError) {
      console.error('Razorpay payout failed, falling back to balance update:', payoutError);
      
      // Fallback to balance update if payout fails
      deliveryBoy.balance += amount;
      deliveryBoy.totalEarnings += amount;
      await deliveryBoy.save();

      return {
        success: true,
        type: 'delivery_boy',
        amount,
        recipient: deliveryBoy.name,
        method: 'balance_update_fallback',
        error: payoutError.message
      };
    }

  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update platform balance
 */
const updatePlatformBalance = async (amount, orderData) => {
  try {
    // Get the first admin (platform owner)
    const admin = await Admin.findOne({ status: 'active' });
    if (!admin) {
      return { success: false, error: 'Admin account not found' };
    }

    admin.balance += amount;
    admin.totalEarnings += amount;
    await admin.save();

    return {
      success: true,
      type: 'platform',
      amount,
      recipient: 'Platform',
      method: 'balance_update'
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get balance for any user type
 */
const getUserBalance = async (userId, userType) => {
  try {
    let user;
    
    switch (userType) {
      case 'restaurant':
        user = await Restaurant.findById(userId);
        break;
      case 'delivery_boy':
        user = await DeliveryBoy.findById(userId);
        break;
      case 'admin':
        user = await Admin.findById(userId);
        break;
      default:
        return { success: false, error: 'Invalid user type' };
    }

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const result = {
      success: true,
      balance: user.balance,
      totalEarnings: user.totalEarnings,
      bankDetails: user.bankDetails
    };

    // Add additional information for delivery boys and restaurants
    if (userType === 'delivery_boy' || userType === 'restaurant') {
      result.pendingAmount = user.pendingAmount || 0;
      result.totalOrders = user.totalOrders || 0;
      result.lastPayout = user.lastPayout || null;
      result.nextPayoutDate = user.nextPayoutDate || null;
      result.recentTransactions = user.recentTransactions || [];
    }

    return result;

  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update bank details for any user type
 */
const updateBankDetails = async (userId, userType, bankDetails) => {
  try {
    let user;
    
    switch (userType) {
      case 'restaurant':
        user = await Restaurant.findById(userId);
        break;
      case 'delivery_boy':
        user = await DeliveryBoy.findById(userId);
        break;
      case 'admin':
        user = await Admin.findById(userId);
        break;
      default:
        return { success: false, error: 'Invalid user type' };
    }

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    user.bankDetails = {
      ...user.bankDetails,
      ...bankDetails,
      isVerified: false // Reset verification when details are updated
    };

    await user.save();

    return {
      success: true,
      message: 'Bank details updated successfully',
      bankDetails: user.bankDetails
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Handle Razorpay payout webhook
 */
const handlePayoutWebhook = async (webhookData) => {
  try {
    const { event, contains, payload } = webhookData;
    
    if (event === 'payout.processed' || event === 'payout.failed') {
      const payoutId = payload.payout.id;
      
      // Find payout record
      const payoutRecord = await Payout.findOne({ razorpayPayoutId: payoutId });
      if (!payoutRecord) {
        console.error('Payout record not found for webhook:', payoutId);
        return { success: false, error: 'Payout record not found' };
      }
      
      // Update payout status
      payoutRecord.status = event === 'payout.processed' ? 'processed' : 'failed';
      payoutRecord.razorpayStatus = payload.payout.status;
      payoutRecord.razorpayResponse = payload.payout;
      
      if (event === 'payout.processed') {
        payoutRecord.processedAt = new Date();
      } else {
        payoutRecord.failedAt = new Date();
        payoutRecord.failureReason = payload.payout.failure_reason || 'Unknown error';
      }
      
      await payoutRecord.save();
      
      // If payout failed, we might want to retry or handle differently
      if (event === 'payout.failed') {
        console.error(`Payout failed for ${payoutRecord.recipientType} ${payoutRecord.recipientId}:`, payoutRecord.failureReason);
        
        // You could implement retry logic here
        // For now, we'll just log the failure
      }
      
      return { success: true, payoutRecord };
    }
    
    return { success: true, message: 'Webhook processed but no action taken' };
  } catch (error) {
    console.error('Payout webhook error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payout status for a specific payout
 */
const getPayoutStatus = async (payoutId) => {
  try {
    const payout = await Payout.findOne({ razorpayPayoutId: payoutId });
    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }
    
    return { success: true, payout };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get all payouts for a recipient
 */
const getRecipientPayouts = async (recipientType, recipientId, limit = 50) => {
  try {
    const payouts = await Payout.find({ 
      recipientType, 
      recipientId 
    })
    .sort({ createdAt: -1 })
    .limit(limit);
    
    return { success: true, payouts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  distributePayment,
  getUserBalance,
  updateBankDetails,
  handlePayoutWebhook,
  getPayoutStatus,
  getRecipientPayouts,
  COMMISSION_RATES
};

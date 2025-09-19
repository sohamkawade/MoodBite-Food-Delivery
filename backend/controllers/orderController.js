const Cart = require('../models/Cart');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');
const DeliveryAssignment = require('../models/DeliveryAssignment');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// Compute delivery by amount (subtotal + tax)
const computeDeliveryFee = (subtotal, tax) => {
  const amount = (subtotal || 0) + (tax || 0);
  if (amount < 200) return 40;
  if (amount < 500) return 20;
  return 0;
};

// Simple coupon evaluator (demo rules)
const evaluateCoupon = (code, subtotal, deliveryFee) => {
  if (!code) return { discount: 0, freeShipping: false };
  const normalized = String(code).trim().toUpperCase();
  if (normalized === 'SAVE10') {
    return { discount: Math.round(subtotal * 0.10), freeShipping: false };
  }
  if (normalized === 'FREESHIP') {
    return { discount: 0, freeShipping: true };
  }
  if (normalized === 'FLAT50' && subtotal >= 299) {
    return { discount: 50, freeShipping: false };
  }
  return { discount: 0, freeShipping: false };
};

// Place order from current cart
const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderType = 'delivery', paymentMethod = 'online', deliveryAddress, alternatePhone, couponCode } = req.body || {};

    // Load user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Load active cart with menu item details
    const cart = await Cart.findActiveByUser(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Ensure items are populated
    await cart.populate('items.menuItem');

    // Compute amounts
    const subtotal = (cart.items || []).reduce((sum, item) => {
      const menuItem = item.menuItem;
      if (!menuItem) return sum;
      const basePrice = menuItem.discountedPrice || menuItem.price || 0;
      const customizationPrice = (item.customizationOptions || [])
        .filter(opt => opt && opt.isSelected)
        .reduce((s, opt) => s + (opt.price || 0), 0);
      return sum + (basePrice + customizationPrice) * (item.quantity || 0);
    }, 0);

    const tax = subtotal * 0.08;
    let deliveryFee = computeDeliveryFee(subtotal, tax);
    // Apply coupon rules
    const { discount, freeShipping } = evaluateCoupon(couponCode, subtotal, deliveryFee);
    if (freeShipping) deliveryFee = 0;
    const total = Math.max(0, subtotal + tax + deliveryFee - (discount || 0));

    // Build order items
    const orderItems = (cart.items || []).map(item => {
      const menuItem = item.menuItem || {};
      const price = menuItem.discountedPrice || menuItem.price || 0;
      return {
        menuItem: menuItem._id,
        name: menuItem.name || '',
        price,
        quantity: item.quantity,
        totalPrice: price * (item.quantity || 0),
        specialInstructions: item.specialInstructions || '',
        customizationOptions: (item.customizationOptions || []).map(opt => ({ name: opt.name, price: opt.price }))
      };
    });

    // Resolve restaurant
    const resolvedRestaurant = cart.restaurant || (cart.items?.[0]?.menuItem?.restaurant);
    if (!resolvedRestaurant) {
      return res.status(400).json({ success: false, message: 'Restaurant not found for cart items' });
    }

    const finalDeliveryAddress = orderType === 'delivery' ? (deliveryAddress || {}) : {};

    // Generate orderId (validation requires it before save)
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    const orderId = `ORD${timestamp}${random}`;

    // Create order
    // Normalize payment method to allowed enum
    let normalizedPaymentMethod = paymentMethod;
    if (paymentMethod === 'cod') normalizedPaymentMethod = 'cash';
    if (paymentMethod === 'card') normalizedPaymentMethod = 'credit_card';
    if (!['cash', 'credit_card', 'debit_card', 'upi', 'wallet', 'online'].includes(normalizedPaymentMethod)) {
      normalizedPaymentMethod = 'online';
    }

    // For demo: mark COD as pending, others completed
    const computedPaymentStatus = normalizedPaymentMethod === 'cash' ? 'pending' : 'completed';

    const order = new Order({
      orderId,
      customer: userId,
      restaurant: resolvedRestaurant,
      items: orderItems,
      status: 'pending',
      orderType,
      deliveryAddress: finalDeliveryAddress,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: computedPaymentStatus,
      subtotal,
      tax,
      deliveryFee,
      discount: discount || 0,
      total,
      orderTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      couponCode: couponCode || undefined,
      customerPhone: user.phone,
      alternatePhone: alternatePhone || undefined,
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      customerEmail: user.email
    });

    await order.save();

    try {
      await Restaurant.findByIdAndUpdate(resolvedRestaurant, { $inc: { totalOrders: 1 } });
      await User.findByIdAndUpdate(userId, { $inc: { totalOrders: 1, totalSpent: total } });
    } catch (e) {
      console.warn('Failed to increment aggregates for restaurant/user:', e?.message || e);
    }

    // Auto-stock control: decrement stock and auto-hide if <= 0
    try {
      for (const it of orderItems) {
        if (!it.menuItem) continue;
        const updated = await MenuItem.findByIdAndUpdate(it.menuItem, { $inc: { stockQuantity: -it.quantity } }, { new: true });
        if (updated && typeof updated.stockQuantity === 'number' && updated.stockQuantity <= 0) {
          updated.isAvailable = false;
          await updated.save();
        }
      }
    } catch (e) { console.warn('Auto stock control failed:', e?.message || e); }

    // Clear cart after order
    await cart.clearCart();

    res.json({ success: true, message: 'Order placed successfully', data: order });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
};

// Get my orders
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ customer: userId })
      .populate('restaurant')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
};

// Get order by id (for the same user)
const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('restaurant')
      .populate('items.menuItem')
      .populate('assignedDeliveryBoy');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customer.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
  }
};

// ADMIN: list all orders with filters
const adminListOrders = async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod, startDate, endDate, q } = req.query;
    const match = {};
    if (status) match.status = status;
    if (paymentStatus) match.paymentStatus = paymentStatus;
    if (paymentMethod) match.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    if (q) {
      match.$or = [
        { orderId: new RegExp(q, 'i') },
        { customerName: new RegExp(q, 'i') },
        { customerPhone: new RegExp(q, 'i') },
      ];
    }
    const orders = await Order.find(match)
      .populate('restaurant')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Admin list orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// ADMIN: update order basic fields (status, priority, delivery partner)
const adminUpdateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryPartnerName, deliveryPartnerPhone, kitchenNotes, deliveryBoyId } = req.body;
    const update = {};
    if (status !== undefined) update.status = status;
    if (deliveryPartnerName !== undefined) update.deliveryPartnerName = deliveryPartnerName;
    if (deliveryPartnerPhone !== undefined) update.deliveryPartnerPhone = deliveryPartnerPhone;
    if (kitchenNotes !== undefined) update.kitchenNotes = kitchenNotes;
    const order = await Order.findByIdAndUpdate(id, update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Optional: assign delivery boy inline
    if (deliveryBoyId) {
      const rider = await DeliveryBoy.findById(deliveryBoyId);
      if (!rider) return res.status(400).json({ success: false, message: 'Delivery boy not found' });
      order.assignedDeliveryBoy = rider._id;
      await order.save();
      await DeliveryAssignment.findOneAndUpdate(
        { order: order._id },
        { order: order._id, restaurant: order.restaurant, deliveryBoy: rider._id, status: 'assigned', assignedAt: new Date() },
        { upsert: true, new: true }
      );
      rider.status = 'busy';
      await rider.save();
    }
    res.json({ success: true, message: 'Order updated', data: order });
  } catch (error) {
    console.error('Admin update order error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
};

// USER: cancel own order (if allowed)
const cancelMyOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customer.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!order.canBeCancelled) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }
    await order.cancelOrder('Cancelled by customer');
    res.json({ success: true, message: 'Order cancelled', data: order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

// ADMIN: auto-assign nearest available delivery boy for the order's restaurant
const adminAutoAssignDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params; // order id
    const order = await Order.findById(id).populate('restaurant');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.restaurant) return res.status(400).json({ success: false, message: 'Restaurant not set for order' });

    const restaurantId = order.restaurant._id;
    const desiredArea = order.deliveryAddress && order.deliveryAddress.area ? order.deliveryAddress.area : null;
    
    const now = new Date();
    let availableRiders = await DeliveryBoy.find({ 
      assignedRestaurant: restaurantId, 
      status: 'available', 
      online: true,
      $or: [
        { onlineExpiresAt: { $gt: now } },
        { onlineExpiresAt: { $exists: false } }
      ],
      ...(desiredArea ? { area: desiredArea } : {}) 
    });
    
    if ((!availableRiders || availableRiders.length === 0)) {
      availableRiders = await DeliveryBoy.find({ 
        status: 'available',
        online: true,
        $or: [
          { onlineExpiresAt: { $gt: now } },
          { onlineExpiresAt: { $exists: false } }
        ]
      }).sort({ updatedAt: -1 });
      
      if (!availableRiders || availableRiders.length === 0) {
        return res.status(404).json({ success: false, message: 'No online delivery boys available' });
      }
    }

    // Simple heuristic: pick the first available (future: compute distance using order.deliveryAddress.coordinates or restaurant.location.coordinates)
    const chosen = availableRiders[0];

    order.assignedDeliveryBoy = chosen._id;
    order.deliveryPartnerName = chosen.name;
    order.deliveryPartnerPhone = chosen.phone;
    await order.save();

    await DeliveryAssignment.findOneAndUpdate(
      { order: order._id },
      { order: order._id, restaurant: restaurantId, deliveryBoy: chosen._id, status: 'assigned', assignedAt: new Date() },
      { upsert: true, new: true }
    );

    chosen.status = 'busy';
    await chosen.save();

    res.json({ success: true, message: 'Auto-assigned delivery boy', data: { orderId: order._id, deliveryBoy: { _id: chosen._id, name: chosen.name, phone: chosen.phone, vehicleNumber: chosen.vehicleNumber || '', area: chosen.area || '' } } });
  } catch (error) {
    console.error('Admin auto-assign error:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-assign delivery boy' });
  }
};

// RESTAURANT: list own restaurant orders
const restaurantListOrders = async (req, res) => {
  try {
    const restaurantId = req.user._id;
    const orders = await Order.find({ restaurant: restaurantId })
      .populate('customer')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Restaurant list orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch restaurant orders' });
  }
};

// RESTAURANT: update order status
const restaurantUpdateOrderStatus = async (req, res) => {
  try {
    const restaurantId = req.user._id;
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['pending', 'preparing', 'ready_for_pickup', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const order = await Order.findOne({ _id: id, restaurant: restaurantId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    await order.save();
    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    console.error('Restaurant update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// DELIVERY: list assigned orders for the delivery boy
const deliveryListOrders = async (req, res) => {
  try {
    const riderId = req.user._id;
    const orders = await Order.find({ assignedDeliveryBoy: riderId })
      .populate('restaurant')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Delivery list orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch delivery orders' });
  }
};

// DELIVERY: update delivery status fields
const deliveryUpdateStatus = async (req, res) => {
  try {
    
    const riderId = req.user._id;
    const { id } = req.params;
    const { status, deliveryNotes } = req.body || {};
    const allowed = ['out_for_delivery', 'delivered', 'cancelled', 'delivery_rejected'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed statuses: ${allowed.join(', ')}` });
    }
    const order = await Order.findOne({ _id: id, assignedDeliveryBoy: riderId }).populate('restaurant');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    
    // If status is being updated to 'out_for_delivery', generate and send OTP
    if (status === 'out_for_delivery' && order.status !== 'out_for_delivery') {
      const { sendDeliveryOTP, generateOTP } = require('../utils/emailService');
      
      // Generate 6-digit OTP
      const otp = generateOTP();
      

      
      // Store OTP in order
      order.deliveryOTP = {
        code: otp,
        isUsed: false,
        attempts: 0
      };
      order.deliveryVerified = false;
      
      // Send OTP via Email
      const deliveryResult = await sendDeliveryOTP(
        order.customerEmail,
        order.customerName,
        order.orderId,
        otp,
        order.restaurant?.name || 'Restaurant'
      );
      
      if (!deliveryResult.success) {
        console.error(`❌ Failed to send delivery OTP for order ${order.orderId}:`, deliveryResult);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send delivery OTP',
          error: deliveryResult.message
        });
      }
    }
    
    if (status) order.status = status;
    if (deliveryNotes !== undefined) order.deliveryNotes = deliveryNotes;
    
    if (status === 'delivery_rejected') {
      order.assignedDeliveryBoy = null;
      order.deliveryBoyId = null;
      order.deliveryPartnerName = null;
      order.deliveryPartnerPhone = null;
      
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          type: 'delivery_rejected',
          title: 'Delivery Boy Rejected Order',
          message: `Order #${order.orderId} was rejected by delivery boy. Please assign another delivery boy.`,
          recipient: 'admin',
          orderId: order._id,
          restaurantId: order.restaurant,
          priority: 'high'
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    }
    
    await order.save();
    
    
    res.json({ 
      success: true, 
      message: 'Delivery status updated', 
      data: order,
      otpSent: status === 'out_for_delivery' && order.status !== 'out_for_delivery',
      otpMethod: status === 'out_for_delivery' ? 'email' : undefined
    });
  } catch (error) {
    console.error('Delivery update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update delivery status' });
  }
};

// DELIVERY: verify delivery OTP
const verifyDeliveryOTP = async (req, res) => {
  try {
    const riderId = req.user._id;
    const { id } = req.params;
    const { otp } = req.body || {};
    
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    
    const order = await Order.findOne({ _id: id, assignedDeliveryBoy: riderId }).populate('restaurant');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'out_for_delivery') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be out for delivery to verify OTP' 
      });
    }
    
    if (!order.deliveryOTP || !order.deliveryOTP.code) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found for this order' 
      });
    }
    
    // Check OTP attempts
    if (order.deliveryOTP.attempts >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum OTP attempts exceeded. Please contact support.' 
      });
    }
    
    // Validate OTP
    const { validateOTP } = require('../utils/emailService');
    const validation = validateOTP(otp, order.deliveryOTP.code, order.deliveryOTP.isUsed);
    
    if (!validation.valid) {
      // Increment attempts
      order.deliveryOTP.attempts += 1;
      await order.save();
      
      return res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
    }
    
    // OTP verified successfully - mark order as delivered
    order.status = 'delivered';
    order.deliveryVerified = true;
    order.actualDeliveryTime = new Date();
    order.deliveryOTP.isUsed = true; // Mark OTP as used
    
    await order.save();
    
    // Update delivery boy status from 'busy' to 'available'
    try {
      const DeliveryBoy = require('../models/DeliveryBoy');
      await DeliveryBoy.findByIdAndUpdate(riderId, { 
        status: 'available',
        lastDeliveryCompleted: new Date()
      });
      
      // Also update DeliveryAssignment status
      const DeliveryAssignment = require('../models/DeliveryAssignment');
      await DeliveryAssignment.findOneAndUpdate(
        { order: order._id },
        { 
          status: 'completed',
          completedAt: new Date()
        }
      );
    } catch (updateError) {
      console.error('Failed to update delivery boy status or assignment:', updateError);
      // Don't fail the delivery if status update fails
    }
    
    res.json({ 
      success: true, 
      message: 'Delivery verified successfully! Order marked as delivered.', 
      data: order 
    });
    
  } catch (error) {
    console.error('Delivery OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify delivery OTP' });
  }
};

// DELIVERY: resend delivery OTP
const resendDeliveryOTP = async (req, res) => {
  try {
    const riderId = req.user._id;
    const { id } = req.params;
    
    const order = await Order.findOne({ _id: id, assignedDeliveryBoy: riderId }).populate('restaurant');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'out_for_delivery') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be out for delivery to resend OTP' 
      });
    }
    
    const { sendDeliveryOTP, generateOTP } = require('../utils/emailService');
    
    // Generate new OTP
    const otp = generateOTP();
    

    
    // Update OTP in order
    order.deliveryOTP = {
      code: otp,
      isUsed: false,
      attempts: 0
    };
    
    // Send new OTP via Email
    const deliveryResult = await sendDeliveryOTP(
      order.customerEmail,
      order.customerName,
      order.orderId,
      otp,
      order.restaurant?.name || 'Restaurant'
    );
    
    if (!deliveryResult.success) {
      console.error(`❌ Failed to resend delivery OTP for order ${order.orderId}:`, deliveryResult);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to resend delivery OTP',
        error: deliveryResult.message
      });
    }
    
    await order.save();
    
    res.json({ 
      success: true, 
      message: 'New OTP sent successfully', 
      data: { 
        message: `OTP resent to customer via ${deliveryResult.method}`,
        method: deliveryResult.method
      }
    });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
};

module.exports = { 
  placeOrder, 
  getMyOrders, 
  getOrderById, 
  adminListOrders, 
  adminUpdateOrder, 
  cancelMyOrder, 
  adminAutoAssignDeliveryBoy,
  restaurantListOrders,
  restaurantUpdateOrderStatus,
  deliveryListOrders,
  deliveryUpdateStatus,
  verifyDeliveryOTP,
  resendDeliveryOTP
};



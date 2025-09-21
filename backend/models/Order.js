const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Menu item is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required']
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  specialInstructions: String,
  customizationOptions: [{
    name: String,
    price: Number
  }]
}, {
  timestamps: true
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    unique: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup'],
    required: [true, 'Order type is required']
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    instructions: String
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedDeliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy',
    default: null
  },
  deliveryPartnerName: String,
  deliveryPartnerPhone: String,
  estimatedDeliveryTime: {
    type: Number, // in minutes
    default: 45
  },
  actualDeliveryTime: Date,
  deliveryOTP: {
    code: String,
    isUsed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 }
  },
  deliveryVerified: { type: Boolean, default: false },
  specialInstructions: String,
  kitchenNotes: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'upi', 'wallet', 'online'],
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  // COD specific fields
  pendingDeliveryAmount: {
    type: Number,
    default: 0,
    min: [0, 'Pending delivery amount cannot be negative']
  },
  pendingDeliveryStatus: {
    type: String,
    enum: ['unassigned', 'assigned', 'settled'],
    default: 'unassigned'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  orderTime: {
    type: String,
    required: [true, 'Order time is required']
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required']
  },
  alternatePhone: {
    type: String,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required']
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required']
  },
  cancellationReason: String,
  cancellationTime: Date,
  refundAmount: {
    type: Number,
    default: 0
  },

  review: String,
  reviewDate: Date,
  isReordered: {
    type: Boolean,
    default: false
  },
  reorderCount: {
    type: Number,
    default: 0
  },
  // Auto-expire orders after 24h when delivered/cancelled
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ customer: 1 });
orderSchema.index({ restaurant: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'deliveryAddress.city': 1 });
// TTL index: documents are removed when expiresAt is in the past
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for order summary
orderSchema.virtual('orderSummary').get(function() {
  return {
    orderId: this.orderId,
    status: this.status,
    total: this.total,
    itemCount: this.items.length,
    orderDate: this.orderDate
  };
});

// Virtual for delivery status
orderSchema.virtual('isDelivered').get(function() {
  return this.status === 'delivered';
});

// Virtual for can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  const nonCancellableStatuses = ['delivered', 'cancelled', 'rejected', 'out_for_delivery'];
  return !nonCancellableStatuses.includes(this.status);
});

// Pre-save middleware to generate order ID if not provided
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    this.orderId = `ORD${timestamp}${random}`;
  }
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else if (newStatus === 'cancelled') {
    this.cancellationTime = new Date();
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else {
    // Clear expiration for non-terminal states
    this.expiresAt = undefined;
  }
  
  return this.save();
};

// Method to add delivery partner
orderSchema.methods.assignDeliveryPartner = function(deliveryPartnerId) {
  this.deliveryPartner = deliveryPartnerId;
  return this.save();
};

// Method to calculate estimated delivery time
orderSchema.methods.calculateEstimatedDeliveryTime = function() {
  const baseTime = this.restaurant.averagePreparationTime || 25;
  const deliveryTime = this.deliveryFee > 0 ? 20 : 15; // Rough estimate
  return baseTime + deliveryTime;
};



// Method to cancel order
orderSchema.methods.cancelOrder = function(reason) {
  if (!this.canBeCancelled) {
    throw new Error('Order cannot be cancelled at this stage');
  }
  
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancellationTime = new Date();
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  // Calculate refund amount
  if (this.paymentStatus === 'completed') {
    this.refundAmount = this.total;
    this.paymentStatus = 'refunded';
  }
  
  return this.save();
};

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function(customerId) {
  return this.find({ customer: customerId }).sort({ orderDate: -1 });
};

// Static method to find orders by restaurant
orderSchema.statics.findByRestaurant = function(restaurantId) {
  return this.find({ restaurant: restaurantId }).sort({ orderDate: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ orderDate: -1 });
};

// Static method to find orders by delivery zone
orderSchema.statics.findByDeliveryZone = function(zone) {
  return this.find({ deliveryZone: zone }).sort({ orderDate: -1 });
};

// Static method to find orders by priority
orderSchema.statics.findByPriority = function(priority) {
  return this.find({ priority }).sort({ orderDate: -1 });
};

// Static method to find orders within date range
orderSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    orderDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ orderDate: -1 });
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(restaurantId = null) {
  const match = restaurantId ? { restaurant: restaurantId } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);

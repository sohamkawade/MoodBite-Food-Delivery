const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Menu item is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  specialInstructions: String,
  customizationOptions: [{
    name: String,
    price: Number,
    isSelected: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
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
    default: 0,
    min: [0, 'Total cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Cart expires after 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
cartSchema.index({ user: 1 });
cartSchema.index({ restaurant: 1 });
cartSchema.index({ isActive: 1 });
cartSchema.index({ expiresAt: 1 });

// Virtual for item count
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// (Removed delivery address from cart; address captured at order time)

// Pre-save middleware to calculate totals
cartSchema.pre('save', async function(next) {
  try {
    // Calculate subtotal from items
    let subtotal = 0;
    
    // Populate menu items to get current prices
    await this.populate('items.menuItem');
    
    for (let item of this.items) {
      if (item.menuItem) {
        const itemPrice = item.menuItem.discountedPrice || item.menuItem.price;
        const customizationPrice = item.customizationOptions
          .filter(opt => opt.isSelected)
          .reduce((sum, opt) => sum + (opt.price || 0), 0);
        
        subtotal += (itemPrice + customizationPrice) * item.quantity;
      }
    }
    
    this.subtotal = subtotal;
    
    // Calculate tax (8%)
    this.tax = this.subtotal * 0.08;
    
    // Calculate delivery fee (will be set by restaurant settings)
    // For now, keep the existing delivery fee
    
    // Calculate total
    this.total = this.subtotal + this.tax + this.deliveryFee - this.discount;
    
    // Update last updated timestamp
    this.lastUpdated = new Date();
    // Keep cart active and extend expiration window on any save
    this.isActive = true;
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to add item to cart
cartSchema.methods.addItem = function(itemData) {
  // Remove any invalid entries to avoid null deref
  this.items = (this.items || []).filter(it => it && it.menuItem);

  const normalizeId = (v) => (v && v._id) ? v._id : v;
  const targetId = normalizeId(itemData.menuItem);

  const existingItemIndex = this.items.findIndex((item) => {
    const existingId = normalizeId(item.menuItem);
    return existingId && targetId && existingId.toString() === targetId.toString();
  });
  
  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += itemData.quantity;
  } else {
    // Add new item
    this.items.push({
      menuItem: targetId,
      quantity: itemData.quantity,
      specialInstructions: itemData.specialInstructions || '',
      customizationOptions: itemData.customizationOptions || []
    });
  }
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, newQuantity) {
  const itemIndex = this.items.findIndex(
    item => item._id.toString() === itemId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  if (newQuantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    // Update quantity
    this.items[itemIndex].quantity = newQuantity;
  }
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(
    item => item._id.toString() !== itemId.toString()
  );
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.subtotal = 0;
  this.tax = 0;
  this.deliveryFee = 0;
  this.discount = 0;
  this.total = 0;
  return this.save();
};

// Method to apply discount
cartSchema.methods.applyDiscount = function(discountAmount) {
  if (discountAmount > this.subtotal) {
    throw new Error('Discount cannot exceed subtotal');
  }
  
  this.discount = discountAmount;
  return this.save();
};

// Method to update delivery address
cartSchema.methods.updateDeliveryAddress = function(addressData) {
  this.deliveryAddress = { ...this.deliveryAddress, ...addressData };
  return this.save();
};

// Method to check if cart is empty
cartSchema.methods.isEmpty = function() {
  return this.items.length === 0;
};

// Method to check if cart has expired
cartSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to refresh cart expiration
cartSchema.methods.refreshExpiration = function() {
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this.save();
};

// Static method to find active cart by user
cartSchema.statics.findActiveByUser = function(userId) {
  return this.findOne({ 
    user: userId, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('items.menuItem');
};

// Static method to find cart by user and restaurant
cartSchema.statics.findByUserAndRestaurant = function(userId, restaurantId) {
  return this.findOne({ 
    user: userId, 
    restaurant: restaurantId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('items.menuItem');
};

// Static method to clean expired carts
cartSchema.statics.cleanExpiredCarts = function() {
  return this.updateMany(
    { expiresAt: { $lt: new Date() } },
    { isActive: false }
  );
};

// Static method to get cart statistics
cartSchema.statics.getCartStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCarts: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } },
        averageCartValue: { $avg: '$total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Cart', cartSchema);

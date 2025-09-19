const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
      sortOrder: {
      type: Number,
      default: 0,
      min: [0, 'Sort order cannot be negative']
    },
    // Rating fields
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    totalRatings: {
      type: Number,
      default: 0
    },

  chef: {
    type: String,
    trim: true,
    maxlength: [100, 'Chef name cannot exceed 100 characters']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  foodType: {
    type: String,
    enum: ['veg', 'non_veg', 'vegan'],
    default: 'veg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  offer: {
    type: String,
    trim: true,
    enum: [
      'Chef\'s Choice', 'Limited Time', 'Sweet Deal', 'Popular', 
      'Best Seller'
    ]
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  preparationTime: {
    type: Number, // in minutes
    default: 20,
    min: [1, 'Preparation time must be at least 1 minute']
  },
  calories: {
    type: Number,
    min: [0, 'Calories cannot be negative']
  },
  allergens: [String], // ['nuts', 'dairy', 'gluten', 'shellfish']
  dietaryTags: [String], // ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher']
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'spicy', 'extra_spicy'],
    default: 'medium'
  },
  ingredients: [String],
  nutritionalInfo: {
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  customizationOptions: [{
    name: String,
    price: Number,
    isRequired: Boolean
  }],
  maxQuantity: {
    type: Number,
    default: 10,
    min: [1, 'Max quantity must be at least 1']
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Min order quantity must be at least 1']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ categoryId: 1 });
menuItemSchema.index({ restaurant: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ isNewArrival: 1 });
menuItemSchema.index({ isTrending: 1 });

menuItemSchema.index({ price: 1 });
menuItemSchema.index({ sortOrder: 1 });
menuItemSchema.index({ rating: -1 });
menuItemSchema.index({ foodType: 1 });
menuItemSchema.index({ name: 'text', description: 'text' }); // Text search index

// Virtual for discounted price
menuItemSchema.virtual('discountedPrice').get(function() {
  if (this.discountPercentage > 0) {
    return this.price - (this.price * this.discountPercentage / 100);
  }
  return this.price;
});

// Virtual for final price
menuItemSchema.virtual('finalPrice').get(function() {
  return this.discountedPrice;
});





// Method to check if item is on discount
menuItemSchema.methods.isOnDiscount = function() {
  return this.discountPercentage > 0;
};

// Method to update rating
menuItemSchema.methods.updateRating = function(newRating) {
  this.totalRatings += 1;
  this.rating = ((this.rating * (this.totalRatings - 1)) + newRating) / this.totalRatings;
  return this.save();
};

// Static method to find items by category
menuItemSchema.statics.findByCategory = function(category) {
  return this.find({ category, isAvailable: true });
};

// Static method to find new arrival items
menuItemSchema.statics.findNewArrivalItems = function() {
  return this.find({ isNewArrival: true, isAvailable: true });
};

// Static method to find trending items
menuItemSchema.statics.findTrendingItems = function() {
  return this.find({ isTrending: true, isAvailable: true });
};

// Static method to find items by restaurant
menuItemSchema.statics.findByRestaurant = function(restaurantId) {
  return this.find({ restaurant: restaurantId, isAvailable: true }).sort({ category: 1, name: 1 });
};

// Static method to search items
menuItemSchema.statics.searchItems = function(searchTerm) {
  return this.find({
    $text: { $search: searchTerm },
    isAvailable: true
  }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('MenuItem', menuItemSchema);

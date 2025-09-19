const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  // User who gave the rating
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Order for which rating is given
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Restaurant being rated
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  
  // Individual item ratings
  itemRatings: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }],
  
  // Overall restaurant rating (calculated average)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Overall review for the restaurant
  overallReview: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Rating status
  status: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'rejected'],
    default: 'submitted'
  },
  
  // Whether user has been notified
  userNotified: {
    type: Boolean,
    default: false
  },
  
  // Whether restaurant has been notified
  restaurantNotified: {
    type: Boolean,
    default: false
  },
  
  // Whether admin has been notified
  adminNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ratingSchema.index({ user: 1, order: 1 }, { unique: true });
ratingSchema.index({ restaurant: 1, createdAt: -1 });
ratingSchema.index({ status: 1 });
ratingSchema.index({ userNotified: 1 });
ratingSchema.index({ restaurantNotified: 1 });

// Virtual for average item rating
ratingSchema.virtual('averageItemRating').get(function() {
  if (!this.itemRatings || this.itemRatings.length === 0) return 0;
  const total = this.itemRatings.reduce((sum, item) => sum + item.rating, 0);
  return total / this.itemRatings.length;
});

// Method to calculate and update overall rating
ratingSchema.methods.calculateOverallRating = function() {
  this.overallRating = this.averageItemRating;
  return this.overallRating;
};

// Pre-save middleware to calculate overall rating
ratingSchema.pre('save', function(next) {
  if (this.isModified('itemRatings')) {
    this.calculateOverallRating();
  }
  next();
});

module.exports = mongoose.model('Rating', ratingSchema);

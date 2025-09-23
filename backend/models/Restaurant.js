const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot exceed 100 characters']
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine type is required'],
    trim: true,
    enum: [
      'Indian', 'Italian', 'Chinese', 'Japanese', 'Mexican', 'Thai',
      'American', 'Mediterranean', 'French', 'Korean', 'Vietnamese',
      'Greek', 'Spanish', 'Lebanese', 'Turkish', 'Fusion', 'Pizza',
      'Biryani', 'Fast Food', 'Desserts', 'Beverages', 'Multi-Cuisine'
    ]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },

  totalOrders: {
    type: Number,
    default: 0
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
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    area: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    website: String
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  documents: {
    addressProofUrl: { type: String, trim: true },
    registrationDocs: [String]
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
  },
  deliveryInfo: {
    isDeliveryAvailable: {
      type: Boolean,
      default: true
    },
    isPickupAvailable: {
      type: Boolean,
      default: true
    },
    deliveryRadius: {
      type: Number, // in kilometers
      default: 10
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative']
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 0,
      min: [0, 'Free delivery threshold cannot be negative']
    },
    estimatedDeliveryTime: {
      type: Number, // in minutes
      default: 45
    }
  },
  images: {
    logo: String,
    banner: String,
    gallery: [String]
  },
  imageUrl: {
    type: String,
    trim: true,
    required:true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  features: [String], // ['wifi', 'parking', 'outdoor_seating', 'live_music']
  paymentMethods: [String], // ['cash', 'credit_card', 'debit_card', 'upi', 'wallet']
  minimumOrder: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order cannot be negative']
  },
  averagePreparationTime: {
    type: Number, // in minutes
    default: 25
  },
  isVegFriendly: {
    type: Boolean,
    default: true
  },
  isHalal: {
    type: Boolean,
    default: false
  },
  isKosher: {
    type: Boolean,
    default: false
  },
  certificates: [String], // ['fssai', 'iso', 'halal_certified']
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  specialOffers: [{
    title: String,
    description: String,
    discountPercentage: Number,
    validFrom: Date,
    validUntil: Date,
    isActive: { type: Boolean, default: true }
  }],
  // Delivery boys assigned to this restaurant
  deliveryBoys: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' }],
  // Password Reset
  resetOTP: {
    type: String
  },
  resetOTPExpiry: {
    type: Date
  },
  // Bank Details for Payment Distribution (Required for Restaurant)
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true,
      required: [true, 'Bank account number is required for restaurant']
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      required: [true, 'IFSC code is required for restaurant']
    },
    accountHolderName: {
      type: String,
      trim: true,
      required: [true, 'Account holder name is required for restaurant']
    },
    bankName: {
      type: String,
      trim: true,
      required: [true, 'Bank name is required for restaurant']
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  // Balance Tracking for Restaurant
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  lastPayout: {
    type: Date,
    default: null
  },
  nextPayoutDate: {
    type: Date,
    default: null
  },
  recentTransactions: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['order_payment', 'commission', 'payout', 'adjustment'],
      default: 'order_payment'
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    description: {
      type: String,
      default: ''
    }
  }],
  
  // Notification Preferences
  notificationPreferences: {
    push: {
      type: Boolean,
      default: true
    },
    orderUpdates: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: true
    },
    system: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
restaurantSchema.index({ status: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ 'location.city': 1 });
restaurantSchema.index({ 'location.area': 1 });
restaurantSchema.index({ 'location.state': 1 });

restaurantSchema.index({ totalOrders: -1 });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ name: 'text', description: 'text' }); // Text search index



// Virtual for formatted address
restaurantSchema.virtual('formattedAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state}`;
});

// Virtual for delivery fee calculation
restaurantSchema.virtual('calculatedDeliveryFee').get(function() {
  if (!this.deliveryInfo.isDeliveryAvailable) return null;
  return this.deliveryInfo.deliveryFee;
});

// Virtual for average rating
restaurantSchema.virtual('averageRating').get(function() {
  return this.totalRatings > 0 ? this.rating / this.totalRatings : 0;
});



// Method to increment order count
restaurantSchema.methods.incrementOrderCount = function() {
  this.totalOrders += 1;
  return this.save();
};

// Method to update rating
restaurantSchema.methods.updateRating = function(newRating) {
  this.totalRatings += 1;
  this.rating = ((this.rating * (this.totalRatings - 1)) + newRating) / this.totalRatings;
  return this.save();
};

// Method to check if restaurant is open
restaurantSchema.methods.isOpen = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().slice(0, 3);
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = this.operatingHours[day];
  if (!todayHours || !todayHours.isOpen) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Method to check if delivery is available to a location
restaurantSchema.methods.isDeliveryAvailableTo = function(latitude, longitude) {
  if (!this.deliveryInfo.isDeliveryAvailable) return false;
  
  // Check if restaurant has valid coordinates
  if (!this.location.coordinates || !this.location.coordinates.latitude || !this.location.coordinates.longitude) {
    return false; // Cannot calculate distance without coordinates
  }
  
  // Simple distance calculation (you might want to use a proper geolocation library)
  const distance = this.calculateDistance(
    this.location.coordinates.latitude,
    this.location.coordinates.longitude,
    latitude,
    longitude
  );
  
  return distance <= this.deliveryInfo.deliveryRadius;
};

// Method to calculate distance between two points
restaurantSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Static method to find restaurants by cuisine
restaurantSchema.statics.findByCuisine = function(cuisine) {
  return this.find({ cuisine, status: 'active' });
};

// Static method to find restaurants by city
restaurantSchema.statics.findByCity = function(city) {
  return this.find({ 'location.city': city, status: 'active' });
};

// Static method to find top rated restaurants
restaurantSchema.statics.findTopRated = function(limit = 10) {
  return this.find({ status: 'active' }).limit(limit);
};

// Static method to find restaurants near a location
restaurantSchema.statics.findNearby = function(latitude, longitude, maxDistance = 10) {
  return this.find({
    status: 'active',
    'location.coordinates': { $exists: true }
  }).then(restaurants => {
    // Filter restaurants by distance manually since we don't have geospatial index
    return restaurants.filter(restaurant => {
      if (!restaurant.location.coordinates || !restaurant.location.coordinates.latitude || !restaurant.location.coordinates.longitude) {
        return false;
      }
      
      const restaurantLat = restaurant.location.coordinates.latitude;
      const restaurantLng = restaurant.location.coordinates.longitude;
      
      const distance = restaurant.calculateDistance(latitude, longitude, restaurantLat, restaurantLng);
      return distance <= maxDistance;
    });
  });
};

module.exports = mongoose.model('Restaurant', restaurantSchema);

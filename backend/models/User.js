const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false 
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Loyalty Program
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  loyaltyTier: {
    type: String,
    enum: ['silver', 'gold', 'platinum'],
    default: 'silver'
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  // Referral Program
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  referralRewards: {
    type: Number,
    default: 0
  },
  // Preferences for Recommendations
  preferences: {
    cuisine: [{
      type: String,
      enum: ['indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american', 'mediterranean', 'other']
    }],
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'extra-hot'],
      default: 'medium'
    },
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']
    }],
    favoriteRestaurants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    }],
    favoriteDishes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }]
  },
  // Order History & Statistics
  totalOrders: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date
  },

  // Address Information
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    address: {
      street: String,
      landmark: String,
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
      }
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // Notification Preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: true
    },
    orderUpdates: {
      type: Boolean,
      default: true
    },
    system: {
      type: Boolean,
      default: true
    }
  },
  
  // Password Reset
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  },
  resetOTP: {
    type: String
  },
  resetOTPExpiry: {
    type: Date
  }
  ,
  // WhatsApp OTP fields
  waOtpCode: {
    type: String,
    select: false
  },
  waOtpExpiresAt: {
    type: Date,
    select: false
  },
  waOtpAttempts: {
    type: Number,
    default: 0,
    select: false
  }
}, {
  timestamps: true
});

userSchema.index({ phone: 1 });
userSchema.index({ status: 1 });
userSchema.index({ loyaltyTier: 1 });
userSchema.index({ totalSpent: -1 });
userSchema.index({ totalOrders: -1 });

userSchema.methods.calculateLoyaltyTier = function() {
  // Updated thresholds
  if (this.totalSpent >= 20000) return 'platinum';
  if (this.totalSpent >= 10000) return 'gold';
  if (this.totalSpent >= 3000) return 'silver';
  return 'silver';
};

userSchema.methods.updateLoyaltyTier = function() {
  const newTier = this.calculateLoyaltyTier();
  if (this.loyaltyTier !== newTier) {
    this.loyaltyTier = newTier;
    return true; // tier changed
  }
  return false; // tier unchanged
};

userSchema.methods.addLoyaltyPoints = function(amount) {
  const pointsToAdd = Math.floor(amount / 100);
  this.loyaltyPoints += pointsToAdd;
  this.totalSpent += amount;
  this.totalOrders += 1;
  this.lastOrderDate = new Date();
  this.averageOrderValue = this.totalSpent / this.totalOrders;
  
  this.updateLoyaltyTier();
  
  return pointsToAdd;
};

module.exports = mongoose.model('User', userSchema);

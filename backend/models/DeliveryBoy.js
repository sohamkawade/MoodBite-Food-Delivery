const mongoose = require("mongoose");

const deliveryBoySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    password: { type: String, select: false },
    vehicleNumber: { type: String, trim: true },
    licenseId: { type: String, trim: true },
    vehicleType: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    status: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "offline",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isDisabled: { type: Boolean, default: false },
    assignedRestaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    area: { type: String, trim: true },
    online: { type: Boolean, default: false },
    onlineExpiresAt: { type: Date }, // When online status expires
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date },
    },
    // Password Reset
    resetOTP: {
      type: String
    },
    resetOTPExpiry: {
      type: Date
    },
    // Bank Details for Payment Distribution (Required for Delivery Boy)
    bankDetails: {
      accountNumber: {
        type: String,
        trim: true,
        required: [true, 'Bank account number is required for delivery boy']
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'IFSC code is required for delivery boy']
      },
      accountHolderName: {
        type: String,
        trim: true,
        required: [true, 'Account holder name is required for delivery boy']
      },
      bankName: {
        type: String,
        trim: true,
        required: [true, 'Bank name is required for delivery boy']
      },
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    // Balance Tracking for Delivery Boy
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
        enum: ['delivery_fee', 'bonus', 'payout', 'adjustment'],
        default: 'delivery_fee'
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

  },
  { timestamps: true }
);

deliveryBoySchema.index({ status: 1 });
deliveryBoySchema.index({ assignedRestaurant: 1 });

module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);

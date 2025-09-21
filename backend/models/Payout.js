const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  // Razorpay payout details
  razorpayPayoutId: {
    type: String,
    required: true,
    unique: true
  },
  referenceId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Recipient details
  recipientType: {
    type: String,
    enum: ['restaurant', 'delivery_boy', 'admin'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  
  // Bank details used for payout
  bankDetails: {
    accountNumber: {
      type: String,
      required: true
    },
    ifscCode: {
      type: String,
      required: true
    },
    accountHolderName: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    }
  },
  
  // Payout details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  mode: {
    type: String,
    default: 'IMPS'
  },
  purpose: {
    type: String,
    default: 'payout'
  },
  narration: {
    type: String,
    required: true
  },
  
  // Order details
  orderId: {
    type: String,
    required: true
  },
  orderData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['queued', 'processing', 'processed', 'failed', 'cancelled'],
    default: 'queued'
  },
  razorpayStatus: {
    type: String,
    default: 'queued'
  },
  
  // Timestamps
  processedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  
  // Razorpay response
  razorpayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance (excluding unique fields which already have indexes)
payoutSchema.index({ recipientType: 1, recipientId: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ orderId: 1 });
payoutSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);

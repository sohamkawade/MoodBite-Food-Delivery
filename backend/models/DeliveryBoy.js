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
    }

  },
  { timestamps: true }
);

deliveryBoySchema.index({ status: 1 });
deliveryBoySchema.index({ assignedRestaurant: 1 });

module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);

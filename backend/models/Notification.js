const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  toRestaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  toDeliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' },
  type: { type: String, enum: ['system', 'order', 'approval', 'support'], default: 'system' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: {},
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);



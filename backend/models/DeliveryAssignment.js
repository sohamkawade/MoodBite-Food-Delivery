const mongoose = require('mongoose');

const deliveryAssignmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy', required: true, index: true },
  status: { type: String, enum: ['assigned', 'picked_up', 'on_the_way', 'completed', 'cancelled'], default: 'assigned' },
  etaMinutes: { type: Number },
  assignedAt: { type: Date, default: Date.now },
  pickedUpAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
}, { timestamps: true });

deliveryAssignmentSchema.index({ status: 1, restaurant: 1 });

module.exports = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);



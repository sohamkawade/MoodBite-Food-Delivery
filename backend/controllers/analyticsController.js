const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const DeliveryBoy = require('../models/DeliveryBoy');

const summary = async (req, res) => {
  try {
    const [totalRestaurants, activeDeliveryBoys, ordersToday, ordersWeek, ordersMonth, topRestaurants] = await Promise.all([
      Restaurant.countDocuments({ status: { $in: ['active', 'pending'] } }),
      DeliveryBoy.countDocuments({ approvalStatus: 'approved', status: { $in: ['available', 'busy'] } }),
      Order.countDocuments({ createdAt: { $gte: new Date(new Date().toDateString()) } }),
      Order.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } }),
      Order.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } }),
      Order.aggregate([
        { $match: {} },
        { $group: { _id: '$restaurant', sales: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { sales: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
        { $unwind: '$restaurant' },
        { $project: { _id: 0, restaurantId: '$restaurant._id', name: '$restaurant.name', sales: 1, orders: 1 } }
      ])
    ]);

    res.json({ success: true, data: { totalRestaurants, activeDeliveryBoys, orders: { today: ordersToday, week: ordersWeek, month: ordersMonth }, topRestaurants } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load analytics' });
  }
};

module.exports = { summary };



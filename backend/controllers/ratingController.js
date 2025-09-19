const Rating = require('../models/Rating');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

// Submit rating for delivered order
const submitRating = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemRatings, overallReview } = req.body;
    const userId = req.user._id;
    const order = await Order.findById(orderId)
      .populate('restaurant')
      .populate('items.menuItem')
      .populate('customer');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is logged in as a regular user (not admin, restaurant, etc.)
    if (req.user.type !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only regular users can rate orders'
      });
    }

    if (!order.customer || order.customer._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate your own orders'
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate delivered orders'
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({ order: orderId, user: userId });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this order'
      });
    }

    // Validate item ratings
    if (!itemRatings || !Array.isArray(itemRatings) || itemRatings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Item ratings are required'
      });
    }

    // Validate each item rating
    for (const itemRating of itemRatings) {
      if (!itemRating.menuItem || !itemRating.rating) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item rating data'
        });
      }

      if (itemRating.rating < 1 || itemRating.rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Check if menu item exists in the order
      const orderItem = order.items.find(item => 
        item.menuItem._id.toString() === itemRating.menuItem
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: 'Menu item not found in order'
        });
      }
    }

    // Calculate overall rating
    const totalRating = itemRatings.reduce((sum, item) => sum + item.rating, 0);
    const overallRating = totalRating / itemRatings.length;

    // Create rating
    const rating = new Rating({
      user: userId,
      order: orderId,
      restaurant: order.restaurant?._id || order.restaurant,
      itemRatings,
      overallRating,
      overallReview
    });

    await rating.save();

    // Update restaurant rating
    if (order.restaurant && typeof order.restaurant.updateRating === 'function') {
      await order.restaurant.updateRating(overallRating);
    } else {
      // If restaurant is not populated, fetch it and update
      const restaurant = await Restaurant.findById(order.restaurant);
      if (restaurant) {
        await restaurant.updateRating(overallRating);
      }
    }

    // Update individual menu item ratings
    for (const itemRating of itemRatings) {
      const menuItem = await MenuItem.findById(itemRating.menuItem);
      if (menuItem) {
        await menuItem.updateRating(itemRating.rating);
      }
    }

    // Populate the rating with user and restaurant details
    await rating.populate('user', 'firstName lastName');
    await rating.populate('restaurant', 'name');
    await rating.populate('itemRatings.menuItem', 'name');

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: rating
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
};

// Get rating for a specific order
const getOrderRating = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const rating = await Rating.findOne({ order: orderId, user: userId })
      .populate('user', 'firstName lastName')
      .populate('restaurant', 'name')
      .populate('itemRatings.menuItem', 'name image');

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.json({
      success: true,
      data: rating
    });

  } catch (error) {
    console.error('Error getting order rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rating',
      error: error.message
    });
  }
};

// Get restaurant ratings (for restaurant owners)
const getRestaurantRatings = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    // Check if user is logged in as a restaurant owner
    if (req.user.type !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: 'Only restaurant owners can view restaurant ratings'
      });
    }

    // Check if the restaurant ID matches the authenticated restaurant user
    if (req.user._id.toString() !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view ratings for your own restaurant'
      });
    }

    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ restaurant: restaurantId })
      .populate('user', 'firstName lastName')
      .populate('itemRatings.menuItem', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Rating.countDocuments({ restaurant: restaurantId });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        restaurantStats: {
          averageRating: restaurant.averageRating,
          totalRatings: restaurant.totalRatings
        }
      }
    });

  } catch (error) {
    console.error('Error getting restaurant ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get restaurant ratings',
      error: error.message
    });
  }
};

// Get user's rating history
const getUserRatings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ user: userId })
      .populate('restaurant', 'name imageUrl')
      .populate('itemRatings.menuItem', 'name image')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Rating.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting user ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user ratings',
      error: error.message
    });
  }
};

// Get rating statistics (for admin)
const getRatingStats = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    let query = {};
    if (restaurantId) {
      query.restaurant = restaurantId;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Rating.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          ratingDistribution: {
            $push: '$overallRating'
          }
        }
      }
    ]);

    // Calculate rating distribution
    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach(rating => {
        const roundedRating = Math.round(rating);
        if (distribution[roundedRating] !== undefined) {
          distribution[roundedRating]++;
        }
      });
    }

    res.json({
      success: true,
      data: {
        totalRatings: stats.length > 0 ? stats[0].totalRatings : 0,
        averageRating: stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0,
        distribution
      }
    });

  } catch (error) {
    console.error('Error getting rating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rating statistics',
      error: error.message
    });
  }
};

// Check if order can be rated
const canRateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.customer || order.customer._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only check your own orders'
      });
    }

    const existingRating = await Rating.findOne({ order: orderId, user: userId });

    res.json({
      success: true,
      data: {
        canRate: order.status === 'delivered' && !existingRating,
        hasRated: !!existingRating,
        orderStatus: order.status
      }
    });

  } catch (error) {
    console.error('Error checking if order can be rated:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check rating eligibility',
      error: error.message
    });
  }
};

module.exports = {
  submitRating,
  getOrderRating,
  getRestaurantRatings,
  getUserRatings,
  getRatingStats,
  canRateOrder
};

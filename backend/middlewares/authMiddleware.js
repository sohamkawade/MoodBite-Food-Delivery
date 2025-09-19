const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const DeliveryBoy = require('../models/DeliveryBoy');
const Restaurant = require('../models/Restaurant');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    
    // Try to find user first
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = { _id: user._id, email: user.email, type: 'user' };
      return next();
    }

    // If not a user, try to find admin
    const admin = await Admin.findById(decoded.id).select('-password');
    if (admin) {
      req.user = { _id: admin._id, email: admin.email, type: 'admin' };
      return next();
    }

    // If not admin, try delivery boy
    const rider = await DeliveryBoy.findById(decoded.id).select('-password');
    if (rider) {
      req.user = { _id: rider._id, type: 'delivery' };
      return next();
    }

    // If not delivery boy, try restaurant
    const restaurant = await Restaurant.findById(decoded.id).select('-password');
    if (restaurant) {
      req.user = { _id: restaurant._id, type: 'restaurant' };
      return next();
    }

    // Neither user, admin, delivery, nor restaurant found
    return res.status(401).json({
      success: false,
      message: 'Invalid token. User not found.'
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware specifically for admin authentication
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }

    if (admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    req.user = {
      _id: admin._id,
      email: admin.email,
      type: 'admin',
      role: admin.role,
      permissions: admin.permissions
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware specifically for restaurant authentication
const authenticateRestaurant = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const restaurant = await Restaurant.findById(decoded.id).select('-password');

    if (!restaurant) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Restaurant authentication required.'
      });
    }

    if (restaurant.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Restaurant account is not active. Please contact admin for assistance.'
      });
    }

    req.user = {
      _id: restaurant._id,
      email: restaurant.contact.email,
      type: 'restaurant',
      name: restaurant.name
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = { authenticate, authenticateAdmin, authenticateRestaurant };

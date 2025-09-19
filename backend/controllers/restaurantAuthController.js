const bcrypt = require('bcryptjs');
const Restaurant = require('../models/Restaurant');
const { generateToken } = require('../utils/generateToken');
const MenuItem = require('../models/MenuItem');
const { sendPasswordResetOTPEmail, generateOTP } = require('../utils/emailService');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

      
    // Try exact match first
    let restaurant = await Restaurant.findOne({ 'contact.email': email }).select('+password');
    
    // If not found, try case-insensitive search
    if (!restaurant) {
      restaurant = await Restaurant.findOne({ 
        'contact.email': { $regex: new RegExp(`^${email}$`, 'i') } 
      }).select('+password');
    }
    
    
    if (!restaurant) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if password exists
    if (!restaurant.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account setup incomplete. Please contact support.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, restaurant.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Handle status like delivery flow
    if (restaurant.status === 'pending') {
      return res.status(200).json({
        success: true,
        message: 'Login successful! Your account is pending approval. You will be notified once approved.',
        data: { 
          restaurant: { 
            _id: restaurant._id, 
            name: restaurant.name, 
            email: restaurant.contact.email, 
            status: restaurant.status 
          }, 
          token: null, 
          requiresApproval: true 
        }
      });
    }
    if (restaurant.status === 'rejected') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account has been rejected. Please contact admin for more information.' 
      });
    }
    if (restaurant.status === 'inactive' || restaurant.status === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is currently inactive. Please contact admin for more information.' 
      });
    }

    // Status is active here; continue to token generation

    // Generate token
    const token = generateToken({ 
      _id: restaurant._id, 
      email: restaurant.contact.email,
      type: 'restaurant'
    });

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          email: restaurant.contact.email,
          status: restaurant.status,
          cuisine: restaurant.cuisine,
          location: restaurant.location,
          contact: restaurant.contact,
          imageUrl: restaurant.imageUrl,
          description: restaurant.description
        }
      }
    });

  } catch (error) {
    console.error('Restaurant login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user._id)
      .select('-password');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      data: { restaurant }
    });

  } catch (error) {
    console.error('Get restaurant profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, cuisine, location, contact, description, imageUrl, openingTime, closingTime } = req.body;
    
    const restaurant = await Restaurant.findById(req.user._id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Update fields if provided
    if (name) restaurant.name = name;
    if (cuisine) restaurant.cuisine = cuisine;
    if (location) {
      if (location.address) restaurant.location.address = location.address;
      if (location.area) restaurant.location.area = location.area;
      if (location.city) restaurant.location.city = location.city;
      if (location.state) restaurant.location.state = location.state;
      if (location.zipCode) restaurant.location.zipCode = location.zipCode;
      if (location.country) restaurant.location.country = location.country;
    }
    if (contact) {
      if (contact.phone) restaurant.contact.phone = contact.phone;
      if (contact.website) restaurant.contact.website = contact.website;
    }
    if (description !== undefined) restaurant.description = description;
    if (imageUrl !== undefined) restaurant.imageUrl = imageUrl;

    // Update operating hours for all days if provided
    if (openingTime || closingTime) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach(day => {
        if (openingTime) restaurant.operatingHours[day].open = openingTime;
        if (closingTime) restaurant.operatingHours[day].close = closingTime;
      });
    }

    await restaurant.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { restaurant }
    });

  } catch (error) {
    console.error('Update restaurant profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Restaurant logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  logout,
  listMenuItems: async (req, res) => {
    try {
      const items = await MenuItem.find({ restaurant: req.user._id }).sort({ createdAt: -1 });
      res.json({ success: true, data: items });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
    }
  },
  createMenuItem: async (req, res) => {
    try {
      const data = req.body || {};
      const item = new MenuItem({
        name: data.name,
        category: data.category,
        price: data.price,
        description: data.description || '',
        image: data.imageUrl || data.image || '',
        restaurant: req.user._id,
        isAvailable: data.isAvailable !== false,
        preparationTime: data.preparationTime || 20,
        calories: data.calories || 0,
        stockQuantity: data.stockQuantity || 0,
        sortOrder: data.sortOrder || 0,
        discountPercentage: data.discountPercentage || 0,
        isNewArrival: data.isNewArrival || false,
        isTrending: data.isTrending || false,
        foodType: data.foodType || 'veg',
        allergens: data.allergens ? (Array.isArray(data.allergens) ? data.allergens : String(data.allergens).split(',').map(s => s.trim()).filter(Boolean)) : [],
        spiceLevel: data.spiceLevel === 'hot' ? 'spicy' : (data.spiceLevel || 'medium')
      });
      await item.save();
      res.status(201).json({ success: true, message: 'Menu item created', data: item });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to create menu item', error: e.message });
    }
  },
  updateMenuItem: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body || {};
      const item = await MenuItem.findOne({ _id: id, restaurant: req.user._id });
      if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
      if (data.name !== undefined) item.name = data.name;
      if (data.category !== undefined) item.category = data.category;
      if (data.price !== undefined) item.price = data.price;
      if (data.description !== undefined) item.description = data.description;
      if (data.imageUrl !== undefined) item.image = data.imageUrl;
      if (data.image !== undefined) item.image = data.image;
      if (data.isAvailable !== undefined) item.isAvailable = data.isAvailable;
      if (data.preparationTime !== undefined) item.preparationTime = data.preparationTime;
      if (data.calories !== undefined) item.calories = data.calories;
      if (data.stockQuantity !== undefined) item.stockQuantity = data.stockQuantity;
      if (data.sortOrder !== undefined) item.sortOrder = data.sortOrder;
      if (data.discountPercentage !== undefined) item.discountPercentage = data.discountPercentage;
      if (data.isNewArrival !== undefined) item.isNewArrival = data.isNewArrival;
      if (data.isTrending !== undefined) item.isTrending = data.isTrending;
      if (data.foodType !== undefined) item.foodType = data.foodType;
      if (data.allergens !== undefined) item.allergens = Array.isArray(data.allergens) ? data.allergens : String(data.allergens).split(',').map(s => s.trim()).filter(Boolean);
      if (data.spiceLevel !== undefined) item.spiceLevel = data.spiceLevel === 'hot' ? 'spicy' : data.spiceLevel;
      await item.save();
      res.json({ success: true, message: 'Menu item updated', data: item });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to update menu item', error: e.message });
    }
  },
  deleteMenuItem: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await MenuItem.findOneAndDelete({ _id: id, restaurant: req.user._id });
      if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
      res.json({ success: true, message: 'Menu item deleted' });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to delete menu item' });
    }
  },

  // Forgot Password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const restaurant = await Restaurant.findOne({ 'contact.email': email });
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant with this email does not exist'
        });
      }

      // Generate OTP for password reset
      const otp = generateOTP();
      
      // Store OTP in restaurant document with 5-minute expiry
      restaurant.resetOTP = otp;
      restaurant.resetOTPExpiry = new Date(Date.now() + 300000); // 5 minutes from now
      await restaurant.save();

      // Send password reset OTP email
      const emailResult = await sendPasswordResetOTPEmail(email, restaurant.restaurantName, otp, 'restaurant');
      
      if (emailResult.success) {
        res.status(200).json({
          success: true,
          message: 'Password reset OTP sent to your email'
        });
      } else {
        
        res.status(200).json({
          success: true,
          message: 'Password reset OTP sent to your email (check console for development)'
        });
      }
    } catch (error) {
      console.error('Restaurant forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Verify OTP
  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required'
        });
      }

      const restaurant = await Restaurant.findOne({
        'contact.email': email,
        resetOTP: otp,
        resetOTPExpiry: { $gt: new Date() }
      });

      if (!restaurant) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });
    } catch (error) {
      console.error('Restaurant OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Reset Password
  resetPassword: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email, OTP and new password are required'
        });
      }

      const restaurant = await Restaurant.findOne({
        'contact.email': email,
        resetOTP: otp,
        resetOTPExpiry: { $gt: new Date() }
      });

      if (!restaurant) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset OTP
      restaurant.password = hashedPassword;
      restaurant.resetOTP = undefined;
      restaurant.resetOTPExpiry = undefined;
      await restaurant.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Restaurant reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendPasswordResetOTPEmail, generateOTP } = require('../utils/emailService');

const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: 'User with this phone number already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            status: 'active',
            joinDate: new Date(),
            lastLogin: new Date()
        });

        await user.save();

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    status: user.status,
                    joinDate: user.joinDate
                },
                token
            }
        });

    } catch (error) {
        console.error('Signup error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (user.status === 'suspended') {
            return res.status(401).json({
                success: false,
                message: 'Account is suspended. Please contact support.'
            });
        }

        // If user was inactive, set them back to active
        if (user.status === 'inactive') {
            user.status = 'active';
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    status: user.status,
                    loyaltyTier: user.loyaltyTier,
                    role: user.loyaltyTier === 'platinum' ? 'VIP Customer' : user.loyaltyTier === 'gold' ? 'Premium Customer' : 'Customer',
                    joinDate: user.joinDate,
                    lastLogin: user.lastLogin
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          status: user.status,
          loyaltyTier: user.loyaltyTier,
          role: user.loyaltyTier === 'platinum' ? 'VIP Customer' : user.loyaltyTier === 'gold' ? 'Premium Customer' : 'Customer',
          joinDate: user.joinDate,
          lastLogin: user.lastLogin,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyTier: user.loyaltyTier,
          totalSpent: user.totalSpent,
          referralCode: user.referralCode,
          referralCount: user.referralCount,
          referralRewards: user.referralRewards,
          preferences: user.preferences,
          totalOrders: user.totalOrders,
          averageOrderValue: user.averageOrderValue,
          lastOrderDate: user.lastOrderDate,
          addresses: user.addresses,
          notifications: user.notifications
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      preferences,
      addresses,
      notifications
    } = req.body;
    
    const updateData = {};

    // Update basic fields
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (addresses !== undefined) updateData.addresses = addresses;
    if (notifications !== undefined) updateData.notifications = notifications;

    // Phone number validation
    if (phone) {
      const existingPhone = await User.findOne({
        phone,
        _id: { $ne: req.user._id }
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
      updateData.phone = phone;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          status: user.status,
          joinDate: user.joinDate,
          lastLogin: user.lastLogin,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyTier: user.loyaltyTier,
          totalSpent: user.totalSpent,
          referralCode: user.referralCode,
          referralCount: user.referralCount,
          referralRewards: user.referralRewards,
          preferences: user.preferences,
          totalOrders: user.totalOrders,
          averageOrderValue: user.averageOrderValue,
          lastOrderDate: user.lastOrderDate,
          addresses: user.addresses,
          notifications: user.notifications
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedNewPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Simulate adding an order for testing loyalty system
const addTestOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid order amount'
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add loyalty points and update stats
        const pointsEarned = user.addLoyaltyPoints(amount);
        await user.save();

        res.json({
            success: true,
            message: 'Test order added successfully',
            data: {
                orderAmount: amount,
                pointsEarned,
                newLoyaltyPoints: user.loyaltyPoints,
                newLoyaltyTier: user.loyaltyTier,
                totalSpent: user.totalSpent,
                totalOrders: user.totalOrders,
                averageOrderValue: user.averageOrderValue
            }
        });

    } catch (error) {
        console.error('Add test order error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Logout user and set status to inactive
const logout = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Set user status to inactive
        user.status = 'inactive';
        await user.save();

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Admin: list users
const listUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: { users } });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Admin: update user basic fields
const adminUpdateUser = async (req, res) => {
  try {
    const { name, email, phone, role, status } = req.body;
    const update = {};
    if (name !== undefined) update.fullName = name; // optional depending on schema
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (role !== undefined) update.role = role;
    if (status !== undefined) update.status = status.toLowerCase();
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated', data: { user } });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// Admin: suspend user
const adminSuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.status = 'suspended';
    await user.save();
    res.json({ success: true, message: 'User suspended' });
  } catch (error) {
    console.error('Admin suspend user error:', error);
    res.status(500).json({ success: false, message: 'Failed to suspend user' });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Generate OTP for password reset
        const otp = generateOTP();
        
        // Store OTP in user document with 5-minute expiry
        user.resetOTP = otp;
        user.resetOTPExpiry = new Date(Date.now() + 300000); // 5 minutes from now
        await user.save();

        // Send password reset OTP email
        const emailResult = await sendPasswordResetOTPEmail(email, user.firstName, otp, 'user');
        
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
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpiry: { $gt: new Date() }
        });

        if (!user) {
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
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP and new password are required'
            });
        }

        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset OTP
        user.password = hashedPassword;
        user.resetOTP = undefined;
        user.resetOTPExpiry = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    signup,
    login,
    getProfile,
    updateProfile,
    changePassword,
    addTestOrder,
    logout,
    listUsers,
    adminUpdateUser,
    adminSuspendUser,
    forgotPassword,
    verifyOTP,
    resetPassword
};

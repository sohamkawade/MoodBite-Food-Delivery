const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const DeliveryBoy = require('../models/DeliveryBoy');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { generateToken } = require('../utils/generateToken');
const { ADMIN_VERIFICATION_CODE } = require('../config/keys');
const { sendPasswordResetOTPEmail, generateOTP } = require('../utils/emailService');

const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, adminCode } = req.body;

        if (adminCode !== ADMIN_VERIFICATION_CODE) {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin verification code'
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }

        // Check if phone number already exists
        const existingPhone = await Admin.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this phone number already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin account
        const admin = new Admin({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: 'admin', 
            status: 'active'
        });

        await admin.save();

        // Generate token
        const token = generateToken(admin);

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            data: {
                admin: {
                    _id: admin._id,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    email: admin.email,
                    phone: admin.phone,
                    role: admin.role,
                    status: admin.status,
                    permissions: admin.permissions
                },
                token
            }
        });

    } catch (error) {
        console.error('Admin signup error:', error);

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

        // Find admin and include password
        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (admin.isLocked()) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
            });
        }

        // Check if account is inactive
        if (admin.status === 'inactive') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive. Please contact administrator.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            // Increment login attempts
            await admin.incLoginAttempts();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }



        // Reset login attempts on successful login
        if (admin.loginAttempts > 0) {
            await admin.resetLoginAttempts();
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate token
        const token = generateToken(admin);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                admin: {
                    _id: admin._id,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    email: admin.email,
                    phone: admin.phone,
                    role: admin.role,
                    status: admin.status,
                    permissions: admin.permissions,
                    lastLogin: admin.lastLogin
                },
                token
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.json({
            success: true,
            data: {
                admin: {
                    _id: admin._id,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    email: admin.email,
                    phone: admin.phone,
                    role: admin.role,
                    status: admin.status,
                    permissions: admin.permissions,
                    lastLogin: admin.lastLogin,
                    createdAt: admin.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        
        const updateData = {};

        // Update basic fields
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;

        // Phone number validation
        if (phone) {
            const existingPhone = await Admin.findOne({
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

        const admin = await Admin.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                admin: {
                    _id: admin._id,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    email: admin.email,
                    phone: admin.phone,
                    role: admin.role,
                    status: admin.status,
                    permissions: admin.permissions,
                    lastLogin: admin.lastLogin
                }
            }
        });

    } catch (error) {
        console.error('Update admin profile error:', error);

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

        // Get admin with password
        const admin = await Admin.findById(req.user._id).select('+password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        admin.password = hashedNewPassword;
        await admin.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change admin password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const logout = async (req, res) => {
    try {
        // In a real application, you might want to blacklist the token
        // For now, we'll just send a success response
        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Admin logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        // Get counts for all entities
        const [
            totalRestaurants,
            totalUsers,
            totalDeliveryBoys,
            totalOrders,
            totalMenuItems,
            pendingRestaurants,
            pendingDeliveryBoys,
            recentOrders
        ] = await Promise.all([
            Restaurant.countDocuments(),
            User.countDocuments(),
            DeliveryBoy.countDocuments(),
            Order.countDocuments(),
            MenuItem.countDocuments(),
            Restaurant.countDocuments({ status: 'pending' }),
            DeliveryBoy.countDocuments({ approvalStatus: 'pending' }),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('customer', 'firstName lastName')
                .populate('restaurant', 'name')
                .populate('assignedDeliveryBoy', 'name')
        ]);

        // Calculate revenue stats
        const revenueStats = await Order.aggregate([
            { $match: { status: 'delivered' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' }
                }
            }
        ]);

        // Get status distribution
        const orderStatusDistribution = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get restaurant status distribution
        const restaurantStatusDistribution = await Restaurant.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                counts: {
                    totalRestaurants,
                    totalUsers,
                    totalDeliveryBoys,
                    totalOrders,
                    totalMenuItems,
                    pendingRestaurants,
                    pendingDeliveryBoys
                },
                revenue: revenueStats[0] || { totalRevenue: 0, averageOrderValue: 0 },
                orderStatusDistribution,
                restaurantStatusDistribution,
                recentOrders
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getRestaurantManagement = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { cuisine: { $regex: search, $options: 'i' } },
                { 'contact.email': { $regex: search, $options: 'i' } }
            ];
        }

        const restaurants = await Restaurant.find(query)
            .select('name cuisine status rating totalOrders totalRatings contact location createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Restaurant.countDocuments(query);

        res.json({
            success: true,
            data: {
                restaurants,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get restaurant management error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getDeliveryBoyManagement = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        if (status && status !== 'all') {
            query.approvalStatus = status;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const deliveryBoys = await DeliveryBoy.find(query)
            .select('name email phone status approvalStatus vehicleType vehicleNumber area city state zipCode ratings online createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await DeliveryBoy.countDocuments(query);

        res.json({
            success: true,
            data: {
                deliveryBoys,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get delivery boy management error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getUserManagement = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('firstName lastName email phone status loyaltyTier totalSpent totalOrders joinDate lastLogin addresses preferences')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get user management error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getOrderManagement = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .populate('customer', 'firstName lastName email phone')
            .populate('restaurant', 'name')
            .populate('assignedDeliveryBoy', 'name phone')
            .select('orderId status totalAmount orderType deliveryAddress createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get order management error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, status } = req.body;

        // Parse name into firstName and lastName
        const nameParts = (name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Map role to loyaltyTier
        let loyaltyTier = 'silver';
        if (role === 'VIP Customer') loyaltyTier = 'platinum';
        else if (role === 'Premium Customer') loyaltyTier = 'gold';

        // Map status
        let userStatus = 'active';
        if (status === 'Inactive') userStatus = 'inactive';
        else if (status === 'Suspended') userStatus = 'inactive';

        const updateData = {
            firstName,
            lastName,
            email,
            phone,
            loyaltyTier,
            status: userStatus
        };

        const user = await User.findByIdAndUpdate(id, updateData, { new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Suspend user
const suspendUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User suspended successfully',
            data: user
        });

    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
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

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin with this email does not exist'
            });
        }

        // Generate OTP for password reset
        const otp = generateOTP();
        
        // Store OTP in admin document with 5-minute expiry
        admin.resetOTP = otp;
        admin.resetOTPExpiry = new Date(Date.now() + 300000); // 5 minutes from now
        await admin.save();

        // Send password reset OTP email
        const emailResult = await sendPasswordResetOTPEmail(email, admin.firstName, otp, 'admin');
        
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
        console.error('Admin forgot password error:', error);
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

        const admin = await Admin.findOne({
            email,
            resetOTP: otp,
            resetOTPExpiry: { $gt: new Date() }
        });

        if (!admin) {
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
        console.error('Admin OTP verification error:', error);
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

        const admin = await Admin.findOne({
            email,
            resetOTP: otp,
            resetOTPExpiry: { $gt: new Date() }
        });

        if (!admin) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset OTP
        admin.password = hashedPassword;
        admin.resetOTP = undefined;
        admin.resetOTPExpiry = undefined;
        await admin.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Admin reset password error:', error);
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
    logout,
    getDashboardStats,
    getRestaurantManagement,
    getDeliveryBoyManagement,
    getUserManagement,
    getOrderManagement,
    updateUser,
    suspendUser,
    forgotPassword,
    verifyOTP,
    resetPassword
};

const bcrypt = require('bcryptjs');
const DeliveryBoy = require('../models/DeliveryBoy');
const { generateToken } = require('../utils/generateToken');
const { sendPasswordResetOTPEmail, generateOTP } = require('../utils/emailService');

const getCoordinatesFromAddress = async (address) => {
  try {
    const cityStateAddress = address.split(',').slice(-3).join(',').trim();
    
    const encodedAddress = encodeURIComponent(cityStateAddress);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in`, {
      headers: {
        'User-Agent': 'MoodBite-Delivery-App/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
    }
    
    const fullEncodedAddress = encodeURIComponent(address);
    const fullResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fullEncodedAddress}&limit=1&countrycodes=in`, {
      headers: {
        'User-Agent': 'MoodBite-Delivery-App/1.0'
      }
    });
    
    if (fullResponse.ok) {
      const fullData = await fullResponse.json();
      
      if (fullData && fullData.length > 0) {
        return {
          latitude: parseFloat(fullData[0].lat),
          longitude: parseFloat(fullData[0].lon)
        };
      }
    }
    
    const cityMatch = address.match(/([^,]+),\s*([^,]+),\s*India$/);
    if (cityMatch) {
      const cityName = cityMatch[1].trim();
      
      const cityEncodedAddress = encodeURIComponent(cityName + ', India');
      const cityResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityEncodedAddress}&limit=1&countrycodes=in`, {
        headers: {
          'User-Agent': 'MoodBite-Delivery-App/1.0'
        }
      });
      
      if (cityResponse.ok) {
        const cityData = await cityResponse.json();
        
        if (cityData && cityData.length > 0) {
          return {
            latitude: parseFloat(cityData[0].lat),
            longitude: parseFloat(cityData[0].lon)
          };
        }
      }
    }
    

    const majorCities = {
      'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
      'Delhi': { latitude: 28.7041, longitude: 77.1025 },
      'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
      'Hyderabad': { latitude: 17.3850, longitude: 78.4867 },
      'Chennai': { latitude: 13.0827, longitude: 80.2707 },
      'Kolkata': { latitude: 22.5726, longitude: 88.3639 },
      'Pune': { latitude: 18.5204, longitude: 73.8567 },
      'Ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
      'Jaipur': { latitude: 26.9124, longitude: 75.7873 },
      'Surat': { latitude: 21.1702, longitude: 72.8311 },
      'Lucknow': { latitude: 26.8467, longitude: 80.9462 },
      'Kanpur': { latitude: 26.4499, longitude: 80.3319 },
      'Nagpur': { latitude: 21.1458, longitude: 79.0882 },
      'Indore': { latitude: 22.7196, longitude: 75.8577 },
      'Thane': { latitude: 19.2183, longitude: 72.9781 },
      'Bhopal': { latitude: 23.2599, longitude: 77.4126 },
      'Visakhapatnam': { latitude: 17.6868, longitude: 83.2185 },
      'Pimpri-Chinchwad': { latitude: 18.6298, longitude: 73.7997 },
      'Patna': { latitude: 25.5941, longitude: 85.1376 },
      'Vadodara': { latitude: 22.3072, longitude: 73.1812 }
    };
    

    for (const [cityName, coords] of Object.entries(majorCities)) {
      if (address.toLowerCase().includes(cityName.toLowerCase())) {
        return coords;
      }
    }
    
    return { latitude: undefined, longitude: undefined };
    
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return { latitude: undefined, longitude: undefined };
  }
};

const register = async (req, res) => {
  try {
    console.log('Delivery registration request received:', req.body);
    
    const { name, phone, email, password, vehicleNumber, licenseId, vehicleType, area, address, city, state, zipCode, restaurantId, bankDetails } = req.body;
    
    console.log('Extracted data:', { name, phone, email, bankDetails });
    
    if (!name || !phone || !password) return res.status(400).json({ success: false, message: 'Name, phone and password are required' });
    
    // Validate bank details
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName || !bankDetails.bankName) {
      console.log('Bank details validation failed:', bankDetails);
      return res.status(400).json({ success: false, message: 'Bank details are required for delivery boy registration' });
    }
    
    console.log('Checking for existing delivery boy...');
    const exists = await DeliveryBoy.findOne({ $or: [{ phone }, { email }] });
    if (exists) {
      console.log('Delivery boy already exists');
      return res.status(400).json({ success: false, message: 'Account already exists with phone/email' });
    }
    
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    
    const fullAddress = `${address || ''}, ${area || ''}, ${city}, ${state}, ${zipCode || ''}, India`;
    console.log('Getting coordinates for address:', fullAddress);
    
    const coordinates = await getCoordinatesFromAddress(fullAddress);
    console.log('Coordinates received:', coordinates);
    
    const riderData = {
      name, 
      phone, 
      email, 
      password: hashed, 
      vehicleNumber, 
      licenseId,
      vehicleType,
      area,
      address,
      city,
      state,
      zipCode,
      bankDetails: {
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode.toUpperCase(),
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName,
        isVerified: false
      },
      assignedRestaurant: restaurantId || null, 
      approvalStatus: 'pending', 
      status: 'offline', 
      online: false,
      ...(coordinates.latitude && coordinates.longitude ? {
        location: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          updatedAt: new Date()
        }
      } : {})
    };
    
    console.log('Creating delivery boy with data:', riderData);
    const rider = new DeliveryBoy(riderData);
    await rider.save();
    console.log('Delivery boy saved successfully:', rider._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Registration submitted. Pending approval.', 
      data: { 
        id: rider._id,
        coordinates: coordinates.latitude && coordinates.longitude ? coordinates : null
      } 
    });
  } catch (e) {
    console.error('Delivery boy registration error:', e);
    console.error('Error details:', e.message);
    console.error('Error stack:', e.stack);
    res.status(500).json({ success: false, message: 'Failed to register' });
  }
};

const login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    const rider = await DeliveryBoy.findOne(phone ? { phone } : { email }).select('+password');
    if (!rider) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    const ok = await bcrypt.compare(password, rider.password || '');
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    if (rider.approvalStatus === 'pending') {
      return res.status(200).json({ 
        success: true, 
        message: 'Login successful, but account is pending approval',
        data: { 
          rider: { 
            _id: rider._id, 
            name: rider.name, 
            phone: rider.phone, 
            status: rider.status, 
            area: rider.area, 
            assignedRestaurant: rider.assignedRestaurant,
            approvalStatus: rider.approvalStatus
          }, 
          token: null,
          requiresApproval: true
        } 
      });
    }
    
    if (rider.approvalStatus === 'rejected') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account has been rejected. Please contact admin for more information.' 
      });
    }
    

    const token = generateToken({ _id: rider._id, email: rider.email, type: 'delivery' });
    res.json({ 
      success: true, 
      data: { 
        deliveryBoy: { 
          _id: rider._id, 
          name: rider.name, 
          phone: rider.phone, 
          email: rider.email,
          status: rider.status, 
          area: rider.area, 
          assignedRestaurant: rider.assignedRestaurant,
          approvalStatus: rider.approvalStatus,
          vehicleType: rider.vehicleType,
          vehicleNumber: rider.vehicleNumber,
          licenseId: rider.licenseId,
          address: rider.address,
          city: rider.city,
          state: rider.state,
          zipCode: rider.zipCode,
          location: rider.location,
          ratings: rider.ratings,
          online: rider.online
        }, 
        token,
        requiresApproval: false
      } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to login' });
  }
};

const getProfile = async (req, res) => {
  try {
    const rider = await DeliveryBoy.findById(req.user._id);
    if (!rider) return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    
    res.json({ 
      success: true, 
      data: {
        _id: rider._id,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        status: rider.status,
        area: rider.area,
        assignedRestaurant: rider.assignedRestaurant,
        approvalStatus: rider.approvalStatus,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        licenseId: rider.licenseId,
        address: rider.address,
        city: rider.city,
        state: rider.state,
        zipCode: rider.zipCode,
        location: rider.location,
        ratings: rider.ratings,
        online: rider.online
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, email, vehicleNumber, licenseId, vehicleType, address, city, state, zipCode } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
    if (licenseId) updateData.licenseId = licenseId;
    if (vehicleType) updateData.vehicleType = vehicleType;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.zipCode = zipCode;
    

    if (address || city || state) {
      const fullAddress = `${address || ''}, ${city || ''}, ${state || ''}, India`;
      const coordinates = await getCoordinatesFromAddress(fullAddress);
      
      if (coordinates.latitude && coordinates.longitude) {
        updateData.location = {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          updatedAt: new Date()
        };
      }
    }
    
    const rider = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!rider) return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: {
        _id: rider._id,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        status: rider.status,
        area: rider.area,
        assignedRestaurant: rider.assignedRestaurant,
        approvalStatus: rider.approvalStatus,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        licenseId: rider.licenseId,
        address: rider.address,
        city: rider.city,
        state: rider.state,
        zipCode: rider.zipCode,
        location: rider.location,
        ratings: rider.ratings,
        online: rider.online
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }
    
    const rider = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!rider) return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    
    res.json({ 
      success: true, 
      message: 'Location updated successfully',
      data: rider.location
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { online, status } = req.body;
    
    const updateData = {};
    if (online !== undefined) updateData.online = online;
    if (status) updateData.status = status;
    
    const rider = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );
    
    if (!rider) return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    
    res.json({ 
      success: true, 
      message: 'Status updated successfully',
      data: {
        online: rider.online,
        status: rider.status
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

const logout = async (req, res) => {
  try {

    await DeliveryBoy.findByIdAndUpdate(req.user._id, { online: false });
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to logout' });
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

    const deliveryBoy = await DeliveryBoy.findOne({ email });
    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner with this email does not exist'
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    
    // Store OTP in delivery boy document with 5-minute expiry
    deliveryBoy.resetOTP = otp;
    deliveryBoy.resetOTPExpiry = new Date(Date.now() + 300000); // 5 minutes from now
    await deliveryBoy.save();

    // Send password reset OTP email
    const emailResult = await sendPasswordResetOTPEmail(email, deliveryBoy.firstName, otp, 'delivery');
    
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
    console.error('Delivery forgot password error:', error);
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

    const deliveryBoy = await DeliveryBoy.findOne({
      email,
      resetOTP: otp,
      resetOTPExpiry: { $gt: new Date() }
    });

    if (!deliveryBoy) {
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
    console.error('Delivery OTP verification error:', error);
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

    const deliveryBoy = await DeliveryBoy.findOne({
      email,
      resetOTP: otp,
      resetOTPExpiry: { $gt: new Date() }
    });

    if (!deliveryBoy) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset OTP
    deliveryBoy.password = hashedPassword;
    deliveryBoy.resetOTP = undefined;
    deliveryBoy.resetOTPExpiry = undefined;
    await deliveryBoy.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Delivery reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  updateLocation, 
  updateStatus, 
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword
};



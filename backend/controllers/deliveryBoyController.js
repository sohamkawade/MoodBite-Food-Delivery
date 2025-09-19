const DeliveryBoy = require('../models/DeliveryBoy');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/emailService');

// Admin: list all delivery boys (optional filter by restaurant, status, approvalStatus)
const listDeliveryBoys = async (req, res) => {
  try {
    const { restaurantId, status, approvalStatus } = req.query;
    const match = {};
    if (restaurantId) match.assignedRestaurant = restaurantId;
    if (status) match.status = status;
    if (approvalStatus) match.approvalStatus = approvalStatus;
    const riders = await DeliveryBoy.find(match).populate('assignedRestaurant', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: riders });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch delivery boys' });
  }
};

// Admin: create new delivery boy and optionally assign to restaurant
const createDeliveryBoy = async (req, res) => {
  try {
    const { name, phone, vehicleNumber, status = 'available', restaurantId, area, email } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone are required' });
    const rider = new DeliveryBoy({ name, phone, email, vehicleNumber, status: ['available','busy','offline'].includes(status) ? status : 'available', assignedRestaurant: restaurantId || null, area, approvalStatus: 'approved', online: status === 'available' });
    await rider.save();
    res.status(201).json({ success: true, message: 'Delivery boy created', data: rider });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create delivery boy' });
  }
};

// Admin: update delivery boy
const updateDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicleNumber, status, restaurantId, area } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (vehicleNumber !== undefined) update.vehicleNumber = vehicleNumber;
    if (status !== undefined) update.status = ['available','busy','offline'].includes(status) ? status : 'offline';
    if (area !== undefined) update.area = area;
    if (restaurantId !== undefined) update.assignedRestaurant = restaurantId;
    const rider = await DeliveryBoy.findByIdAndUpdate(id, update, { new: true });
    if (!rider) return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    res.json({ success: true, message: 'Delivery boy updated', data: rider });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update delivery boy' });
  }
};

// Admin: delete delivery boy
const deleteDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    await DeliveryBoy.findByIdAndDelete(id);
    res.json({ success: true, message: 'Delivery boy deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete delivery boy' });
  }
};

// Admin: approve delivery boy
const approveDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const rider = await DeliveryBoy.findByIdAndUpdate(id, { approvalStatus: 'approved', status: 'available', online: true }, { new: true });
    if (!rider) return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    try {
      if (rider.email) {
        await sendApprovalEmail(rider.email, 'delivery', rider.name);
      }
    } catch(e) { console.warn('Delivery approval email failed:', e?.message || e); }
    res.json({ success: true, message: 'Approved', data: rider });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to approve' });
  }
};

// Admin: reject delivery boy
const rejectDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const rider = await DeliveryBoy.findByIdAndUpdate(id, { approvalStatus: 'rejected', status: 'offline', online: false }, { new: true });
    if (!rider) return res.status(404).json({ success: false, message: 'Failed to reject' });
    try {
      if (rider.email) {
        await sendRejectionEmail(rider.email, 'delivery', rider.name, req.body?.reason || 'Not specified');
      }
    } catch(e) { console.warn('Delivery rejection email failed:', e?.message || e); }
    res.json({ success: true, message: 'Rejected', data: rider });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to reject' });
  }
};

// Delivery boy: go online (with automatic expiration)
const goOnline = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration = 8 } = req.body; // Default 8 hours online
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);
    
    const rider = await DeliveryBoy.findByIdAndUpdate(id, {
      online: true,
      status: 'available',
      'location.updatedAt': new Date(),
      onlineExpiresAt: expiresAt
    }, { new: true });
    
    if (!rider) return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    
    res.json({ 
      success: true, 
      message: `You are now online for ${duration} hours`, 
      data: { ...rider.toObject(), onlineExpiresAt: expiresAt }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to go online' });
  }
};

// Delivery boy: go offline
const goOffline = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rider = await DeliveryBoy.findByIdAndUpdate(id, {
      online: false,
      status: 'offline',
      onlineExpiresAt: null
    }, { new: true });
    
    if (!rider) return res.status(404).json({ success: false, message: 'Failed to go offline' });
    
    res.json({ 
      success: true, 
      message: 'You are now offline', 
      data: rider 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to go offline' });
  }
};

// Get only online delivery boys for assignment
const getOnlineDeliveryBoys = async (req, res) => {
  try {
    const { area, restaurantId } = req.query;
    const match = { 
      online: true, 
      status: 'available',
      approvalStatus: 'approved',
      isDisabled: false
    };
    
    if (area) match.area = area;
    if (restaurantId) match.assignedRestaurant = restaurantId;
    
    // Filter out expired online status
    const now = new Date();
    const riders = await DeliveryBoy.find({
      ...match,
      $or: [
        { onlineExpiresAt: { $gt: now } },
        { onlineExpiresAt: { $exists: false } }
      ]
    }).populate('assignedRestaurant', 'name').sort({ 'location.updatedAt': -1 });
    
    res.json({ success: true, data: riders });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch online delivery boys' });
  }
};

// Admin: get all delivery boys with pagination and filtering
const getAllDeliveryBoysForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, approvalStatus, search, area } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (approvalStatus && approvalStatus !== 'all') {
      query.approvalStatus = approvalStatus;
    }
    
    if (area && area !== 'all') {
      query.area = { $regex: area, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const deliveryBoys = await DeliveryBoy.find(query)
      .populate('assignedRestaurant', 'name')
      .select('name email phone vehicleNumber vehicleType status approvalStatus licenseId  address area city state zipCode ratings online assignedRestaurant createdAt')
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
    console.error('Get all delivery boys for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin: update delivery boy approval status
const updateDeliveryBoyStatus = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { approvalStatus, reason } = req.body;

    // Validate approval status
    const allowedStatuses = ['pending', 'approved', 'rejected'];
    if (!allowedStatuses.includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status'
      });
    }

    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    // Update approval status and related fields
    deliveryBoy.approvalStatus = approvalStatus;
    
    if (approvalStatus === 'approved') {
      deliveryBoy.status = 'available';
      deliveryBoy.online = true;
    } else if (approvalStatus === 'rejected') {
      deliveryBoy.status = 'offline';
      deliveryBoy.online = false;
    }

    await deliveryBoy.save();

    // Send email notification
    if (deliveryBoy.email) {
      if (approvalStatus === 'approved') {
        await sendApprovalEmail(deliveryBoy.email, 'delivery', deliveryBoy.name);
      } else if (approvalStatus === 'rejected') {
        await sendRejectionEmail(deliveryBoy.email, 'delivery', deliveryBoy.name, reason || 'Not specified');
      }
    }

    res.json({
      success: true,
      message: `Delivery boy ${approvalStatus}`,
      data: {
        deliveryBoy: {
          _id: deliveryBoy._id,
          name: deliveryBoy.name,
          approvalStatus: deliveryBoy.approvalStatus,
          status: deliveryBoy.status,
          email: deliveryBoy.email
        }
      }
    });

  } catch (error) {
    console.error('Update delivery boy status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = { 
  listDeliveryBoys, 
  createDeliveryBoy, 
  updateDeliveryBoy, 
  deleteDeliveryBoy,
  approveDeliveryBoy,
  rejectDeliveryBoy,
  getAllDeliveryBoysForAdmin,
  updateDeliveryBoyStatus,
  goOnline,
  goOffline,
  getOnlineDeliveryBoys
};



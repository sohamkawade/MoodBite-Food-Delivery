const Restaurant = require('../models/Restaurant');
const DeliveryBoy = require('../models/DeliveryBoy');
const bcrypt = require('bcryptjs');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/emailService');

const getCoordinatesFromAddress = async (address) => {
  try {
    
    const cityStateAddress = address.split(',').slice(-3).join(',').trim();
    
    const encodedAddress = encodeURIComponent(cityStateAddress);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in`, {
      headers: {
        'User-Agent': 'MoodBite-Restaurant-App/1.0'
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
        'User-Agent': 'MoodBite-Restaurant-App/1.0'
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
    
    // Strategy 3: Try with just city name
    const cityMatch = address.match(/([^,]+),\s*([^,]+),\s*India$/);
    if (cityMatch) {
      const cityName = cityMatch[1].trim();
      
      const cityEncodedAddress = encodeURIComponent(cityName + ', India');
      const cityResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityEncodedAddress}&limit=1&countrycodes=in`, {
        headers: {
          'User-Agent': 'MoodBite-Restaurant-App/1.0'
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
    
    // Try to match city name from address
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

// Register new restaurant (public endpoint)
const registerRestaurant = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      location,
      description,
      cuisine,
      imageUrl
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !location || !cuisine) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if restaurant with this email already exists
    const existingRestaurant = await Restaurant.findOne({ 'contact.email': email });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create full address string for geocoding
    const fullAddress = `${location.address}, ${location.area || ''}, ${location.city}, ${location.state}, ${location.zipCode || ''}, India`;

    // Get coordinates from address
    const coordinates = await getCoordinatesFromAddress(fullAddress);

    // Create restaurant object
    const restaurantData = {
      name,
      cuisine,
      location: {
        address: location.address,
        area: location.area || '',
        city: location.city,
        state: location.state,
        zipCode: location.zipCode || '',
        country: location.country || 'India',
        ...(coordinates.latitude && coordinates.longitude ? { coordinates } : {})
      },
      contact: {
        phone,
        email,
        website: ''
      },
      description: description || '',
      imageUrl: imageUrl || '',
      status: 'pending',
      password: hashedPassword,
      operatingHours: {
        monday: { open: '10:00 AM', close: '10:00 PM', isOpen: true },
        tuesday: { open: '10:00 AM', close: '10:00 PM', isOpen: true },
        wednesday: { open: '10:00 AM', close: '10:00 PM', isOpen: true },
        thursday: { open: '10:00 AM', close: '10:00 PM', isOpen: true },
        friday: { open: '10:00 AM', close: '10:00 PM', isOpen: true },
        saturday: { open: '10:00 AM', close: '10:00 PM', isOpen: true },
        sunday: { open: '10:00 AM', close: '10:00 PM', isOpen: true }
      }
    };

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    res.status(201).json({
      success: true,
      message: 'Restaurant registration submitted successfully. Please wait for admin approval.',
      data: { 
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          email: restaurant.contact.email,
          status: restaurant.status
        }
      }
    });
  } catch (error) {
    console.error('Restaurant registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register restaurant',
      error: error.message
    });
  }
};

// Get all restaurants (for admin)
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({})
      .select('name cuisine status rating totalRatings totalOrders location contact imageUrl description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        restaurants: restaurants.map(restaurant => ({
          _id: restaurant._id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          status: restaurant.status,
          rating: restaurant.rating,
          totalRatings: restaurant.totalRatings,
          totalOrders: restaurant.totalOrders,
          location: {
            address: restaurant.location.address,
            city: restaurant.location.city,
            state: restaurant.location.state,
            zipCode: restaurant.location.zipCode,
            country: restaurant.location.country,
            coordinates: {
              latitude: restaurant.location.coordinates?.latitude || null,
              longitude: restaurant.location.coordinates?.longitude || null,
            }
          },
          contact: {
            phone: restaurant.contact.phone,
            email: restaurant.contact.email
          },
          imageUrl: restaurant.imageUrl,
          description: restaurant.description
        }))
      }
    });
  } catch (error) {
    console.error('Get all restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants'
    });
  }
};

// Get restaurant by ID
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
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
    console.error('Get restaurant by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant'
    });
  }
};

// Create new restaurant
const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      cuisine,
      location,
      contact,
      description,
      imageUrl,
      documents
    } = req.body;

    // Validate required fields
    if (!name || !cuisine || !location || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create restaurant object
    const restaurantData = {
      name,
      cuisine,
      location: {
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode || '',
        country: location.country || 'India',
        coordinates: {
          latitude: location.coordinates?.latitude ?? null,
          longitude: location.coordinates?.longitude ?? null,
        }
      },
      contact: {
        phone: contact.phone,
        email: contact.email,
        website: contact.website || ''
      },
      description: description || '',
      imageUrl: imageUrl || '',
      status: 'pending',
      documents: documents || {}
    };

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: { restaurant }
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create restaurant'
    });
  }
};

// Update restaurant
const updateRestaurant = async (req, res) => {
  try {
    const {
      name,
      cuisine,
      location,
      contact,
      description,
      imageUrl,
      status
    } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Update fields
    if (name) restaurant.name = name;
    if (cuisine) restaurant.cuisine = cuisine;
    if (location) {
      if (location.address) restaurant.location.address = location.address;
      if (location.city) restaurant.location.city = location.city;
      if (location.state) restaurant.location.state = location.state;
      if (location.zipCode) restaurant.location.zipCode = location.zipCode;
      if (location.country) restaurant.location.country = location.country;
      if (location.coordinates) {
        if (location.coordinates.latitude !== undefined) restaurant.location.coordinates.latitude = location.coordinates.latitude;
        if (location.coordinates.longitude !== undefined) restaurant.location.coordinates.longitude = location.coordinates.longitude;
      }
    }
    if (contact) {
      if (contact.phone) restaurant.contact.phone = contact.phone;
      if (contact.email) restaurant.contact.email = contact.email;
      if (contact.website) restaurant.contact.website = contact.website;
    }
    if (description !== undefined) restaurant.description = description;
    if (imageUrl !== undefined) restaurant.imageUrl = imageUrl;
    if (status) restaurant.status = status;
    if (req.body.documents) restaurant.documents = { ...(restaurant.documents||{}), ...req.body.documents };

    await restaurant.save();

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: { restaurant }
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant'
    });
  }
};

// Delete restaurant
const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    await Restaurant.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete restaurant'
    });
  }
};

// Update restaurant status
const updateRestaurantStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Fire email for status transitions
    try {
      const email = restaurant.contact?.email;
      const name = restaurant.name;
      
      if (email) {
        if (status === 'active') {
          await sendApprovalEmail(email, 'restaurant', name);
        } else if (status === 'rejected') {
          await sendRejectionEmail(email, 'restaurant', name, req.body.reason || 'Not specified');
        } 
      } else {
        console.warn(`⚠️ No email found for restaurant: ${name}`);
        } 
    } catch (e) { 
      console.error('❌ Restaurant status email failed:', e?.message || e);
      console.error('❌ Full error:', e);
      }

    res.json({ success: true, message: 'Restaurant status updated successfully', data: { restaurant } });
  } catch (error) {
    console.error('Update restaurant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant status'
    });
  }
};

// Admin function to update restaurant status
const updateRestaurantStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const allowedStatuses = ['active', 'inactive', 'suspended', 'pending', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Update status
    restaurant.status = status;
    await restaurant.save();

    // Send email notification
    if (status === 'active') {
      await sendApprovalEmail(restaurant.contact.email, 'restaurant', restaurant.name);
    } else if (status === 'rejected') {
      await sendRejectionEmail(restaurant.contact.email, 'restaurant', restaurant.name);
    }

    res.json({
      success: true,
      message: `Restaurant status updated to ${status}`,
      data: {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          status: restaurant.status,
          email: restaurant.contact.email
        }
      }
    });

  } catch (error) {
    console.error('Update restaurant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin function to get all restaurants with pagination and filtering
const getAllRestaurantsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, cuisine } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (cuisine && cuisine !== 'all') {
      query.cuisine = cuisine;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .select('name cuisine status rating totalOrders totalRatings contact location imageUrl operatingHours createdAt')
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
    console.error('Get all restaurants for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delivery boy management for a restaurant
const listDeliveryBoysForRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate('deliveryBoys');
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant.deliveryBoys || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch delivery boys' });
  }
};

const assignDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params; // restaurant id
    const { deliveryBoyId } = req.body;
    const restaurant = await Restaurant.findById(id);
    const rider = await DeliveryBoy.findById(deliveryBoyId);
    if (!restaurant || !rider) return res.status(404).json({ success: false, message: 'Not found' });
    if (!restaurant.deliveryBoys.find(r => r.toString() === deliveryBoyId)) {
      restaurant.deliveryBoys.push(deliveryBoyId);
    }
    rider.assignedRestaurant = restaurant._id;
    await rider.save();
    await restaurant.save();
    res.json({ success: true, message: 'Assigned', data: { restaurant, rider } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to assign' });
  }
};

const removeDeliveryBoy = async (req, res) => {
  try {
    const { id, riderId } = req.params; // restaurant id, rider id
    const restaurant = await Restaurant.findById(id);
    const rider = await DeliveryBoy.findById(riderId);
    if (!restaurant || !rider) return res.status(404).json({ success: false, message: 'Not found' });
    restaurant.deliveryBoys = (restaurant.deliveryBoys || []).filter(r => r.toString() !== riderId);
    if (rider.assignedRestaurant && rider.assignedRestaurant.toString() === id) {
      rider.assignedRestaurant = null;
    }
    await rider.save();
    await restaurant.save();
    res.json({ success: true, message: 'Removed' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to remove' });
  }
};

// Public: nearby restaurants based on lat/lng and/or pincode
const nearbyRestaurants = async (req, res) => {
  try {
    const { lat, lng, pincode } = req.query;
    const match = { status: 'active' };
    if (pincode) {
      match.$or = [
        { pincode },
        { 'location.zipCode': pincode },
      ];
    }
    const all = await Restaurant.find(match).select('name cuisines status location deliveryInfo rating totalOrders pincode');
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    const withDistance = all.map(r => {
      const rl = r.location || {};
      const rLat = rl.coordinates?.latitude;
      const rLng = rl.coordinates?.longitude;
      let distanceKm = null;
      if (userLat != null && userLng != null && rLat != null && rLng != null) {
        const R = 6371;
        const dLat = (userLat - rLat) * Math.PI / 180;
        const dLng = (userLng - rLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) ** 2 + Math.cos(rLat*Math.PI/180) * Math.cos(userLat*Math.PI/180) * Math.sin(dLng/2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceKm = R * c;
      }
      return { r, distanceKm };
    });
    let eligible = withDistance.filter(x => {
      if (x.distanceKm == null) return true; // if no coords, include and let client decide
      const radius = x.r.deliveryInfo?.deliveryRadius || x.r.deliveryInfo?.deliveryRadiusKm || 7;
      return x.distanceKm <= radius;
    });
    eligible.sort((a,b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    res.json({ success: true, data: eligible.map(x => x.r) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch nearby restaurants' });
  }
};

module.exports = {
  registerRestaurant,
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantStatus,
  updateRestaurantStatusAdmin,
  getAllRestaurantsForAdmin,
  listDeliveryBoysForRestaurant,
  assignDeliveryBoy,
  removeDeliveryBoy,
  nearbyRestaurants
};

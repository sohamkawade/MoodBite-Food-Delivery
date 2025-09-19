const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middlewares/authMiddleware');
const { getAllMenuItems, createMenuItem, deleteMenuItem, updateMenuItem } = require('../controllers/menuItemController');
const { processImageUrl } = require('../utils/imageUtils');
const MenuItem = require('../models/MenuItem');

router.get('/admin/items', authenticateAdmin, getAllMenuItems);
router.post('/admin/items', authenticateAdmin, createMenuItem);
router.put('/admin/items/:id', authenticateAdmin, updateMenuItem);
router.delete('/admin/items/:id', authenticateAdmin, deleteMenuItem);

// Public: list available items for customers
router.get('/items', async (req, res) => {
  try {
    const items = await MenuItem.find({ isAvailable: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(200)
      .populate({ path: 'restaurant', select: 'name' });
    
    // Process image URLs for each item
    const processedItems = items.map(item => ({
      ...item.toObject(),
      image: processImageUrl(item.image)
    }));
    
    res.json({ success: true, data: { items: processedItems } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch items' });
  }
});

// Public: get trending items only
router.get('/trending', async (req, res) => {
  try {
    const trendingItems = await MenuItem.find({ 
      isAvailable: true, 
      isTrending: true 
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(20)
      .populate({ path: 'restaurant', select: 'name' });
    
    // Process image URLs for each item
    const processedItems = trendingItems.map(item => ({
      ...item.toObject(),
      image: processImageUrl(item.image)
    }));
    
    res.json({ success: true, data: { items: processedItems } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch trending items' });
  }
});

// Public: get new arrival items only
router.get('/new-arrivals', async (req, res) => {
  try {
    const newArrivalItems = await MenuItem.find({ 
      isAvailable: true, 
      isNewArrival: true 
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(20)
      .populate({ path: 'restaurant', select: 'name' });
    
    // Process image URLs for each item
    const processedItems = newArrivalItems.map(item => ({
      ...item.toObject(),
      image: processImageUrl(item.image)
    }));
    
    res.json({ success: true, data: { items: processedItems } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch new arrival items' });
  }
});

module.exports = router;



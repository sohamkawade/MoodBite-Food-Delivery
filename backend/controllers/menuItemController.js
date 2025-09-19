const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const { processImageUrl } = require('../utils/imageUtils');

// Get all menu items (admin)
const getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({})
      .select('name category price description image rating totalRatings restaurant isAvailable isNewArrival isTrending offer discountPercentage preparationTime calories nutritionalInfo spiceLevel maxQuantity stockQuantity foodType sortOrder createdAt updatedAt')
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate({ path: 'restaurant', select: 'name' });

    // Process image URLs for each item
    const processedItems = items.map(item => ({
      ...item.toObject(),
      image: processImageUrl(item.image)
    }));

    res.json({ success: true, data: { items: processedItems } });
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
};

// Create menu item (admin)
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      description,
      image,
      restaurant,
      isAvailable,
      offer,
      discountPercentage,
      isNewArrival,
      isTrending,
      preparationTime,
      calories,
      nutritionalInfo,
      spiceLevel,
      maxQuantity,
      stockQuantity,
      foodType,
      sortOrder,
    } = req.body;

    if (!name || !category || price === undefined || !description || !image || !restaurant) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const restaurantExists = await Restaurant.findById(restaurant).select('_id');
    let resolvedCategoryId = undefined;
    try {
      const categoryDoc = await Category.findOne({ name: category }).select('_id');
      if (categoryDoc) resolvedCategoryId = categoryDoc._id;
      // fallback by slug if not found by name
      if (!resolvedCategoryId && name) {
        const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const bySlug = await Category.findOne({ slug }).select('_id');
        if (bySlug) resolvedCategoryId = bySlug._id;
      }
    } catch {}
    if (!restaurantExists) {
      return res.status(400).json({ success: false, message: 'Invalid restaurant' });
    }

    const item = new MenuItem({
      name,
      category,
      categoryId: resolvedCategoryId,
      price,
      description,
      image: processImageUrl(image),
      restaurant,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      offer: offer || undefined,
      discountPercentage: discountPercentage || 0,
      isNewArrival: !!isNewArrival,
      isTrending: !!isTrending,
      preparationTime: typeof preparationTime === 'number' ? preparationTime : undefined,
      calories: typeof calories === 'number' ? calories : undefined,
      nutritionalInfo: nutritionalInfo || undefined,
      spiceLevel: spiceLevel || undefined,
      maxQuantity: typeof maxQuantity === 'number' ? maxQuantity : undefined,
      stockQuantity: typeof stockQuantity === 'number' ? stockQuantity : undefined,
      foodType: foodType || undefined,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
    });
    await item.save();
    // Update category item count
    try {
      await Category.updateOne({ name: category }, { $inc: { itemCount: 1 } });
    } catch (e) {
      console.warn('Failed to increment category itemCount:', e?.message || e);
    }
    res.status(201).json({ success: true, message: 'Menu item created successfully', data: { item } });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ success: false, message: 'Failed to create menu item' });
  }
};

// Delete menu item (admin)
const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    await MenuItem.findByIdAndDelete(req.params.id);
    // Decrement category item count
    try {
      if (item.category) {
        await Category.updateOne({ name: item.category }, { $inc: { itemCount: -1 } });
      }
    } catch (e) {
      console.warn('Failed to decrement category itemCount:', e?.message || e);
    }
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete menu item' });
  }
};

// Update menu item (admin)
const updateMenuItem = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      description,
      image,
      restaurant,
      isAvailable,
      isNewArrival,
      isTrending,
      offer,
      discountPercentage,
      preparationTime,
      calories,
      nutritionalInfo,
      spiceLevel,
      maxQuantity,
      stockQuantity,
      foodType,
      sortOrder,
    } = req.body;

    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

    const previousCategory = item.category;
    const previousCategoryId = item.categoryId;
    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (category !== undefined) {
      try {
        const categoryDoc = await Category.findOne({ name: category }).select('_id');
        item.categoryId = categoryDoc ? categoryDoc._id : undefined;
      } catch {}
    }
    if (price !== undefined) item.price = price;
    if (description !== undefined) item.description = description;
    if (image !== undefined) item.image = processImageUrl(image);
    if (restaurant !== undefined) item.restaurant = restaurant;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (isNewArrival !== undefined) item.isNewArrival = isNewArrival;
    if (isTrending !== undefined) item.isTrending = isTrending;
    if (offer !== undefined) item.offer = offer;
    if (discountPercentage !== undefined) item.discountPercentage = discountPercentage;
    if (preparationTime !== undefined) item.preparationTime = preparationTime;
    if (calories !== undefined) item.calories = calories;
    if (nutritionalInfo !== undefined) item.nutritionalInfo = nutritionalInfo;
    if (spiceLevel !== undefined) item.spiceLevel = spiceLevel;
    if (maxQuantity !== undefined) item.maxQuantity = maxQuantity;
    if (stockQuantity !== undefined) item.stockQuantity = stockQuantity;
    if (foodType !== undefined) item.foodType = foodType;
    if (sortOrder !== undefined) item.sortOrder = sortOrder;

    await item.save();
    // If category changed, adjust counts
    try {
      if (category !== undefined && category !== previousCategory) {
        if (previousCategory) await Category.updateOne({ name: previousCategory }, { $inc: { itemCount: -1 } });
        if (item.category) await Category.updateOne({ name: item.category }, { $inc: { itemCount: 1 } });
      }
    } catch (e) {
      console.warn('Failed to adjust category itemCount on update:', e?.message || e);
    }
    res.json({ success: true, message: 'Menu item updated successfully', data: { item } });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update menu item' });
  }
};

module.exports = { getAllMenuItems, createMenuItem, deleteMenuItem, updateMenuItem };



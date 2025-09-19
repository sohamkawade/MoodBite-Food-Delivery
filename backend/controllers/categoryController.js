const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const { processImageUrl } = require('../utils/imageUtils');

const getAllCategoriesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const categories = await Category.find(query)
      .select('name slug image description sortOrder isActive isFeatured cuisineType createdAt updatedAt')
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get item count for each category and process image URLs
    await Promise.all(categories.map(async (cat) => {
      const count = await MenuItem.countDocuments({
        $or: [
          { categoryId: cat._id },
          { category: cat.name },
        ]
      });
      cat.itemCount = count;
      cat.image = processImageUrl(cat.image);
    }));

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all categories for admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// Get categories (active only - for public use)
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug image isFeatured cuisineType description sortOrder')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Get item count for each category and process image URLs
    await Promise.all(categories.map(async (cat) => {
      const count = await MenuItem.countDocuments({
        $or: [
          { categoryId: cat._id },
          { category: cat.name },
        ]
      });
      cat.itemCount = count;
      cat.image = processImageUrl(cat.image);
    }));

    res.json({ success: true, data: { categories } });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// Create category (admin)
const createCategory = async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      image, 
      sortOrder, 
      isActive, 
      isFeatured, 
      cuisineType 
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: 'Category image is required' });
    }

    // Generate slug if not provided
    const finalSlug = slug ? 
      String(slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') :
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug: finalSlug });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category with this slug already exists' });
    }

    const category = new Category({
      name: name.trim(),
      slug: finalSlug,
      description: description || '',
      image: processImageUrl(image.trim()),
      sortOrder: Number(sortOrder) || 0,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      isFeatured: !!isFeatured,
      cuisineType: cuisineType || undefined,
      createdBy: req.user?._id, // Track admin who created
      updatedBy: req.user?._id
    });

    await category.save();

    res.status(201).json({ 
      success: true, 
      message: 'Category created successfully', 
      data: { category } 
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category with this name or slug already exists' 
      });
    }

    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

// Update category (admin)
const updateCategory = async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      image, 
      sortOrder, 
      isActive, 
      isFeatured, 
      cuisineType 
    } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name: name.trim(), _id: { $ne: category._id } });
      if (existingCategory) {
        return res.status(400).json({ success: false, message: 'Category with this name already exists' });
      }
      category.name = name.trim();
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== category.slug) {
      const finalSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingCategory = await Category.findOne({ slug: finalSlug, _id: { $ne: category._id } });
      if (existingCategory) {
        return res.status(400).json({ success: false, message: 'Category with this slug already exists' });
      }
      category.slug = finalSlug;
    }

    // Update other fields
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = processImageUrl(image);
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder) || 0;
    if (isActive !== undefined) category.isActive = isActive;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;
    if (cuisineType !== undefined) category.cuisineType = cuisineType;
    
    // Track who updated
    category.updatedBy = req.user?._id;

    await category.save();

    res.json({ 
      success: true, 
      message: 'Category updated successfully', 
      data: { category } 
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

// Delete category (admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if category has items
    const itemCount = await MenuItem.countDocuments({
      $or: [
        { categoryId: category._id },
        { category: category.name },
      ]
    });

    if (itemCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category. It has ${itemCount} menu items. Please remove or reassign items first.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Get item count
    const itemCount = await MenuItem.countDocuments({
      $or: [
        { categoryId: category._id },
        { category: category.name },
      ]
    });

    const categoryData = category.toObject();
    categoryData.itemCount = itemCount;
    categoryData.image = processImageUrl(categoryData.image);

    res.json({ success: true, data: { category: categoryData } });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch category' });
  }
};

// Toggle category status
const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isActive = !category.isActive;
    category.updatedBy = req.user?._id;
    await category.save();

    const categoryData = category.toObject();
    categoryData.image = processImageUrl(categoryData.image);

    res.json({ 
      success: true, 
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { category: categoryData } 
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle category status' });
  }
};

module.exports = { 
  getAllCategoriesForAdmin,
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getCategoryById,
  toggleCategoryStatus
};



const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middlewares/authMiddleware');
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

router.get('/admin/all', authenticateAdmin, categoryController.getAllCategoriesForAdmin);
router.post('/admin', authenticateAdmin, categoryController.createCategory);
router.put('/admin/:id', authenticateAdmin, categoryController.updateCategory);
router.delete('/admin/:id', authenticateAdmin, categoryController.deleteCategory);
router.patch('/admin/:id/status', authenticateAdmin, categoryController.toggleCategoryStatus);

module.exports = router;



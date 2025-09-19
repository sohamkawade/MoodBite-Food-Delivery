import React, { useState, useEffect } from "react";
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdVisibility, 
  MdVisibilityOff,
  MdSearch,
  MdCategory,
  MdImage,
  MdStar
} from "react-icons/md";
import { categoryAPI } from "../../services/api";
import toast from 'react-hot-toast';

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    sortOrder: 0,
    isActive: true,
    isFeatured: false,
    cuisineType: ""
  });

  const cuisineTypes = [
    'Indian', 'Italian', 'Chinese', 'Japanese', 'Mexican', 'Thai',
    'American', 'Mediterranean', 'French', 'Korean', 'Vietnamese',
    'Greek', 'Spanish', 'Lebanese', 'Turkish', 'Fusion', 'International'
  ];

  useEffect(() => {
    fetchCategories();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAllForAdmin({
        page: currentPage,
        limit: 12,
        status: statusFilter,
        search: searchTerm
      });

      if (response.success) {
        setCategories(response.data.categories);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        const response = await categoryAPI.update(editingCategory._id, formData);
        if (response.success) {
          toast.success('Category updated successfully');
          setShowForm(false);
          setEditingCategory(null);
          resetForm();
          fetchCategories();
        }
      } else {
        const response = await categoryAPI.create(formData);
        if (response.success) {
          toast.success('Category created successfully');
          setShowForm(false);
          resetForm();
          fetchCategories();
        }
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image,
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive,
      isFeatured: category.isFeatured || false,
      cuisineType: category.cuisineType || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const response = await categoryAPI.delete(categoryId);
        if (response.success) {
          toast.success('Category deleted successfully');
          fetchCategories();
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
        toast.error(error.message || 'Failed to delete category');
      }
    }
  };

  const handleToggleStatus = async (categoryId) => {
    try {
      const response = await categoryAPI.toggleStatus(categoryId);
      if (response.success) {
        toast.success(response.message);
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to toggle category status:', error);
      toast.error('Failed to toggle category status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      sortOrder: 0,
      isActive: true,
      isFeatured: false,
      cuisineType: ""
    });
  };

  const openCreateForm = () => {
    setEditingCategory(null);
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    resetForm();
  };

  const generateSlug = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdCategory size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600 text-sm">Manage food categories and organize your menu</p>
            </div>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-medium shadow-sm text-sm"
          >
            <MdAdd className="text-base sm:text-lg" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((category) => (
          <div key={category._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Category Image */}
            <div className="relative h-40 sm:h-48 bg-gray-100">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <MdImage size={40} className="text-gray-400" />
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                  category.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Featured Badge */}
              {category.isFeatured && (
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-yellow-100 text-yellow-800">
                    <MdStar size={12} className="mr-1" />
                    Featured
                  </span>
                </div>
              )}
            </div>

            {/* Category Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{category.name}</h3>
                <span className="text-xs sm:text-sm text-gray-500">#{category.sortOrder}</span>
              </div>
              
              {category.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{category.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4">
                <span>{category.itemCount || 0} items</span>
                {category.cuisineType && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-[10px] sm:text-xs">
                    {category.cuisineType}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                >
                  <MdEdit size={16} />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => handleToggleStatus(category._id)}
                  className="flex items-center justify-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                  title={category.isActive ? 'Deactivate' : 'Activate'}
                >
                  {category.isActive ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                </button>
                
                <button
                  onClick={() => handleDelete(category._id)}
                  className="flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
                  title="Delete"
                >
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 sm:px-4 py-2 rounded-lg border ${
                  currentPage === page
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-0 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-xl shadow-xl w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-3 sm:mx-0 mb-2 sm:mb-0 max-h-[80vh] sm:max-h-[85vh] overflow-y-auto">
            <div className="p-3 sm:p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 -m-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      if (!formData.slug) generateSlug(e.target.value);
                    }}
                    placeholder="e.g., Pizza, Burger, Biryani, Beverages"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., pizza, biryani"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Cuisine Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <select
                    value={formData.cuisineType}
                    onChange={(e) => setFormData(prev => ({ ...prev, cuisineType: e.target.value }))}
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Cuisine Type</option>
                    {cuisineTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this category... e.g., 'Delicious oven-baked pizzas with toppings.'"
                  rows={2}
                  className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Status Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Status
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                    Featured Category
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors w-full sm:w-auto text-sm"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;

import React, { useState, useEffect } from "react";
import { 
  MdMenu, 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch,
  MdCategory,
  MdAttachMoney,
  MdInventory,
  MdImage,
  MdTimer,
  MdTrendingUp,
  MdNewReleases,
  MdDiscount,
  MdVisibility
} from "react-icons/md";
import { restaurantAuthAPI as restaurantAPI } from "../../services/api";
import { categoryAPI } from "../../services/api";

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    image: "",
    foodType: "veg",
    isAvailable: true,
    stockQuantity: "",
    preparationTime: "",
    spiceLevel: "mild",
    sortOrder: 0,
    isNewArrival: false,
    isTrending: false,
    discountPercentage: 0,
    calories: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch menu items
      const menuRes = await restaurantAPI.getMenuItems();
      if (menuRes.success) {
        setMenuItems(menuRes.data);
      }

      // Fetch categories from admin API
      const categoriesRes = await categoryAPI.getAll();
      if (categoriesRes.success) {
        setCategories(categoriesRes.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: "error", text: "Failed to fetch menu data" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        preparationTime: parseInt(formData.preparationTime) || 0,
        sortOrder: parseInt(formData.sortOrder) || 0,
        discountPercentage: parseInt(formData.discountPercentage) || 0,
        calories: parseInt(formData.calories) || 0,
        rating: 0,
        totalRatings: 0
      };
      

      let response;
      if (editingItem) {
        response = await restaurantAPI.updateMenuItem(editingItem._id, itemData);
      } else {
        response = await restaurantAPI.createMenuItem(itemData);
      }

      if (response.success) {
        setMessage({ 
          type: "success", 
          text: `Menu item ${editingItem ? 'updated' : 'created'} successfully!` 
        });
        setShowAddModal(false);
        setEditingItem(null);
        resetForm();
        fetchData();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error('Failed to save menu item:', error);
      setMessage({ type: "error", text: "Failed to save menu item" });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      category: item.category || "",
      price: item.price?.toString() || "",
      description: item.description || "",
      image: item.image || "",
      foodType: item.foodType || "veg",
      isAvailable: item.isAvailable !== false,
      stockQuantity: item.stockQuantity?.toString() || "",
      preparationTime: item.preparationTime?.toString() || "",
      spiceLevel: item.spiceLevel || "mild",
      sortOrder: item.sortOrder || 0,
      isNewArrival: item.isNewArrival || false,
      isTrending: item.isTrending || false,
      discountPercentage: item.discountPercentage || 0,
      calories: item.calories?.toString() || ""
    });
    setShowAddModal(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        const response = await restaurantAPI.deleteMenuItem(itemId);
        if (response.success) {
          setMessage({ type: "success", text: "Menu item deleted successfully!" });
          fetchData();
          setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        }
      } catch (error) {
        console.error('Failed to delete menu item:', error);
        setMessage({ type: "error", text: "Failed to delete menu item" });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      price: "",
      description: "",
      image: "",
      foodType: "veg",
      isAvailable: true,
      stockQuantity: "",
      preparationTime: "",
      spiceLevel: "mild",
      sortOrder: 0,
      isNewArrival: false,
      isTrending: false,
      discountPercentage: 0,
      calories: ""
    });
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    resetForm();
  };

  const openViewModal = (item) => {
    setViewingItem(item);
  };

  const closeViewModal = () => {
    setViewingItem(null);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFoodTypeBadge = (type) => {
    const config = {
      veg: { bg: "bg-green-100", text: "text-green-800", label: "Veg" },
      "non-veg": { bg: "bg-red-100", text: "text-red-800", label: "Non-Veg" },
      vegan: { bg: "bg-blue-100", text: "text-blue-800", label: "Vegan" }
    };
    
    const style = config[type] || config.veg;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getSpiceLevelBadge = (level) => {
    const config = {
      mild: { bg: "bg-green-100", text: "text-green-800" },
      medium: { bg: "bg-yellow-100", text: "text-yellow-800" },
      spicy: { bg: "bg-red-100", text: "text-red-800" }
    };
    
    const style = config[level] || config.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {level}
      </span>
    );
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <MdMenu size={24} className="text-orange-600 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Menu Management</h1>
              <p className="text-gray-600 text-sm">Manage your restaurant menu items and categories</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-300 font-medium shadow-sm text-sm w-full sm:w-auto min-h-[40px] touch-manipulation"
          >
            <MdAdd size={18} className="sm:w-5 sm:h-5" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-xl border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-500' 
            : 'bg-red-50 text-red-800 border-red-500'
        }`}>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Menu Items ({filteredItems.length})</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <div key={item._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Item Image */}
              <div className="relative h-32 sm:h-40 bg-gray-100">
                {item.image && item.image.trim() !== '' ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center bg-gray-200 ${item.image && item.image.trim() !== '' ? 'hidden' : ''}`}>
                  <div className="text-center">
                    <MdImage size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No Image</p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Food Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.foodType === 'veg' ? 'bg-blue-100 text-blue-800' :
                    item.foodType === 'non_veg' ? 'bg-purple-100 text-purple-800' :
                    item.foodType === 'vegan' ? 'bg-teal-100 text-teal-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.foodType === 'veg' ? 'Veg' :
                     item.foodType === 'non_veg' ? 'Non-Veg' :
                     item.foodType === 'vegan' ? 'Vegan' :
                     item.foodType}
                  </span>
                </div>

                {/* New Arrival Badge */}
                {item.isNewArrival && (
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 shadow-sm">
                      New
                    </span>
                  </div>
                )}

                {/* Trending Badge */}
                {item.isTrending && (
                  <div className="absolute bottom-3 right-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 shadow-sm">
                      Trending
                    </span>
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                  <span className="text-base sm:text-lg font-bold text-orange-600">₹{item.price}</span>
                </div>
                
                <div className="space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <MdCategory size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="truncate">{item.category}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MdTimer size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>{item.preparationTime} min</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <MdInventory size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>Stock: {item.stockQuantity}</span>
                    </span>
                    {item.discountPercentage > 0 && (
                      <span className="flex items-center space-x-1 text-green-600 font-medium">
                        <MdDiscount size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span>{item.discountPercentage}% OFF</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-1 sm:space-x-2">
                  <button
                    onClick={() => openViewModal(item)}
                    className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors text-xs sm:text-sm min-h-[36px] touch-manipulation"
                  >
                    <MdVisibility size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                  
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center justify-center px-2 sm:px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors text-xs sm:text-sm min-h-[36px] touch-manipulation"
                    title="Edit"
                  >
                    <MdEdit size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="flex items-center justify-center px-2 sm:px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors text-xs sm:text-sm min-h-[36px] touch-manipulation"
                    title="Delete"
                  >
                    <MdDelete size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center text-gray-500 py-8 sm:py-12">
            <MdMenu size={40} className="mx-auto mb-3 sm:mb-4 text-gray-300 sm:w-12 sm:h-12" />
            <p className="text-sm sm:text-base">No menu items found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-0 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-xl shadow-xl w-full max-w-[95%] sm:max-w-4xl mx-3 sm:mx-0 mb-2 sm:mb-0 max-h-[80vh] sm:max-h-[95vh] overflow-y-auto">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 -m-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Margherita Pizza"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Food Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Food Type *
                  </label>
                  <select
                    required
                    value={formData.foodType}
                    onChange={(e) => setFormData(prev => ({ ...prev, foodType: e.target.value }))}
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                    placeholder="10"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Preparation Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: e.target.value }))}
                    placeholder="20"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Spice Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spice Level
                  </label>
                  <select
                    value={formData.spiceLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, spiceLevel: e.target.value }))}
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="spicy">Spicy</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Calories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calories
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.calories}
                    onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                    placeholder="260"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Upload *
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the item..."
                  rows={3}
                  className="w-full px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
                    Available
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isNewArrival"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData(prev => ({ ...prev, isNewArrival: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isNewArrival" className="text-sm font-medium text-gray-700">
                    New Arrival
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isTrending"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData(prev => ({ ...prev, isTrending: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isTrending" className="text-sm font-medium text-gray-700">
                    Trending
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors w-full sm:w-auto text-sm"
                >
                  {editingItem ? 'Update Menu Item' : 'Create Menu Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Menu Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-0 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-xl shadow-xl w-full max-w-[95%] sm:max-w-2xl mx-3 sm:mx-0 mb-2 sm:mb-0 max-h-[80vh] sm:max-h-[85vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-xl font-bold text-gray-900">Menu Item Details</h2>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 -m-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

              {/* Item Header */}
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{viewingItem.name}</h3>
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    viewingItem.foodType === 'veg' ? 'bg-blue-100 text-blue-800' :
                    viewingItem.foodType === 'non_veg' ? 'bg-purple-100 text-purple-800' :
                    viewingItem.foodType === 'vegan' ? 'bg-teal-100 text-teal-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingItem.foodType === 'veg' ? 'Veg' :
                     viewingItem.foodType === 'non_veg' ? 'Non-Veg' :
                     viewingItem.foodType === 'vegan' ? 'Vegan' :
                     viewingItem.foodType}
                  </span>
                  {getSpiceLevelBadge(viewingItem.spiceLevel)}
                  {viewingItem.isNewArrival && (
                    <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-medium shadow-sm">
                      New Arrival
                    </span>
                  )}
                  {viewingItem.isTrending && (
                    <span className="px-2 sm:px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs sm:text-sm font-medium shadow-sm">
                      Trending
                    </span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-4">₹{viewingItem.price}</div>
              </div>

              {/* Item Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{viewingItem.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preparation Time:</span>
                        <span className="font-medium">{viewingItem.preparationTime} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock Quantity:</span>
                        <span className="font-medium">{viewingItem.stockQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sort Order:</span>
                        <span className="font-medium">{viewingItem.sortOrder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${viewingItem.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                          {viewingItem.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Nutritional Information</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calories:</span>
                        <span className="font-medium">{viewingItem.calories || 'Not specified'} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Spice Level:</span>
                        <span className="font-medium capitalize">{viewingItem.spiceLevel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Pricing & Offers</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium">₹{viewingItem.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-green-600">
                          {viewingItem.discountPercentage > 0 ? `${viewingItem.discountPercentage}% OFF` : 'No discount'}
                        </span>
                      </div>
                      {viewingItem.discountPercentage > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discounted Price:</span>
                          <span className="font-medium text-green-600">
                            ₹{(viewingItem.price * (1 - viewingItem.discountPercentage / 100)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {viewingItem.description || 'No description available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    closeViewModal();
                    handleEdit(viewingItem);
                  }}
                  className="px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto text-sm"
                >
                  Edit Item
                </button>
                <button
                  onClick={closeViewModal}
                  className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;

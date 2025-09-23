
const API_BASE_URL = import.meta.env.PROD
  ? "https://moodbite-food-delivery.onrender.com/api"
  : "http://localhost:5000/api";

const getAuthToken = () => {
  return localStorage.getItem('userToken');
};

const setAuthToken = (token) => {
  localStorage.setItem('userToken', token);
};

const removeAuthToken = () => {
  localStorage.removeItem('userToken');
};

const getAdminAuthToken = () => {
  return localStorage.getItem('adminToken');
};

const setAdminAuthToken = (token) => {
  localStorage.setItem('adminToken', token);
};

const removeAdminAuthToken = () => {
  localStorage.removeItem('adminToken');
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available (only if not already provided in headers)
  if (!headers['Authorization']) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      const extra = data && (data.error || data.errors)?.toString ? `: ${ (data.error || data.errors).toString() }` : '';
      throw new Error((data.message || `HTTP error! status: ${response.status}`) + extra);
    }

    return data;
  } catch (error) {
    console.error(`API Error ${endpoint}:`, error);
    throw error;
  }
};

const restaurantApiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/restaurant${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add restaurant auth token if available
  const token = localStorage.getItem('restaurantToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantData');
        // Redirect to login or show login modal
        window.location.href = '/restaurant/login';
        throw new Error('Session expired. Please login again.');
      }
      const extra = data && (data.error || data.errors)?.toString ? `: ${ (data.error || data.errors).toString() }` : '';
      throw new Error((data.message || `HTTP error! status: ${response.status}`) + extra);
    }

    return data;
  } catch (error) {
    console.error(`Restaurant API Error ${endpoint}:`, error);
    throw error;
  }
};

const adminApiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/admin${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add admin auth token if available
  const token = getAdminAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Admin API Error ${endpoint}:`, error);
    throw error;
  }
};

// User API functions
export const userAPI = {
  // Signup
  signup: async (userData) => {
    const response = await apiRequest('/users/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store token on successful signup
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Login
  login: async (credentials) => {
    const response = await apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token on successful login
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Get user profile
  getProfile: async () => {
    return await apiRequest('/users/profile');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Change password
  changePassword: async (passwordData) => {
    return await apiRequest('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // Add test order (for testing loyalty system)
  addTestOrder: async (amount) => {
    return await apiRequest('/users/test-order', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Logout (server-side + client-side)
  logout: async () => {
    try {
      await apiRequest('/users/logout', {
        method: 'POST',
      });
    } catch (error) {
    } finally {
      removeAuthToken();
      localStorage.removeItem('userData');
    }
  },

  forgotPassword: async (data) => {
    return await apiRequest('/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return await apiRequest('/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    return await apiRequest('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  // Get transaction history
  getTransactionHistory: async (page = 1, limit = 10, type = 'all') => {
    return await apiRequest(`/balance/transactions?page=${page}&limit=${limit}&type=${type}`);
  },

};

export const adminAPI = {
  signup: async (adminData) => {
    const response = await apiRequest('/admin/signup', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminData', JSON.stringify(response.data.admin));
    }
    
    return response;
  },

  login: async (credentials) => {
    const response = await apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminData', JSON.stringify(response.data.admin));
    }
    
    return response;
  },

  getProfile: async () => {
    return await apiRequest('/admin/profile', {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  updateProfile: async (profileData) => {
    return await apiRequest('/admin/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (passwordData) => {
    return await apiRequest('/admin/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify(passwordData),
    });
  },

  updateBankDetails: async (bankDetails) => {
    return await apiRequest('/balance/bank-details', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify(bankDetails),
    });
  },

  deleteBankDetails: async () => {
    return await apiRequest('/balance/bank-details', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
    });
  },

  validateBankAccount: async (accountNumber, ifscCode) => {
    return await apiRequest('/balance/validate-bank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify({ accountNumber, ifscCode }),
    });
  },

  // Razorpay integration
  fetchFromRazorpay: async () => {
    return await apiRequest('/balance/razorpay/fetch', {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  verifyRazorpay: async () => {
    return await apiRequest('/balance/razorpay/verify', {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  getRazorpayBalance: async () => {
    return await apiRequest('/balance/razorpay/balance', {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  testRazorpayFetch: async () => {
    return await apiRequest('/balance/razorpay/test', {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  getBalance: async () => {
    return await apiRequest('/balance', {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  logout: async () => {
    try {
      await apiRequest('/admin/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAdminAuthToken()}`
        }
      });
    } catch (error) {
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    }
  },

  getDashboardStats: async () => {
    return await apiRequest('/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  getRestaurantManagement: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/restaurants${qs ? `?${qs}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  getDeliveryBoyManagement: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/delivery-boys${qs ? `?${qs}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  getUserManagement: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${qs ? `?${qs}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  getOrderManagement: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/orders${qs ? `?${qs}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  // Restaurant Management
  updateRestaurantStatus: async (restaurantId, status) => {
    return await adminApiRequest(`/restaurants/${restaurantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Delivery Boy Management
  updateDeliveryBoyStatus: async (deliveryBoyId, approvalStatus) => {
    return await apiRequest(`/delivery-boys/admin/${deliveryBoyId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify({ approvalStatus }),
    });
  },

  // Forgot password
  forgotPassword: async (data) => {
    return await apiRequest('/admin/forgot-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify(data),
    });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return await apiRequest('/admin/verify-otp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify({ email, otp }),
    });
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    return await apiRequest('/admin/reset-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

};

// Restaurant API functions
export const restaurantAPI = {
  // Register restaurant (public)
  registerRestaurant: async (restaurantData) => {
    return await apiRequest('/restaurants/register', {
      method: 'POST',
      body: JSON.stringify(restaurantData),
    });
  },

  // Get all restaurants (admin)
  getAllRestaurants: async () => {
    return await apiRequest('/restaurants/admin/all', {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  // Get restaurant by ID (admin)
  getRestaurantById: async (id) => {
    return await apiRequest(`/restaurants/admin/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  // Create restaurant (admin)
  createRestaurant: async (restaurantData) => {
    return await apiRequest('/restaurants/admin/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify(restaurantData),
    });
  },

  // Update restaurant (admin)
  updateRestaurant: async (id, restaurantData) => {
    return await apiRequest(`/restaurants/admin/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify(restaurantData),
    });
  },

  // Delete restaurant (admin)
  deleteRestaurant: async (id) => {
    return await apiRequest(`/restaurants/admin/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
    });
  },

  // Update restaurant status (admin)
  updateRestaurantStatus: async (id, status) => {
    return await apiRequest(`/restaurants/admin/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify({ status }),
    });
  },
  listDeliveryBoys: async (id) => apiRequest(`/restaurants/admin/${id}/delivery-boys`, {
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
  assignDeliveryBoy: async (id, deliveryBoyId) => apiRequest(`/restaurants/admin/${id}/delivery-boys`, { 
    method: 'POST', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify({ deliveryBoyId }) 
  }),
  removeDeliveryBoy: async (id, riderId) => apiRequest(`/restaurants/admin/${id}/delivery-boys/${riderId}`, { 
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
};

export const menuAPI = {
  getAllItems: async () => apiRequest('/menu/admin/items', {
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
  getPublicItems: async () => apiRequest('/menu/items'),
  getTrendingItems: async () => apiRequest('/menu/trending'),
  getNewArrivalItems: async () => apiRequest('/menu/new-arrivals'),
  createItem: async (data) => apiRequest('/menu/admin/items', { 
    method: 'POST', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify(data) 
  }),
  updateItem: async (id, data) => apiRequest(`/menu/admin/items/${id}`, { 
    method: 'PUT', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify(data) 
  }),
  deleteItem: async (id) => apiRequest(`/menu/admin/items/${id}`, { 
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
  // Restaurant-scoped helpers
  getAllCategories: async () => apiRequest('/categories/admin', {
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
};

// Category API functions
export const categoryAPI = {
  // Get all categories (public)
  getAll: async () => {
    return await apiRequest('/categories');
  },

  // Get category by ID (public)
  getById: async (id) => {
    return await apiRequest(`/categories/${id}`);
  },

  // Admin: Get all categories with pagination and filtering
  getAllForAdmin: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/categories/admin/all${qs ? `?${qs}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },

  // Admin: Create new category
  create: async (categoryData) => {
    return await apiRequest('/categories/admin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify(categoryData),
    });
  },

  // Admin: Update category
  update: async (id, categoryData) => {
    return await apiRequest(`/categories/admin/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
      body: JSON.stringify(categoryData),
    });
  },

  // Admin: Delete category
  delete: async (id) => {
    return await apiRequest(`/categories/admin/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
    });
  },

  // Admin: Toggle category status
  toggleStatus: async (id) => {
    return await apiRequest(`/categories/admin/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      },
    });
  }
};

export const cartAPI = {
  // Get user's cart
  getUserCart: async () => apiRequest('/cart'),
  
  // Add item to cart
  addToCart: async (itemData) => apiRequest('/cart/add', {
    method: 'POST',
    body: JSON.stringify(itemData)
  }),
  
  // Update item quantity
  updateItemQuantity: async (itemId, quantity) => apiRequest('/cart/update', {
    method: 'PUT',
    body: JSON.stringify({ itemId, quantity })
  }),
  
  // Remove item from cart
  removeFromCart: async (itemId) => apiRequest(`/cart/remove/${itemId}`, {
    method: 'DELETE'
  }),
  
  // Clear cart
  clearCart: async () => apiRequest('/cart/clear', {
    method: 'DELETE'
  }),
  
  // Get cart summary (for header)
  getCartSummary: async () => apiRequest('/cart/summary')
};

export const ordersAPI = {
  placeOrder: async (payload) => apiRequest('/orders/place', { method: 'POST', body: JSON.stringify(payload) }),
  getMyOrders: async () => apiRequest('/orders'),
  getOrderById: async (id) => apiRequest(`/orders/${id}`),
  cancelMyOrder: async (id) => apiRequest(`/orders/${id}/cancel`, { method: 'POST' }),
  
  // Restaurant
  getRestaurantOrders: async () => apiRequest('/orders/restaurant', { headers: { 'Authorization': `Bearer ${localStorage.getItem('restaurantToken')}` } }),
  updateOrderStatus: async (orderId, statusData) => apiRequest(`/orders/restaurant/${orderId}/status`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('restaurantToken')}` }, body: JSON.stringify(statusData) }),
  
  // Delivery
  getDeliveryOrders: async () => apiRequest('/orders/delivery', { headers: { 'Authorization': `Bearer ${localStorage.getItem('deliveryToken')}` } }),
  updateDeliveryStatus: async (orderId, statusData) => apiRequest(`/orders/delivery/${orderId}/status`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('deliveryToken')}` }, body: JSON.stringify(statusData) }),
  verifyDeliveryOTP: async (orderId, otp) => apiRequest(`/orders/delivery/${orderId}/verify-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('deliveryToken')}` }, body: JSON.stringify({ otp }) }),
  resendDeliveryOTP: async (orderId) => apiRequest(`/orders/delivery/${orderId}/resend-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('deliveryToken')}` } }),
  
  // Admin
  adminList: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/orders/admin/all${qs ? `?${qs}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },
  adminUpdate: async (id, data) => apiRequest(`/orders/admin/${id}`, { 
    method: 'PUT', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify(data) 
  }),
  adminAssignDelivery: async (id, deliveryBoyId) => apiRequest(`/orders/admin/${id}/assign-delivery`, { 
    method: 'POST', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify({ deliveryBoyId }) 
  }),
  adminAutoAssign: async (id) => apiRequest(`/orders/admin/${id}/auto-assign`, { 
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
};

export const deliveryBoysAPI = {
  list: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/delivery-boys/admin${qs ? `?${qs}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${getAdminAuthToken()}`
      }
    });
  },
  create: async (data) => apiRequest('/delivery-boys/admin', { 
    method: 'POST', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify(data) 
  }),
  update: async (id, data) => apiRequest(`/delivery-boys/admin/${id}`, { 
    method: 'PUT', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify(data) 
  }),
  remove: async (id) => apiRequest(`/delivery-boys/admin/${id}`, { 
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
  approve: async (id) => apiRequest(`/delivery-boys/admin/${id}/approve`, { 
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
  reject: async (id, reason) => apiRequest(`/delivery-boys/admin/${id}/reject`, { 
    method: 'POST', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify({ reason }) 
  }),
  
  // Online/Offline status management
  goOnline: async (id, duration = 8) => apiRequest(`/delivery-boys/${id}/online`, { method: 'POST', body: JSON.stringify({ duration }) }),
  goOffline: async (id) => apiRequest(`/delivery-boys/${id}/offline`, { method: 'POST' }),
  getOnline: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/delivery-boys/online${qs ? `?${qs}` : ''}`);
  },
  getBalance: async () => apiRequest('/balance', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('deliveryToken')}`
    }
  }),
};

export const usersAPI = {
  getAll: async () => apiRequest('/users/admin', {
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
  update: async (id, data) => apiRequest(`/users/admin/${id}`, { 
    method: 'PUT', 
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    },
    body: JSON.stringify(data) 
  }),
  suspend: async (id) => apiRequest(`/users/admin/${id}/suspend`, { 
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  }),
};

export const analyticsAPI = {
  summary: async () => apiRequest('/analytics/summary', {
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`
    }
  })
};



// Restaurant Authentication API
export const restaurantAuthAPI = {
  // Login
  login: async (credentials) => {
    const response = await apiRequest('/restaurant/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token on successful login
    if (response.success && response.data.token) {
      localStorage.setItem('restaurantToken', response.data.token);
      localStorage.setItem('restaurantData', JSON.stringify(response.data.restaurant));
    }
    
    return response;
  },

  // Get restaurant profile
  getRestaurantProfile: async () => {
    const token = localStorage.getItem('restaurantToken');
    if (!token) throw new Error('No restaurant token found');
    
    return await restaurantApiRequest('/profile');
  },

  // Update restaurant profile
  updateRestaurantProfile: async (profileData) => {
    const token = localStorage.getItem('restaurantToken');
    if (!token) throw new Error('No restaurant token found');
    
    return await restaurantApiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Get menu items for restaurant
  getMenuItems: async () => {
    return await restaurantApiRequest('/menu-items');
  },
  createMenuItem: async (data) => restaurantApiRequest('/menu-items', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: async (id, data) => restaurantApiRequest(`/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: async (id) => restaurantApiRequest(`/menu-items/${id}`, { method: 'DELETE' }),

  // Logout
  logout: async () => {
    try {
      const token = localStorage.getItem('restaurantToken');
      if (token) {
        await restaurantApiRequest('/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
    } finally {
      localStorage.removeItem('restaurantToken');
      localStorage.removeItem('restaurantData');
    }
  },

  // Forgot password
  forgotPassword: async (data) => {
    return await restaurantApiRequest('/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return await restaurantApiRequest('/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    return await restaurantApiRequest('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

};

// Delivery Authentication API
export const deliveryAuthAPI = {
  // Register
  register: async (deliveryData) => {
    return await apiRequest('/delivery/register', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  },

  // Login
  login: async (credentials) => {
    const response = await apiRequest('/delivery/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token on successful login (only if approved)
    if (response.success && response.data.token && !response.data.requiresApproval) {
      localStorage.setItem('deliveryToken', response.data.token);
      localStorage.setItem('deliveryData', JSON.stringify(response.data.rider));
    }
    
    return response;
  },

  

  // Get delivery boy profile
  getProfile: async () => {
    const token = localStorage.getItem('deliveryToken');
    if (!token) throw new Error('No delivery token found');
    
    return await apiRequest('/delivery/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Update delivery boy profile
  updateProfile: async (profileData) => {
    const token = localStorage.getItem('deliveryToken');
    if (!token) throw new Error('No delivery token found');
    
    return await apiRequest('/delivery/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData),
    });
  },

  // Update location
  updateLocation: async (location) => {
    const token = localStorage.getItem('deliveryToken');
    if (!token) throw new Error('No delivery token found');
    
    return await apiRequest('/delivery/location', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(location),
    });
  },

  // Update status (online/offline)
  updateStatus: async (statusData) => {
    const token = localStorage.getItem('deliveryToken');
    if (!token) throw new Error('No delivery token found');
    
    return await apiRequest('/delivery/status', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statusData),
    });
  },

  // Logout
  logout: async () => {
    try {
      const token = localStorage.getItem('deliveryToken');
      if (token) {
        await apiRequest('/delivery/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
    } finally {
      localStorage.removeItem('deliveryToken');
      localStorage.removeItem('deliveryData');
    }
  },

  // Forgot password
  forgotPassword: async (data) => {
    return await apiRequest('/delivery/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return await apiRequest('/delivery/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    return await apiRequest('/delivery/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

};



// Rating API
export const ratingAPI = {
  // Submit rating for delivered order
  submitRating: async (orderId, data) => {
    return apiRequest(`/ratings/order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get rating for a specific order
  getOrderRating: async (orderId) => {
    return apiRequest(`/ratings/order/${orderId}`);
  },

  // Check if order can be rated
  canRateOrder: async (orderId) => {
    return apiRequest(`/ratings/order/${orderId}/can-rate`);
  },

  // Get user's rating history
  getUserRatings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/ratings/user/history?${queryString}`);
  },

  // Get restaurant ratings (for restaurant owners)
  getRestaurantRatings: async (restaurantId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/ratings/restaurant/${restaurantId}?${queryString}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('restaurantToken')}` }
    });
  },

  // Get rating statistics (for admin)
  getRatingStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/ratings/stats?${queryString}`);
  }
};

// Payment API functions
export const paymentAPI = {
  // Create Razorpay order
  createRazorpayOrder: async (amount, receipt) => {
    return apiRequest('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, receipt }),
    });
  },

  // Verify Razorpay payment
  verifyRazorpayPayment: async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    return apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
    });
  }
};

// Health check
export const healthCheck = async () => {
  return await apiRequest('/health');
};

export default {
  userAPI,
  adminAPI,
  restaurantAPI,
  menuAPI,
  categoryAPI,
  usersAPI,
  restaurantAuthAPI,
  deliveryAuthAPI,
  healthCheck,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getAdminAuthToken,
  setAdminAuthToken,
  removeAdminAuthToken,
};

// Balance API
export const balanceAPI = {
  // Get balance for current user
  getBalance: () => {
    const token = getAuthToken();
    return apiRequest('/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  // Get balance for restaurant
  getRestaurantBalance: () => {
    const token = localStorage.getItem('restaurantToken');
    if (!token) throw new Error('No restaurant token found');
    
    return apiRequest('/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  // Update bank details
  updateBankDetails: (bankDetails) => apiRequest('/balance/bank-details', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bankDetails),
  }),

  // Update restaurant bank details
  updateRestaurantBankDetails: (bankDetails) => {
    const token = localStorage.getItem('restaurantToken');
    if (!token) throw new Error('No restaurant token found');
    
    return apiRequest('/balance/bank-details', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bankDetails),
    });
  },

  // Delete bank details
  deleteBankDetails: () => apiRequest('/balance/bank-details', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  }),

  // Delete restaurant bank details
  deleteRestaurantBankDetails: () => {
    const token = localStorage.getItem('restaurantToken');
    if (!token) throw new Error('No restaurant token found');
    
    return apiRequest('/balance/bank-details', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  // Get balance for delivery boy
  getDeliveryBoyBalance: () => {
    const token = localStorage.getItem('deliveryToken');
    if (!token) throw new Error('No delivery token found');
    
    return apiRequest('/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  // Update delivery boy bank details
  updateDeliveryBoyBankDetails: (bankDetails) => {
    const token = localStorage.getItem('deliveryToken');
    if (!token) throw new Error('No delivery token found');
    
    return apiRequest('/balance/bank-details', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bankDetails),
    });
  },

  // Delete delivery boy bank details
  deleteDeliveryBoyBankDetails: () => {
    const token = localStorage.getItem('deliveryToken');
    if (!token) throw new Error('No delivery token found');
    
    return apiRequest('/balance/bank-details', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  // Get transaction history
  getTransactionHistory: () => apiRequest('/balance/transactions', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  }),

  // Admin: Get all balances
  getAllBalances: () => apiRequest('/balance/admin/all', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAdminAuthToken()}`,
      'Content-Type': 'application/json',
    },
  }),

  // Get commission rates (public endpoint)
  getCommissionRates: () => apiRequest('/balance/commission-rates', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }),
};

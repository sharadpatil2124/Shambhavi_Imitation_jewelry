import api from './api.js';

const adminService = {
  // Authentication
  adminLogin: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  },

  updateProfile: async (profileData) => {
    return await api.put('/users/profile', profileData);
  },
  verifyEmailChange: async (otp) => {
    return await api.post('/users/verify-email-change', { otp });
  },

  // Dashboard Analytics
  getDashboardAnalytics: async () => {
    return await api.get('/admin/dashboard');
  },
  getSalesReport: async () => {
    return await api.get('/admin/sales-report');
  },
  getRevenueStats: async () => {
    return await api.get('/admin/revenue-stats');
  },

  // Customer Management
  getUsers: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },
  getUserDetails: async (id) => {
    return await api.get(`/admin/users/${id}`);
  },

  // Cart & Wishlist Analytics
  getCartWishlistAnalytics: async () => {
    return await api.get('/admin/cart-wishlist-analytics');
  },

  // Settings
  getSettings: async () => {
    return await api.get('/admin/settings');
  },
  updateSettings: async (settingsData) => {
    return await api.put('/admin/settings', settingsData);
  },

  // Review Management
  getReviews: async (params = {}) => {
    return await api.get('/reviews', { params });
  },
  toggleReviewApproval: async (id) => {
    return await api.put(`/reviews/${id}/approve`);
  },
  deleteReview: async (id) => {
    return await api.delete(`/reviews/${id}`);
  },

  // Product Management (Admin CRUD)
  createProduct: async (formData) => {
    return await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updateProduct: async (id, formData) => {
    return await api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteProduct: async (id) => {
    return await api.delete(`/products/${id}`);
  },

  // Category Management (Admin CRUD)
  createCategory: async (formData) => {
    return await api.post('/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updateCategory: async (id, formData) => {
    return await api.put(`/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteCategory: async (id) => {
    return await api.delete(`/categories/${id}`);
  },

  // Order Management (Admin CRUD)
  getOrders: async (params = {}) => {
    return await api.get('/orders', { params });
  },
  getOrderDetails: async (id) => {
    return await api.get(`/orders/${id}`);
  },
  updateOrderStatus: async (id, status, trackingId = '') => {
    return await api.put(`/orders/${id}/status`, { orderStatus: status, trackingId });
  },
  refundOrder: async (id) => {
    return await api.put(`/orders/${id}/refund`);
  }
};

export default adminService;

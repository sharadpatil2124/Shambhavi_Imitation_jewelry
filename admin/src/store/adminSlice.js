import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../services/adminService.js';

// Thunks
export const fetchDashboardAnalytics = createAsyncThunk(
  'admin/fetchDashboardAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboardAnalytics();
      return response.analytics;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSalesReport = createAsyncThunk(
  'admin/fetchSalesReport',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getSalesReport();
      return response.monthlySales;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRevenueStats = createAsyncThunk(
  'admin/fetchRevenueStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getRevenueStats();
      return response.dailyRevenue;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getUsers(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserDetails = createAsyncThunk(
  'admin/fetchUserDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.getUserDetails(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCartWishlistAnalytics = createAsyncThunk(
  'admin/fetchCartWishlistAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getCartWishlistAnalytics();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSettings = createAsyncThunk(
  'admin/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getSettings();
      return response.settings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSettingsThunk = createAsyncThunk(
  'admin/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await adminService.updateSettings(settingsData);
      return response.settings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchReviewsThunk = createAsyncThunk(
  'admin/fetchReviews',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getReviews(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleReviewApprovalThunk = createAsyncThunk(
  'admin/toggleReviewApproval',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.toggleReviewApproval(id);
      return response.review;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteReviewThunk = createAsyncThunk(
  'admin/deleteReview',
  async (id, { rejectWithValue }) => {
    try {
      await adminService.deleteReview(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrdersThunk = createAsyncThunk(
  'admin/fetchOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getOrders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOrderStatusThunk = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ id, status, trackingId, rejectionReason, courierName }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateOrderStatus(id, status, trackingId, rejectionReason, courierName);
      return response.order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const refundOrderThunk = createAsyncThunk(
  'admin/refundOrder',
  async (payload, { rejectWithValue }) => {
    try {
      const id = typeof payload === 'string' ? payload : payload.id;
      const data = typeof payload === 'object' ? { amount: payload.amount, reason: payload.reason } : {};
      const response = await adminService.refundOrder(id, data);
      return response.order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial State
const initialState = {
  analytics: {
    counters: {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalReviews: 0,
      totalRevenue: 0,
      totalRefunded: 0,
      refundedOrders: 0
    },
    orderStatus: {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      cancellationRequested: 0,
      refunded: 0
    },
    lowStockAlerts: []
  },
  monthlySales: [],
  dailyRevenue: [],
  users: [],
  totalUsersCount: 0,
  usersPage: 1,
  usersPages: 1,
  selectedUser: null,
  selectedUserOrders: [],
  cartWishlist: {
    wishlistAnalytics: [],
    cartAnalytics: {
      totalCarts: 0,
      totalValue: 0,
      totalItems: 0,
      popularItems: [],
      cartsList: []
    }
  },
  settings: null,
  reviews: [],
  totalReviewsCount: 0,
  reviewsPage: 1,
  reviewsPages: 1,
  orders: [],
  totalOrdersCount: 0,
  ordersPage: 1,
  ordersPages: 1,
  loading: false,
  error: null
};

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Dashboard Analytics
    builder.addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
    });

    // Sales Report
    builder.addCase(fetchSalesReport.fulfilled, (state, action) => {
      state.loading = false;
      state.monthlySales = action.payload;
    });

    // Revenue Stats
    builder.addCase(fetchRevenueStats.fulfilled, (state, action) => {
      state.loading = false;
      state.dailyRevenue = action.payload;
    });

    // Users
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload.users;
      state.totalUsersCount = action.payload.total;
      state.usersPage = action.payload.page;
      state.usersPages = action.payload.pages;
    });

    // User Details
    builder.addCase(fetchUserDetails.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedUser = action.payload.user;
      state.selectedUserOrders = action.payload.orders;
    });

    // Cart/Wishlist Analytics
    builder.addCase(fetchCartWishlistAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      state.cartWishlist = {
        wishlistAnalytics: action.payload.wishlistAnalytics,
        cartAnalytics: action.payload.cartAnalytics
      };
    });

    // Settings
    builder.addCase(fetchSettings.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = action.payload;
    });

    builder.addCase(updateSettingsThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = action.payload;
    });

    // Reviews
    builder.addCase(fetchReviewsThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.reviews = action.payload.reviews;
      state.totalReviewsCount = action.payload.total;
      state.reviewsPage = action.payload.page;
      state.reviewsPages = action.payload.pages;
    });

    builder.addCase(toggleReviewApprovalThunk.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.reviews.findIndex((r) => r._id === action.payload._id);
      if (index !== -1) {
        state.reviews[index].isApproved = action.payload.isApproved;
      }
    });

    builder.addCase(deleteReviewThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.reviews = state.reviews.filter((r) => r._id !== action.payload);
    });

    // Orders
    builder.addCase(fetchOrdersThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload.orders;
      state.totalOrdersCount = action.payload.total;
      state.ordersPage = action.payload.page;
      state.ordersPages = action.payload.pages;
    });

    builder.addCase(updateOrderStatusThunk.fulfilled, (state, action) => {
      state.loading = false;
      const updatedOrder = action.payload;
      const index = state.orders.findIndex((o) => o._id === updatedOrder._id);
      const previousOrder = index !== -1 ? state.orders[index] : null;
      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }

      // If status changed to Refunded, automatically update counters
      if (updatedOrder.orderStatus === 'Refunded' && previousOrder?.orderStatus !== 'Refunded') {
        const refundVal = updatedOrder.refundAmount || updatedOrder.totalPrice || 0;
        if (state.analytics?.counters) {
          if (previousOrder?.orderStatus === 'Delivered') {
            state.analytics.counters.totalRevenue = Math.max(0, (state.analytics.counters.totalRevenue || 0) - refundVal);
            state.analytics.counters.totalOrders = Math.max(0, (state.analytics.counters.totalOrders || 0) - 1);
          }
          state.analytics.counters.totalRefunded = (state.analytics.counters.totalRefunded || 0) + refundVal;
          state.analytics.counters.refundedOrders = (state.analytics.counters.refundedOrders || 0) + 1;
        }
        if (state.analytics?.orderStatus) {
          if (previousOrder?.orderStatus === 'Delivered' && state.analytics.orderStatus.delivered > 0) {
            state.analytics.orderStatus.delivered -= 1;
          }
          state.analytics.orderStatus.refunded = (state.analytics.orderStatus.refunded || 0) + 1;
        }
      }
    });

    builder.addCase(refundOrderThunk.fulfilled, (state, action) => {
      state.loading = false;
      const refundedOrder = action.payload;
      const index = state.orders.findIndex((o) => o._id === refundedOrder._id);
      const previousOrder = index !== -1 ? state.orders[index] : null;
      if (index !== -1) {
        state.orders[index] = refundedOrder;
      }

      // Automatically reduce dashboard revenue and increase refunded metrics
      const refundVal = refundedOrder.refundAmount || refundedOrder.totalPrice || 0;
      if (state.analytics?.counters) {
        if (!previousOrder || previousOrder.orderStatus === 'Delivered') {
          state.analytics.counters.totalRevenue = Math.max(0, (state.analytics.counters.totalRevenue || 0) - refundVal);
          state.analytics.counters.totalOrders = Math.max(0, (state.analytics.counters.totalOrders || 0) - 1);
        }
        state.analytics.counters.totalRefunded = (state.analytics.counters.totalRefunded || 0) + refundVal;
        state.analytics.counters.refundedOrders = (state.analytics.counters.refundedOrders || 0) + 1;
      }
      if (state.analytics?.orderStatus) {
        if (previousOrder?.orderStatus === 'Delivered' && state.analytics.orderStatus.delivered > 0) {
          state.analytics.orderStatus.delivered -= 1;
        } else if (previousOrder?.orderStatus === 'Cancelled' && state.analytics.orderStatus.cancelled > 0) {
          state.analytics.orderStatus.cancelled -= 1;
        }
        state.analytics.orderStatus.refunded = (state.analytics.orderStatus.refunded || 0) + 1;
      }
    });

    // General loading/error handlers
    builder.addMatcher(
      (action) => action.type.endsWith('/pending'),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      (action) => action.type.endsWith('/rejected'),
      (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
      }
    );
  }
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;

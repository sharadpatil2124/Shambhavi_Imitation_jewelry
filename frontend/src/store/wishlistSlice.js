import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  items: []
};

const mapDbWishlistItemToRedux = (product) => ({
  id: product._id || product.id,
  name: product.name,
  category: typeof product.category === 'object' ? product.category?.name : product.category,
  price: product.price,
  originalPrice: product.originalPrice,
  image: product.images ? product.images[0] : '',
  isTrending: product.isTrending,
  isFeatured: product.isFeatured,
  rating: product.rating,
  reviewsCount: product.reviewsCount
});

// Helper to check if token exists
const hasAuthToken = () => !!localStorage.getItem('token');

export const fetchWishlistThunk = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      if (!hasAuthToken()) return [];
      const response = await api.get('/wishlist');
      if (response && response.success && response.wishlist) {
        return (response.wishlist.products || []).map(mapDbWishlistItemToRedux);
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleWishlistThunk = createAsyncThunk(
  'wishlist/toggleWishlist',
  async (product, { getState, rejectWithValue }) => {
    const productId = product._id || product.id;
    try {
      if (hasAuthToken()) {
        const currentItems = getState().wishlist.items;
        const exists = currentItems.some(item => item.id === productId);
        let response;
        if (exists) {
          response = await api.delete(`/wishlist/${productId}`);
        } else {
          response = await api.post('/wishlist', { productId });
        }
        if (response && response.success && response.wishlist) {
          return (response.wishlist.products || []).map(mapDbWishlistItemToRedux);
        }
      }
      
      // Guest fallback (local simulation)
      const currentItems = getState().wishlist.items;
      const index = currentItems.findIndex(item => item.id === productId);
      let newItems = [...currentItems];
      if (index >= 0) {
        newItems.splice(index, 1);
      } else {
        newItems.push({
          id: product._id || product.id,
          name: product.name,
          category: typeof product.category === 'object' ? product.category?.name : product.category,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.images ? product.images[0] : '',
          isTrending: product.isTrending,
          isFeatured: product.isFeatured,
          rating: product.rating,
          reviewsCount: product.reviewsCount
        });
      }
      return newItems;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFromWishlistThunk = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { getState, rejectWithValue }) => {
    try {
      if (hasAuthToken()) {
        const response = await api.delete(`/wishlist/${productId}`);
        if (response && response.success && response.wishlist) {
          return (response.wishlist.products || []).map(mapDbWishlistItemToRedux);
        }
      }
      
      // Guest fallback
      const currentItems = getState().wishlist.items;
      return currentItems.filter(item => item.id !== productId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(toggleWishlistThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(removeFromWishlistThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  }
});

export const { clearWishlist } = wishlistSlice.actions;
export const toggleWishlist = toggleWishlistThunk;
export const removeFromWishlist = removeFromWishlistThunk;

export default wishlistSlice.reducer;

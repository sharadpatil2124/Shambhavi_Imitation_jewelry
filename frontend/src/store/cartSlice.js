import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  items: [],
  subtotal: 0,
  shipping: 100, // dynamically updated below
  total: 0,
  taxRate: 3,
  shippingCharge: 100,
  freeShippingThreshold: 1500
};

const calculateTotals = (state) => {
  const subtotal = state.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  state.subtotal = subtotal;
  
  const threshold = state.freeShippingThreshold !== undefined ? state.freeShippingThreshold : 1500;
  const charge = state.shippingCharge !== undefined ? state.shippingCharge : 100;

  if (subtotal > threshold || subtotal === 0) {
    state.shipping = 0;
  } else {
    state.shipping = charge;
  }
  
  state.total = state.subtotal + state.shipping;
};

const mapDbCartItemToRedux = (item) => ({
  id: item.product?._id || item.product,
  name: item.product?.name || '',
  category: typeof item.product?.category === 'object' ? item.product?.category?.name : (item.product?.category || ''),
  price: item.product?.price || 0,
  originalPrice: item.product?.originalPrice || 0,
  image: item.product?.images ? item.product.images[0] : '',
  selectedColor: item.color || "Default",
  selectedSize: item.size || "Standard",
  quantity: item.quantity,
  sku: item.product?.sku || ''
});

// Helper to check if token exists
const hasAuthToken = () => !!localStorage.getItem('token');

export const fetchCartThunk = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      if (!hasAuthToken()) return [];
      const response = await api.get('/cart');
      if (response && response.success && response.cart) {
        return (response.cart.items || []).map(mapDbCartItemToRedux);
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addToCartThunk = createAsyncThunk(
  'cart/addToCart',
  async ({ product, quantity = 1, color, size }, { getState, rejectWithValue }) => {
    const selectedColor = color || (product.colors && product.colors[0]) || "Default";
    const selectedSize = size || (product.sizes && product.sizes[0]) || "Standard";
    
    try {
      if (hasAuthToken()) {
        const response = await api.post('/cart', {
          productId: product._id || product.id,
          quantity,
          color: selectedColor,
          size: selectedSize
        });
        if (response && response.success && response.cart) {
          return (response.cart.items || []).map(mapDbCartItemToRedux);
        }
      }
      
      // Guest fallback (local simulation)
      const currentItems = getState().cart.items;
      const existingItemIndex = currentItems.findIndex(
        item => item.id === (product._id || product.id) && 
        item.selectedColor === selectedColor && 
        item.selectedSize === selectedSize
      );

      let newItems = [...currentItems];
      if (existingItemIndex > -1) {
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
      } else {
        newItems.push({
          id: product._id || product.id,
          name: product.name,
          category: typeof product.category === 'object' ? product.category?.name : product.category,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.images ? product.images[0] : '',
          selectedColor,
          selectedSize,
          quantity,
          sku: product.sku
        });
      }
      return newItems;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateQuantityThunk = createAsyncThunk(
  'cart/updateQuantity',
  async ({ id, selectedColor, selectedSize, quantity }, { getState, rejectWithValue }) => {
    try {
      if (hasAuthToken()) {
        const response = await api.put('/cart', {
          productId: id,
          quantity,
          color: selectedColor,
          size: selectedSize
        });
        if (response && response.success && response.cart) {
          return (response.cart.items || []).map(mapDbCartItemToRedux);
        }
      }
      
      // Guest fallback
      const currentItems = getState().cart.items;
      return currentItems.map(item => {
        if (item.id === id && item.selectedColor === selectedColor && item.selectedSize === selectedSize) {
          return { ...item, quantity };
        }
        return item;
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFromCartThunk = createAsyncThunk(
  'cart/removeFromCart',
  async ({ id, selectedColor, selectedSize }, { getState, rejectWithValue }) => {
    try {
      if (hasAuthToken()) {
        const response = await api.delete('/cart', {
          data: {
            productId: id,
            color: selectedColor,
            size: selectedSize
          }
        });
        if (response && response.success && response.cart) {
          return (response.cart.items || []).map(mapDbCartItemToRedux);
        }
      }
      
      // Guest fallback
      const currentItems = getState().cart.items;
      return currentItems.filter(
        item => !(item.id === id && item.selectedColor === selectedColor && item.selectedSize === selectedSize)
      );
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const clearCartThunk = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    return [];
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartSettings: (state, action) => {
      state.taxRate = action.payload.taxRate ?? state.taxRate;
      state.shippingCharge = action.payload.shippingCharge ?? state.shippingCharge;
      state.freeShippingThreshold = action.payload.freeShippingThreshold ?? state.freeShippingThreshold;
      calculateTotals(state);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        calculateTotals(state);
      })
      .addCase(addToCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        calculateTotals(state);
      })
      .addCase(updateQuantityThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        calculateTotals(state);
      })
      .addCase(removeFromCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        calculateTotals(state);
      })
      .addCase(clearCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        calculateTotals(state);
      });
  }
});

export const { setCartSettings } = cartSlice.actions;
export const addToCart = addToCartThunk;
export const removeFromCart = removeFromCartThunk;
export const updateQuantity = updateQuantityThunk;
export const clearCart = clearCartThunk;

export default cartSlice.reducer;
